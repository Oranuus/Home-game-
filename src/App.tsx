/**
 * The Haunted House - Main App Engine
 * 2D Pixel Horror Survival Game inspired by 'House' on Steam.
 * Features 2.5D floor movement in all 4 directions, widescreen landscape presentation,
 * and high-fidelity retro gothic visuals.
 */
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { INITIAL_ROOMS } from './game/houseData';
import { PixelRenderer } from './game/pixelRenderer';
import { soundEngine } from './audio/soundEngine';
import { bgmPlayer } from './audio/bgmPlayer';
import { TouchpadControls } from './components/TouchpadControls';
import { GameHUD } from './components/GameHUD';
import { GuideModal } from './components/GuideModal';
import { TabbyDiaryModal } from './components/TabbyDiaryModal';
import { MonsterEntity, PlayerState, RoomDefinition, RoomId, InteractiveProp } from './types/game';
import { Play, RotateCcw, HelpCircle, Skull, Maximize2, Smartphone, Music, BookOpen } from 'lucide-react';
import {
  loadDiaryState,
  saveDiaryState,
  getActiveDiaryEntries,
  getEndingsTree,
  RunNote,
  StoredDiaryData,
} from './game/diaryState';

export default function App() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'REWINDING' | 'ESCAPED'>('START');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showDiaryModal, setShowDiaryModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);

  // Tabby's Diary & Endings Engine state
  const [storedDiary, setStoredDiary] = useState<StoredDiaryData>(() => loadDiaryState());
  const [runNotes, setRunNotes] = useState<RunNote[]>([]);
  const [endingVictoryType, setEndingVictoryType] = useState<1 | 2 | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<PixelRenderer | null>(null);

  // Active Rooms & Map State
  const roomsRef = useRef<Record<RoomId, RoomDefinition>>(JSON.parse(JSON.stringify(INITIAL_ROOMS)));
  const [currentRoomId, setCurrentRoomId] = useState<RoomId>('tabby_bedroom');
  
  const [player, setPlayer] = useState<PlayerState>({
    x: 180,
    y: 235, // Foot position on 2D floor (between floorMinY=195 and floorMaxY=295)
    roomId: 'tabby_bedroom',
    facing: 'right',
    vx: 0,
    vy: 0,
    isMoving: false,
    isRunning: false,
    isSneaking: false,
    isHiding: false,
    hidingSpotId: null,
    flashlightOn: false,
    battery: 100,
    heartRate: 72,
    inventory: [],
    selectedItemIndex: 0,
    isDead: false,
    deathReason: null,
    loopCount: 1,
  });

  const playerRef = useRef(player);
  playerRef.current = player;

  // Monsters
  const getInitialMonsters = (): MonsterEntity[] => [
    {
      id: 'stalker_1',
      type: 'stalker',
      name: 'The Stalker',
      roomId: 'living_room',
      x: 350,
      y: 240,
      facing: 'left',
      speed: 1.8,
      state: 'patrol',
      detectionRadius: 240,
      stunTimer: 0,
      active: true,
      hp: 2,
      maxHp: 2,
    },
    {
      id: 'attic_ghoul_1',
      type: 'attic_ghoul',
      name: 'Attic Specter',
      roomId: 'attic',
      x: 460,
      y: 230,
      facing: 'left',
      speed: 1.2,
      state: 'patrol',
      detectionRadius: 190,
      stunTimer: 0,
      active: true,
      hp: 2,
      maxHp: 2,
    },
  ];

  const monstersRef = useRef<MonsterEntity[]>(getInitialMonsters());

  // Salt lines placed by player
  const saltLinesRef = useRef<{ roomId: string; x: number }[]>([]);

  // Timer & Clocks
  const [gameTimeSec, setGameTimeSec] = useState<number>(0);
  const gameTimeRef = useRef(0);
  gameTimeRef.current = gameTimeSec;

  // Nearby Prop for Prompt
  const [nearbyProp, setNearbyProp] = useState<InteractiveProp | null>(null);
  const nearbyPropRef = useRef(nearbyProp);
  nearbyPropRef.current = nearbyProp;

  // Controls input state (keys held down)
  const inputRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    run: false,
  });

  // Analog thumbstick vector & room transition debounce
  const joystickVectorRef = useRef({ x: 0, y: 0 });
  const isTransitioningRef = useRef(false);

  // Orientation Check for Landscape Experience
  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerWidth < window.innerHeight;
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  }, []);

  // Request Fullscreen & Landscape lock where available
  const handleRequestLandscape = useCallback(() => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      }
      if (screen.orientation && 'lock' in screen.orientation) {
        (screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch {
      // browser security policy may require user gesture
    }
  }, []);

  // Initialize Canvas Renderer
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        rendererRef.current = new PixelRenderer(ctx);
      }
    }
  }, []);

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    const muted = soundEngine.toggleMute();
    bgmPlayer.setMuted(muted);
    setIsMuted(muted);
  }, []);

  // Death & Rewind Loop
  const triggerDeathLoop = useCallback((reason: string) => {
    if (playerRef.current.isDead) return;

    soundEngine.playMonsterAttack();
    setPlayer((prev) => ({
      ...prev,
      isDead: true,
      deathReason: reason,
    }));

    setGameState('REWINDING');
    showToast(reason);

    setTimeout(() => {
      soundEngine.playRewindEffect();
    }, 700);

    // After rewind, wake up back in bed
    setTimeout(() => {
      // If Ending 2 was beaten in previous loop, commit its diary write upon respawn
      if (storedDiary.pendingEnding2RespawnWrite) {
        setStoredDiary((prev) => {
          const updated: StoredDiaryData = {
            ...prev,
            pendingEnding2RespawnWrite: false,
          };
          saveDiaryState(updated);
          return updated;
        });
        setTimeout(() => {
          showToast('مذكرات تابي: كَتَبَت تابي في مذكراتها أنها أنهت النهاية الثانية بنجاح!');
        }, 1200);
      }

      monstersRef.current = getInitialMonsters();
      setRunNotes([]);
      setEndingVictoryType(null);

      setPlayer((prev) => ({
        ...prev,
        x: 180,
        y: 235,
        roomId: 'tabby_bedroom',
        facing: 'right',
        isMoving: false,
        isRunning: false,
        isHiding: false,
        hidingSpotId: null,
        isDead: false,
        deathReason: null,
        heartRate: 72,
        loopCount: prev.loopCount + 1,
        inventory: [],
        selectedItemIndex: 0,
        flashlightOn: false,
        battery: 100,
      }));
      roomsRef.current = JSON.parse(JSON.stringify(INITIAL_ROOMS));
      saltLinesRef.current = [];
      setCurrentRoomId('tabby_bedroom');
      setGameTimeSec(0);
      setGameState('PLAYING');
      showToast('استيقظتِ مجدداً في السرير... دقات الساعة تعود للبداية ومواقع المفاتيح ثابتة!');
    }, 3200);
  }, [showToast, storedDiary.pendingEnding2RespawnWrite]);

  // Ending 1: Escape (الخروج)
  const triggerEnding1Victory = useCallback(() => {
    soundEngine.playDoor(true);
    setStoredDiary((prev) => {
      const updated: StoredDiaryData = {
        ...prev,
        completedEndings: {
          ...prev.completedEndings,
          ending_1: { completedAt: Date.now(), loopCount: playerRef.current.loopCount },
        },
      };
      saveDiaryState(updated);
      return updated;
    });
    setEndingVictoryType(1);
    setGameState('ESCAPED');
    showToast('النهاية الأولى: نجحتِ في الهروب! كُتب إنجاز الهروب في مذكرات تابي.');
  }, [showToast]);

  // Ending 2: Slay Monsters with Slingshot (قتل الوحوش بالمنبل)
  const triggerEnding2Victory = useCallback(() => {
    soundEngine.playMonsterGrowl();
    // User requested: "و طبعا لما تخلص النهاية تابي بتكتب أنها خلصتها بعد ما ترسبن دور جديد"
    setStoredDiary((prev) => {
      const updated: StoredDiaryData = {
        ...prev,
        completedEndings: {
          ...prev.completedEndings,
          ending_2: { completedAt: Date.now(), loopCount: playerRef.current.loopCount },
        },
        pendingEnding2RespawnWrite: true,
      };
      saveDiaryState(updated);
      return updated;
    });
    setEndingVictoryType(2);
    setGameState('ESCAPED');
    showToast('النهاية الثانية: هزمتِ وحشي المنزل بالمنبل! ستسجل تابي ذلك بالمذكرة عند بدء الدور الجديد.');
  }, [showToast]);

  // Restart Loop from ESCAPED screen or manually
  const handleRestartNewRun = useCallback(() => {
    if (storedDiary.pendingEnding2RespawnWrite) {
      setStoredDiary((prev) => {
        const updated: StoredDiaryData = {
          ...prev,
          pendingEnding2RespawnWrite: false,
        };
        saveDiaryState(updated);
        return updated;
      });
      setTimeout(() => {
        showToast('مذكرات تابي: كَتَبَت تابي في مذكراتها أنها أنهت النهاية الثانية بنجاح!');
      }, 1200);
    }

    setRunNotes([]);
    setEndingVictoryType(null);
    monstersRef.current = getInitialMonsters();
    roomsRef.current = JSON.parse(JSON.stringify(INITIAL_ROOMS));
    saltLinesRef.current = [];
    setCurrentRoomId('tabby_bedroom');
    setGameTimeSec(0);
    setNearbyProp(null);

    setPlayer((prev) => ({
      ...prev,
      x: 180,
      y: 235,
      roomId: 'tabby_bedroom',
      facing: 'right',
      isMoving: false,
      isRunning: false,
      isHiding: false,
      hidingSpotId: null,
      isDead: false,
      deathReason: null,
      heartRate: 72,
      loopCount: prev.loopCount + 1,
      inventory: [],
      selectedItemIndex: 0,
      flashlightOn: false,
      battery: 100,
    }));

    setGameState('PLAYING');
    showToast('استيقظتِ في ليلة جديدة... استكشفي المنزل وافتحي مذكرات تابي!');
  }, [showToast, storedDiary.pendingEnding2RespawnWrite]);

  // Restart Loop manually
  const handleRestartLoop = useCallback(() => {
    triggerDeathLoop('أعدتِ بدء الليلة...');
  }, [triggerDeathLoop]);

  // Drop Item from inventory to floor
  const handleDropItem = useCallback((index?: number) => {
    const p = playerRef.current;
    if (p.isDead || p.isHiding) return;

    const idx = index !== undefined ? index : p.selectedItemIndex;
    const item = p.inventory[idx];
    if (!item) return;

    const currentRoom = roomsRef.current[p.roomId];
    if (!currentRoom) return;

    if (!currentRoom.droppedItems) {
      currentRoom.droppedItems = [];
    }

    currentRoom.droppedItems.push({
      id: `dropped_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      item,
      x: p.x,
      y: p.y,
    });

    soundEngine.playItemPickup();

    setPlayer((prev) => {
      const newInv = prev.inventory.filter((_, i) => i !== idx);
      const newSelected = Math.max(0, Math.min(prev.selectedItemIndex, newInv.length - 1));
      const droppedFlashlight = item.type === 'flashlight';
      return {
        ...prev,
        inventory: newInv,
        selectedItemIndex: newSelected,
        flashlightOn: droppedFlashlight ? false : prev.flashlightOn,
      };
    });

    if (item.type === 'teddy_bear') {
      showToast('ألقيتِ الدب المحشو على الأرض! الكيانات ستنجذب إليه كطُعم.');
    } else {
      showToast(`ألقيتِ [${item.nameAr}] على الأرض.`);
    }
  }, [showToast]);

  // Interact Action (E key or Touch Interact button)
  const handleInteract = useCallback(() => {
    if (playerRef.current.isDead) return;

    const currentRoom = roomsRef.current[playerRef.current.roomId];
    if (!currentRoom) return;

    // 1. Check if standing on/near a dropped item on the floor
    const droppedNear = currentRoom.droppedItems?.find(
      (d) => Math.hypot(d.x - playerRef.current.x, (d.y - playerRef.current.y) * 0.8) < 38
    );
    if (droppedNear) {
      if (playerRef.current.inventory.length >= 5) {
        showToast('الحقيبة ممتلئة! ألقِ عنصراً أولاً بالضغط المطول أو السحب.');
        return;
      }
      soundEngine.playItemPickup();
      currentRoom.droppedItems = currentRoom.droppedItems?.filter((d) => d.id !== droppedNear.id);
      setPlayer((prev) => ({
        ...prev,
        inventory: [...prev.inventory, droppedNear.item],
      }));

      if (droppedNear.item.type === 'slingshot') {
        const newNote: RunNote = {
          id: `note_slingshot_${Date.now()}`,
          text: 'I wonder if someone would fear from this',
          subtextAr: 'ملاحظة تابي عند فحص أداة المنبل (النبالة) في المطبخ',
          timestamp: Date.now(),
        };
        setRunNotes((prev) => {
          if (prev.some((n) => n.text === newNote.text)) return prev;
          return [...prev, newNote];
        });
        showToast('عثرتِ على المنبل! كُتبت ملاحظة جديدة في مذكرات تابي: "I wonder if someone would fear from this"');
      } else {
        showToast(`التقطتِ: ${droppedNear.item.nameAr}`);
      }
      return;
    }

    const prop = nearbyPropRef.current;
    if (!prop) return;

    if (prop.type === 'door' || prop.type === 'stairs') {
      if (prop.isLocked || prop.isBarricaded) {
        // Check if player has the required key or the Axe
        const keyItem = prop.requiredKey ? playerRef.current.inventory.find((i) => i.type === prop.requiredKey) : null;
        const hasAxe = playerRef.current.inventory.some((i) => i.type === 'axe' || i.type === 'crowbar');

        if (keyItem) {
          soundEngine.playKeyUnlock();
          prop.isLocked = false;
          prop.isOpen = true;
          showToast(`تم فتح الباب باستخدام ${keyItem.nameAr}!`);
          return;
        } else if (hasAxe) {
          soundEngine.playAxeWoodChop();
          prop.isLocked = false;
          prop.isOpen = true;
          prop.isBarricaded = false;
          showToast('حطمتِ القفل والألواح بفأس الحريق!');
          return;
        } else {
          soundEngine.playDoorLocked();
          if (prop.id === 'front_door') {
            showToast('الباب الخارجي: موصد بسلاسل وألواح (اكسريها بالفأس للهروب)');
          } else if (prop.requiredKey === 'brass_key') {
            showToast('الباب مقفل: يحتاج المفتاح النحاسي أو فأس الحريق لتحطيمه');
          } else if (prop.requiredKey === 'cellar_key') {
            showToast('باب العلية مقفل: يحتاج مفتاح العلية أو فأس الحريق لتحطيمه');
          } else {
            showToast('الباب مقفل ومسمر بألواح: اكسريه بفأس الحريق');
          }
          return;
        }
      }

      // If escaping through the unlocked front door (Ending 1: The Freedom)
      if (prop.id === 'front_door') {
        triggerEnding1Victory();
        return;
      }

      // Enter door / stairs with glitch-free transition lock
      if (prop.targetRoomId) {
        if (isTransitioningRef.current) return;
        isTransitioningRef.current = true;

        soundEngine.playDoor(true);
        const targetRoom = prop.targetRoomId;
        const targetX = prop.targetX ?? 120;
        const targetY = prop.targetY ?? 240;

        setNearbyProp(null);
        setCurrentRoomId(targetRoom);
        setPlayer((prev) => ({
          ...prev,
          roomId: targetRoom,
          x: targetX,
          y: targetY,
          isHiding: false,
          hidingSpotId: null,
        }));

        setTimeout(() => {
          isTransitioningRef.current = false;
        }, 400);
      }
    } else if (prop.type === 'candle') {
      if (!prop.isOn) {
        const hasTorch = playerRef.current.inventory.some((i) => i.type === 'torch' || i.type === 'matches');
        if (hasTorch) {
          prop.isOn = true;
          soundEngine.playFlameIgnite();
          currentRoom.baseLightLevel = Math.min(0.85, currentRoom.baseLightLevel + 0.25);
          setPlayer((prev) => ({
            ...prev,
            heartRate: Math.max(65, prev.heartRate - 20),
          }));
          showToast('أشعلتِ الشموع بالشعلة: الغرفة مضيئة والظلال تراجعت');
        } else {
          showToast('الشموع مطفأة: ابحثي عن الشعلة (بجانب المدفأة) لإشعالها');
        }
      } else {
        showToast('الشموع مشتعلة: تنير المكان وتبعد الوحوش');
      }
    } else if (prop.type === 'container') {
      if (prop.hasItem && prop.itemInside) {
        const itemToTake = prop.itemInside;
        soundEngine.playItemPickup();
        prop.hasItem = false;
        prop.isOpen = true;
        setPlayer((prev) => {
          if (prev.inventory.length < 5) {
            return {
              ...prev,
              inventory: [...prev.inventory, itemToTake],
            };
          } else {
            showToast('الحقيبة ممتلئة (5/5)!');
            return prev;
          }
        });

        // User: "و لما تاخد المنبل هيتكتب في الملاحظات I wonder if someone would fear from this"
        if (itemToTake.type === 'slingshot') {
          const newNote: RunNote = {
            id: `note_slingshot_${Date.now()}`,
            text: 'I wonder if someone would fear from this',
            subtextAr: 'ملاحظة تابي عند فحص أداة المنبل (النبالة) في المطبخ',
            timestamp: Date.now(),
          };
          setRunNotes((prev) => {
            if (prev.some((n) => n.text === newNote.text)) return prev;
            return [...prev, newNote];
          });
          showToast('عثرتِ على المنبل! كُتبت ملاحظة جديدة في مذكرات تابي: "I wonder if someone would fear from this"');
        } else {
          showToast(`عثرتِ على: ${itemToTake.nameAr}`);
        }
      } else {
        prop.isOpen = !prop.isOpen;
        soundEngine.playDoor(prop.isOpen);
        showToast(prop.isOpen ? `${prop.name}: فارغة، لا يوجد شيء هنا` : `${prop.name}: تم إغلاقه`);
      }
    } else if (prop.type === 'fusebox') {
      prop.isOn = !prop.isOn;
      soundEngine.playFlashlightClick();
      currentRoom.hasLight = prop.isOn;
      currentRoom.baseLightLevel = prop.isOn ? 0.6 : 0.15;
      showToast(prop.isOn ? 'قاطع الكهرباء: تم تشغيل التيار' : 'قاطع الكهرباء: تم فصل التيار');
    } else if (prop.type === 'tv') {
      prop.isOn = !prop.isOn;
      soundEngine.playFlashlightClick();
      showToast(prop.isOn ? 'التلفاز: تشويش صاخب' : 'التلفاز: تم إغلاقه');
    } else if (prop.type === 'clock') {
      soundEngine.playClockTick(true);
      showToast('الساعة الجدارية: دقات متسارعة... الوقت ينفد');
    } else {
      showToast(prop.message || prop.name);
    }
  }, [showToast]);

  // Hide Action (H key or Touch Hide button)
  const handleToggleHide = useCallback(() => {
    const prop = nearbyPropRef.current;
    const p = playerRef.current;
    if (p.isDead) return;

    if (p.isHiding) {
      soundEngine.playDoor(false);
      setPlayer((prev) => ({
        ...prev,
        isHiding: false,
        hidingSpotId: null,
      }));
      showToast('خرجتِ من المخبأ.');
    } else if (prop && prop.type === 'hiding_spot') {
      soundEngine.playDoor(true);
      setPlayer((prev) => ({
        ...prev,
        isHiding: true,
        hidingSpotId: prop.id,
      }));
      showToast(`اختبأتِ في ${prop.name}! اكتمي أنفاسك...`);
    } else {
      showToast('لا يوجد مكان للاختباء هنا! اقتربي من سرير أو خزانة.');
    }
  }, [showToast]);

  // Flashlight toggle with Emergency Hand-Crank & Glitch-Free Protection
  const handleToggleFlashlight = useCallback(() => {
    const p = playerRef.current;
    if (p.isDead || p.isHiding) return;

    const hasFlashlight = p.inventory.some((i) => i.type === 'flashlight');
    if (!hasFlashlight) {
      showToast('لا تملكين مصباحاً يدوياً! ابحثي في أدراج غرفة النوم.');
      return;
    }

    // If battery is drained, hand-crank to recharge +30% immediately!
    if (p.battery <= 0) {
      soundEngine.playFlashlightCrank();
      setPlayer((prev) => ({
        ...prev,
        battery: 30,
        flashlightOn: true,
      }));
      showToast('شحنتِ الكشاف يدوياً بمقبض الطوارئ (+30%)!');
      return;
    }

    soundEngine.playFlashlightClick();
    setPlayer((prev) => ({
      ...prev,
      flashlightOn: !prev.flashlightOn,
    }));
  }, [showToast]);

  // Use Active Item
  const handleUseItem = useCallback(() => {
    const p = playerRef.current;
    if (p.isDead || p.isHiding) return;

    const item = p.inventory[p.selectedItemIndex];
    if (!item) {
      showToast('لم تختاري أداة من شريط العناصر العلوي');
      return;
    }

    if (item.type === 'salt_pouch') {
      soundEngine.playSaltWard();
      saltLinesRef.current.push({ roomId: p.roomId, x: p.x });
      showToast('الملح المبارك: سكب خط ملح يمنع مرور الكيانات');

      setPlayer((prev) => {
        const inv = [...prev.inventory];
        const active = inv[prev.selectedItemIndex];
        if (active && active.uses !== undefined) {
          active.uses -= 1;
          if (active.uses <= 0) {
            inv.splice(prev.selectedItemIndex, 1);
            showToast('الملح المبارك: نفد كيس الملح');
          }
        }
        return { ...prev, inventory: inv };
      });
    } else if (item.type === 'torch') {
      soundEngine.playFlameIgnite();
      showToast('الشعلة المضيئة: اقتربي من الشموع لإشعالها، ولهيبها يرعب الكيانات');
      monstersRef.current.forEach((m) => {
        if (m.roomId === p.roomId && m.active) {
          m.stunTimer = 180;
          soundEngine.playMonsterGrowl();
        }
      });
    } else if (item.type === 'axe' || item.type === 'crowbar') {
      soundEngine.playAxeWoodChop();
      showToast('فأس الحريق: تفاعل مع أي باب مقفل أو موصد لكسره فوراً');
    } else if (item.type === 'slingshot') {
      soundEngine.playSlingshot();

      // Find an active monster in the player's current room
      const targetMonster = monstersRef.current.find((m) => m.roomId === p.roomId && m.active);

      if (targetMonster) {
        soundEngine.playMonsterGrowl();
        targetMonster.hp = (targetMonster.hp ?? 2) - 1;

        if (targetMonster.hp <= 0) {
          targetMonster.active = false;
          targetMonster.stunTimer = 0;
          const remainingMonsters = monstersRef.current.filter((m) => m.active);

          if (remainingMonsters.length > 0) {
            showToast(`المنبل: أصبتِ ${targetMonster.name} بحصاة قاتلة وتلاشى! بقي وحش واحد.`);
          } else {
            // BOTH MONSTERS KILLED! Trigger Ending 2!
            triggerEnding2Victory();
          }
        } else {
          targetMonster.stunTimer = 160;
          targetMonster.x += p.facing === 'right' ? 40 : -40;
          showToast(`المنبل: أصبتِ ${targetMonster.name} بالحصاة وترنح متألماً! أطلقي ضربة ثانية لإسقاطه.`);
        }
      } else {
        showToast('المنبل: أطلقتِ حصاة في الهواء... لا يوجد وحش في هذه الغرفة.');
      }
    } else if (item.type === 'flashlight') {
      handleToggleFlashlight();
    } else if (item.type === 'teddy_bear') {
      setPlayer((prev) => ({
        ...prev,
        heartRate: Math.max(65, prev.heartRate - 35),
      }));
      showToast('الدب المحشو: عناقه يهدئ نبضات القلب وإلقاؤه يجذب الوحش');
    } else if (item.type === 'matches') {
      soundEngine.playFlameIgnite();
      showToast('أعواد الكبريت: إشعال الشموع في الحالات الطارئة');
    } else {
      showToast(`الأداة [${item.nameAr}]: تستخدم تلقائياً عند الاقتراب من الباب المقفل`);
    }
  }, [handleToggleFlashlight, showToast, triggerEnding2Victory]);

  // Select Item from Hotbar
  const handleSelectItem = useCallback((idx: number) => {
    setPlayer((prev) => ({
      ...prev,
      selectedItemIndex: idx,
    }));
  }, []);

  // Keyboard Event Listeners (WASD + Arrows in all 4 directions)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        inputRef.current.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        inputRef.current.right = true;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        inputRef.current.up = true;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        inputRef.current.down = true;
      } else if (e.key === 'Shift') {
        inputRef.current.run = true;
        setPlayer((prev) => ({ ...prev, isRunning: true }));
      } else if (e.key === 'e' || e.key === 'E') {
        handleInteract();
      } else if (e.key === 'f' || e.key === 'F') {
        handleUseItem();
      } else if (e.key === 'h' || e.key === 'H') {
        handleToggleHide();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handleToggleFlashlight();
      } else if (e.key === 'q' || e.key === 'Q' || e.key === 'g' || e.key === 'G') {
        handleDropItem();
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        handleSelectItem(parseInt(e.key, 10) - 1);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        inputRef.current.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        inputRef.current.right = false;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        inputRef.current.up = false;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        inputRef.current.down = false;
      } else if (e.key === 'Shift') {
        inputRef.current.run = false;
        setPlayer((prev) => ({ ...prev, isRunning: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, handleInteract, handleUseItem, handleDropItem, handleToggleHide, handleToggleFlashlight, handleSelectItem]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let animId: number;
    let stepSoundTimer = 0;
    let clockSecondAccumulator = 0;

    const gameLoop = () => {
      const currentRoom = roomsRef.current[playerRef.current.roomId];
      if (!currentRoom) return;

      const p = playerRef.current;

      // 1. 2.5D Movement & Physics in ALL 4 DIRECTIONS on the Floor
      if (!p.isDead && !p.isHiding) {
        let vx = 0;
        let vy = 0;
        const speed = p.isRunning ? 5.2 : 3.2;

        // 1. Keyboard Arrow / WASD keys
        if (inputRef.current.left) vx -= 1;
        if (inputRef.current.right) vx += 1;
        if (inputRef.current.up) vy -= 1;
        if (inputRef.current.down) vy += 1;

        // 2. Analog Thumbstick Joystick input
        const jx = joystickVectorRef.current.x;
        const jy = joystickVectorRef.current.y;
        if (jx !== 0 || jy !== 0) {
          vx = jx;
          vy = jy;
        } else {
          // Normalize keyboard diagonal
          const mag = Math.hypot(vx, vy);
          if (mag > 1) {
            vx /= mag;
            vy /= mag;
          }
        }

        vx *= speed;
        vy *= (speed * 0.72);

        const newX = Math.max(30, Math.min(currentRoom.width - 30, p.x + vx));
        const newY = Math.max(currentRoom.floorMinY, Math.min(currentRoom.floorMaxY, p.y + vy));
        const isMoving = vx !== 0 || vy !== 0;
        const facing = vx < -0.1 ? 'left' : vx > 0.1 ? 'right' : p.facing;

        // Footstep audio
        if (isMoving) {
          stepSoundTimer++;
          const stepCadence = p.isRunning ? 12 : 22;
          if (stepSoundTimer >= stepCadence) {
            soundEngine.playFootstep(p.isRunning);
            stepSoundTimer = 0;
          }
        }

        // Drain flashlight battery slowly when ON, and passively trickle-charge when OFF
        let newBattery = p.battery;
        if (p.flashlightOn) {
          newBattery = Math.max(0, p.battery - 0.008);
          if (newBattery <= 0 && p.flashlightOn) {
            soundEngine.playFlashlightClick();
          }
        } else if (p.battery < 100) {
          newBattery = Math.min(100, p.battery + 0.02);
        }

        // Check nearest interactive prop in 2D space
        let closest: InteractiveProp | null = null;
        let minDist = 50;
        for (const prop of currentRoom.props) {
          const propMidX = prop.x + prop.width / 2;
          const propBottomY = prop.y + prop.height;
          // Distance in 2D space
          const dist = Math.hypot(newX - propMidX, (newY - propBottomY) * 0.7);
          if (dist < minDist) {
            minDist = dist;
            closest = prop;
          }
        }
        setNearbyProp(closest);

        // Update player state
        setPlayer((prev) => ({
          ...prev,
          x: newX,
          y: newY,
          vx,
          vy,
          facing,
          isMoving,
          battery: newBattery,
          flashlightOn: newBattery > 0 ? prev.flashlightOn : false,
        }));
      }

      // 2. Clock & Anomaly Progression
      clockSecondAccumulator++;
      if (clockSecondAccumulator >= 60) {
        clockSecondAccumulator = 0;
        setGameTimeSec((prev) => {
          const next = prev + 1;
          soundEngine.playClockTick();

          if (next === 60) {
            soundEngine.playMonsterGrowl();
            showToast('صوت خطوات ثقيلة يتردد في الطابق السفلي...');
          } else if (next === 120) {
            monstersRef.current.forEach((m) => {
              if (m.type === 'stalker') {
                m.roomId = 'hallway_f2';
                m.x = 450;
                m.y = 240;
              }
            });
            soundEngine.playMonsterGrowl();
            showToast('الكيان المتربص صعد إلى طرقة الطابق الثاني!');
          } else if (next === 150) {
            roomsRef.current.hallway_f2.hasLight = false;
            roomsRef.current.tabby_bedroom.hasLight = false;
            roomsRef.current.tabby_bedroom.baseLightLevel = 0.18;
            roomsRef.current.hallway_f2.baseLightLevel = 0.15;
            soundEngine.playClockToll();
            showToast('انقطعت أنوار المنزل! استخدمي الكشاف أو أشعلي الشموع بالشعلة!');
          }

          return next;
        });
      }

      // 3. Monsters 2D AI Loop
      monstersRef.current.forEach((m) => {
        if (!m.active) return;

        if (m.stunTimer > 0) {
          m.stunTimer--;
          return;
        }

        if (m.roomId === p.roomId) {
          const distToPlayer = Math.hypot(m.x - p.x, (m.y - p.y) * 0.8);

          // Flashlight Repel: If player faces monster with flashlight on
          const playerFacingMonster = (p.facing === 'right' && m.x > p.x) || (p.facing === 'left' && m.x < p.x);
          if (p.flashlightOn && playerFacingMonster && distToPlayer < 240 && !p.isHiding) {
            m.stunTimer = 60;
            m.x += p.facing === 'right' ? 35 : -35;
            soundEngine.playMonsterGrowl();
            return;
          }

          // Check Salt barrier on floor
          const saltBlocking = saltLinesRef.current.some(
            (s) => s.roomId === m.roomId && Math.abs(m.x - s.x) < 25
          );
          if (saltBlocking) {
            m.facing = m.facing === 'left' ? 'right' : 'left';
            m.x += m.facing === 'left' ? -25 : 25;
            return;
          }

          // --- Decoy Item (Teddy Bear) Attraction Logic ---
          const droppedTeddy = currentRoom.droppedItems?.find((d) => d.item.type === 'teddy_bear');
          if (droppedTeddy) {
            const distToTeddy = Math.hypot(m.x - droppedTeddy.x, (m.y - droppedTeddy.y) * 0.8);
            if (distToTeddy < 22) {
              m.stunTimer = 150;
              m.facing = m.x < droppedTeddy.x ? 'right' : 'left';
              soundEngine.playMonsterGrowl();
              showToast('الكيان منشغل بفحص الدب المحشو الملقى على الأرض!');
              return;
            } else {
              if (m.x < droppedTeddy.x - 4) {
                m.x += m.speed * 0.85;
                m.facing = 'right';
              } else if (m.x > droppedTeddy.x + 4) {
                m.x -= m.speed * 0.85;
                m.facing = 'left';
              }
              if (m.y < droppedTeddy.y - 4) {
                m.y += m.speed * 0.55;
              } else if (m.y > droppedTeddy.y + 4) {
                m.y -= m.speed * 0.55;
              }
              return;
            }
          }

          // Candle Repel: Monsters avoid bright sacred candles
          const hasLitCandle = currentRoom.props.some((pr) => pr.type === 'candle' && pr.isOn);
          if (hasLitCandle && distToPlayer < 110) {
            m.facing = m.x < p.x ? 'left' : 'right';
            m.x += m.facing === 'left' ? -m.speed * 1.2 : m.speed * 1.2;
            return;
          }

          // Chase player in both X and Y
          if (!p.isHiding && !p.isDead) {
            setPlayer((prev) => ({
              ...prev,
              heartRate: Math.min(170, prev.heartRate + 0.35),
            }));

            // Chase X
            if (m.x < p.x - 4) {
              m.x += m.speed;
              m.facing = 'right';
            } else if (m.x > p.x + 4) {
              m.x -= m.speed;
              m.facing = 'left';
            }

            // Chase Y
            if (m.y < p.y - 4) {
              m.y += m.speed * 0.65;
            } else if (m.y > p.y + 4) {
              m.y -= m.speed * 0.65;
            }

            // Attack catch range in 2D
            if (distToPlayer < 24) {
              triggerDeathLoop('أمسك بكِ الظل المتربص في عتمة المنزل!');
              return;
            }
          } else {
            m.x += m.facing === 'right' ? m.speed * 0.5 : -m.speed * 0.5;
            if (m.x > currentRoom.width - 50) m.facing = 'left';
            if (m.x < 50) m.facing = 'right';
          }
        } else {
          m.x += m.facing === 'right' ? m.speed * 0.6 : -m.speed * 0.6;
          if (m.x > currentRoom.width - 60) m.facing = 'left';
          if (m.x < 60) m.facing = 'right';
        }
      });

      // 4. Update Heartbeat Audio Synthesizer
      soundEngine.updateHeartbeat(p.heartRate);

      // 5. Render Scene to Canvas with Y-Sorting
      if (rendererRef.current) {
        let promptText: string | null = null;
        
        // Priority 1: Check proximity to dropped items on floor
        const nearDropped = currentRoom.droppedItems?.find(
          (d) => Math.hypot(d.x - p.x, (d.y - p.y) * 0.8) < 38
        );

        if (nearDropped) {
          promptText = `[E] التقاط ${nearDropped.item.nameAr}`;
        } else if (nearbyPropRef.current) {
          const pr = nearbyPropRef.current;
          const hasKey = pr.requiredKey ? p.inventory.some((i) => i.type === pr.requiredKey) : false;
          const hasAxe = p.inventory.some((i) => i.type === 'axe' || i.type === 'crowbar');
          const hasTorchOrMatches = p.inventory.some((i) => i.type === 'torch' || i.type === 'matches');

          if (pr.type === 'door' || pr.type === 'stairs') {
            if (pr.isLocked || pr.isBarricaded) {
              if (hasKey) {
                promptText = `[E] فتح الباب بالمفتاح 🗝️`;
              } else if (hasAxe) {
                promptText = `[E] كسر الباب والألواح بالفأس 🪓`;
              } else {
                promptText = pr.isBarricaded ? `[E] ${pr.name} (موصد بألواح)` : `[E] ${pr.name} (مقفل)`;
              }
            } else if (pr.id === 'front_door') {
              promptText = `[E] الهروب من المنزل 🚪`;
            } else {
              promptText = `[E] عبور ${pr.name}`;
            }
          } else if (pr.type === 'candle') {
            if (pr.isOn) {
              promptText = `[E] شموع مشتعلة 🕯️`;
            } else {
              promptText = hasTorchOrMatches ? `[E] إشعال الشموع بالشعلة 🔥` : `[E] شموع مطفأة (تحتاج شعلة)`;
            }
          } else if (pr.type === 'container') {
            promptText = pr.hasItem ? `[E] تفتيش ${pr.name}` : `[E] فتح/إغلاق ${pr.name}`;
          } else if (pr.type === 'hiding_spot') {
            promptText = p.isHiding ? `[H] الخروج من ${pr.name}` : `[H] الاختباء في ${pr.name}`;
          } else {
            promptText = `[E] ${pr.name}`;
          }
        }

        rendererRef.current.render(
          currentRoom,
          p,
          monstersRef.current,
          saltLinesRef.current,
          gameTimeRef.current,
          null
        );
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, triggerDeathLoop, showToast]);

  // Compute unified top-bar React proximity text
  const proximityReactText = useMemo(() => {
    const currentRoom = roomsRef.current[player.roomId];
    const dropped = currentRoom?.droppedItems?.find(
      (d) => Math.hypot(d.x - player.x, (d.y - player.y) * 0.8) < 38
    );
    if (dropped) return `React: التقاط [${dropped.item.nameAr}]`;

    if (!nearbyProp) return null;
    const hasKey = nearbyProp.requiredKey ? player.inventory.some((i) => i.type === nearbyProp.requiredKey) : false;
    const hasAxe = player.inventory.some((i) => i.type === 'axe' || i.type === 'crowbar');
    const hasTorch = player.inventory.some((i) => i.type === 'torch' || i.type === 'matches');

    if (nearbyProp.type === 'door' || nearbyProp.type === 'stairs') {
      if (nearbyProp.isLocked || nearbyProp.isBarricaded) {
        if (hasAxe) return 'React: كسر الباب بالفأس 🪓';
        if (hasKey) return 'React: فتح الباب بالمفتاح 🗝️';
        return nearbyProp.isBarricaded ? 'React: باب موصد بألواح (تحتاج فأس)' : 'React: باب مقفل (مفتاح أو فأس)';
      }
      if (nearbyProp.id === 'front_door') return 'React: الهروب من المنزل 🚪';
      return `React: دخول ${nearbyProp.name}`;
    }

    if (nearbyProp.type === 'candle') {
      if (nearbyProp.isOn) return 'React: شمعة مشتعلة 🕯️';
      return hasTorch ? 'React: إشعال الشمعة بالشعلة 🔥' : 'React: شمعة مطفأة (تحتاج شعلة)';
    }

    if (nearbyProp.type === 'container') {
      return nearbyProp.hasItem ? `React: تفتيش ${nearbyProp.name}` : `React: فتح ${nearbyProp.name}`;
    }

    if (nearbyProp.type === 'hiding_spot') {
      return player.isHiding ? 'React: خروج من المخبأ' : `React: اختباء في ${nearbyProp.name}`;
    }

    if (nearbyProp.type === 'fusebox') {
      return 'React: تشغيل/إيقاف قاطع الكهرباء';
    }

    return `React: ${nearbyProp.name}`;
  }, [player.roomId, player.x, player.y, player.inventory, player.isHiding, nearbyProp]);

  const activeTopBarText = toastMessage || proximityReactText;

  return (
    <div className="relative w-full h-full bg-[#08060c] flex flex-col items-center justify-center overflow-hidden font-sans crt-overlay">

      {/* PORTRAIT ORIENTATION BANNER (Suggests Landscape for true immersion) */}
      {isPortrait && gameState === 'PLAYING' && (
        <div className="fixed top-2 z-40 px-3 py-1.5 bg-purple-950/90 border border-purple-400/60 rounded-full text-purple-200 text-[10px] font-pixel shadow-lg backdrop-blur-sm flex items-center gap-2 animate-pulse">
          <Smartphone className="w-3.5 h-3.5 rotate-90 text-amber-400" />
          <span>أدر الهاتف أفقياً (Landscape) لتجربة سينمائية أفضل</span>
          <button
            onClick={handleRequestLandscape}
            className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded font-bold text-[9px] hover:bg-amber-400"
          >
            تدوير
          </button>
        </div>
      )}

      {/* START SCREEN */}
      {gameState === 'START' && (
        <div className="absolute inset-0 z-40 bg-[#07050a] flex flex-col items-center justify-center p-4 text-center select-none overflow-y-auto">
          <div className="relative max-w-lg w-full p-6 sm:p-8 bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl backdrop-blur-md space-y-5">
            <div className="space-y-1.5">
              <span className="text-rose-500 font-pixel text-[10px] tracking-widest uppercase">
                2.5D PIXEL HORROR SURVIVAL
              </span>
              <h1 className="text-2xl sm:text-3xl font-pixel text-amber-300 tracking-tight leading-snug">
                بيت الرعب
              </h1>
              <p className="text-slate-400 text-xs font-mono">
                مستوحاة من أسلوب لعبة House الشهيرة على ستيم
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-slate-300 text-xs space-y-2 text-right">
              <p>• <strong>حركة كاملة في كل الاتجاهات</strong>: يمكنك التحرك يميناً ويساراً وللأعلى والأسفل على أرضية المنزل.</p>
              <p>• <strong>المنظور الأفقي (Landscape)</strong>: استمتع بكامل تفاصيل المنزل والغرف الواسعة بطابع ريترو قوطي.</p>
              <p>• <strong>الكيانات والوحوش</strong>: وحش الظلال يطاردك بذكاء في الطوابق؛ استخدمي المصباح، رشي الملح، واختبئي داخل الخزائن والأسرّة.</p>
            </div>

            {/* Custom Original Audio Upload Section */}
            <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded-2xl flex flex-col items-center gap-2 text-center">
              <span className="text-[11px] font-pixel text-purple-300">
                🎵 رفع ملفاتك الصوتية الأصلية المرفوعة
              </span>
              <p className="text-[10px] text-slate-400">
                اختر المقطوعتين من هاتفك أو جهازك لحفظهما في اللعبة والتشغيل التلقائي دائماً
              </p>
              <label className="cursor-pointer px-4 py-2 bg-purple-700 hover:bg-purple-600 active:scale-95 text-white font-pixel text-[10px] rounded-xl border border-purple-400/60 shadow-lg transition-all flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-300" />
                <span>اختيار الملفات الصوتية الأصلية</span>
                <input
                  type="file"
                  multiple
                  accept="audio/*"
                  className="hidden"
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      for (let i = 0; i < files.length; i++) {
                        await bgmPlayer.addCustomTrack(files[i]);
                      }
                      showToast(`تم حفظ ${files.length} ملف صوتي بنجاح دائماً في اللعبة!`);
                    }
                  }}
                />
              </label>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  soundEngine.playItemPickup();
                  bgmPlayer.play();
                  handleRequestLandscape();
                  setGameState('PLAYING');
                  showToast('استيقظتِ في سريرك... استكشفي الغرفة وابحثي عن المصباح اليدوي!');
                }}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold font-pixel text-sm rounded-2xl shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>بدء المغامرة (Play)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDiaryModal(true)}
                  className="flex-1 py-2.5 bg-[#2c1d29] hover:bg-[#3d273a] text-amber-300 font-pixel text-xs rounded-xl border border-amber-500/40 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>مذكرات تابي ({getEndingsTree(storedDiary).filter(e => e.isCompleted).length}/3)</span>
                </button>

                <button
                  onClick={() => setShowGuide(true)}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-pixel text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>دليل التحكم</span>
                </button>

                <button
                  onClick={handleRequestLandscape}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-pixel text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1"
                  title="تفعيل ملء الشاشة الأفقي"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REWINDING SCREEN (DEATH LOOP) */}
      {gameState === 'REWINDING' && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center select-none animate-pulse">
          <Skull className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
          <h2 className="text-xl font-pixel text-rose-400 tracking-wider mb-2">
            لقد سقطتِ في قبضة الوحش!
          </h2>
          <p className="text-xs text-slate-400 font-mono mb-4">
            {player.deathReason}
          </p>
          <div className="flex items-center gap-2 text-amber-300 font-pixel text-xs bg-slate-900 px-4 py-2 rounded-xl border border-amber-500/40">
            <RotateCcw className="w-4 h-4 animate-spin" />
            <span>إعادة شريط الوقت إلى 11:50 PM...</span>
          </div>
        </div>
      )}

      {/* ESCAPED VICTORY SCREEN (ENDING 1 & ENDING 2) */}
      {gameState === 'ESCAPED' && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center select-none backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-amber-400/60 p-6 rounded-3xl shadow-2xl space-y-4">
            {endingVictoryType === 2 ? (
              <>
                <div className="w-14 h-14 mx-auto rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center text-3xl shadow-lg">
                  🎯
                </div>
                <h2 className="text-xl sm:text-2xl font-pixel text-amber-300 tracking-wide">
                  النهاية الثانية: مواجهة المخاوف
                </h2>
                <div className="p-2.5 bg-black/50 rounded-xl border border-purple-900/40 text-purple-200 font-mono text-xs italic">
                  "For years I've been afraid of this house. Should I confront my fears or just live with them?"
                </div>
                <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                  بشجاعة نادرة وأداة المنبل (النبالة)، أسقطتِ وحشي المنزل صريعين بحصواتك المتقنة! عمّ الهدوء أرجاء البيت المسكون.
                </p>
                <div className="p-2.5 bg-amber-950/30 rounded-xl border border-amber-500/40 text-[11px] text-amber-300 font-sans text-center">
                  ✍️ ستكتب تابي تفاصيل إنجاز هذه النهاية في مذكراتها فور بدء دورك الجديد!
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-3xl shadow-lg">
                  🌅
                </div>
                <h2 className="text-xl sm:text-2xl font-pixel text-amber-300 tracking-wide">
                  النهاية الأولى: الخروج
                </h2>
                <div className="p-2.5 bg-black/50 rounded-xl border border-amber-900/40 text-amber-200 font-mono text-xs italic">
                  "Tabby:the freedom,away from the isolating,that's I hope"
                </div>
                <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                  حطمتِ ألواح وسلاسل الباب الخارجي بفأس الحريق، وركضتِ نحو شمس الصباح بعيداً عن أهوال المنزل المسكون!
                </p>
                <div className="p-2.5 bg-emerald-950/30 rounded-xl border border-emerald-500/40 text-[11px] text-emerald-300 font-sans text-center">
                  ✅ تم توثيق إنجاز الخروج في مذكرات تابي وفتح المسارات المتفرعة في شجرة النهايات!
                </div>
              </>
            )}

            <div className="p-3 bg-black/60 rounded-xl border border-slate-800 text-[11px] font-pixel text-amber-400/90 flex justify-around">
              <div>الحلقات: #{player.loopCount}</div>
              <div>الوقت: {Math.floor(gameTimeSec / 60)}:{(gameTimeSec % 60).toString().padStart(2, '0')}</div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShowDiaryModal(true)}
                className="w-full py-2.5 bg-[#2c1d29] hover:bg-[#3d273a] text-amber-300 font-pixel text-xs rounded-xl border border-amber-500/40 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>فتح مذكرات تابي وشجرة النهايات</span>
              </button>

              <button
                onClick={handleRestartNewRun}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold font-pixel text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{endingVictoryType === 2 ? 'بدء دور جديد (لتسجيل المذكرة)' : 'لعب ليلة جديدة (Restart)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HUD OVERLAY WITH UNIFIED TOP TEXT BAR */}
      {gameState === 'PLAYING' && (
        <GameHUD
          player={player}
          currentTimeSec={gameTimeSec}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenGuide={() => setShowGuide(true)}
          onOpenDiary={() => setShowDiaryModal(true)}
          hasUnreadDiaryNotes={runNotes.length > 0}
          onRestartLoop={handleRestartLoop}
          onSelectItem={handleSelectItem}
          onDropItem={handleDropItem}
          topBarText={activeTopBarText}
        />
      )}

      {/* WIDESCREEN LANDSCAPE GAME CANVAS CONTAINER */}
      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden p-0 sm:p-2">
        <canvas
          ref={canvasRef}
          width={640}
          height={320}
          className="w-full h-auto aspect-[2/1] max-h-screen object-contain pixelated crt-vignette shadow-2xl"
        />
      </div>

      {/* SLEEK TOUCHPAD CONTROLS FOR MOBILE (Thumbstick + Compact Action Buttons) */}
      {gameState === 'PLAYING' && (
        <TouchpadControls
          onJoystickMove={(vector) => {
            joystickVectorRef.current = vector;
          }}
          onInteract={handleInteract}
          onUseItem={handleUseItem}
          onDropItem={handleDropItem}
          onToggleFlashlight={handleToggleFlashlight}
          onToggleHide={handleToggleHide}
          onToggleRun={(pressed) => {
            inputRef.current.run = pressed;
            setPlayer((prev) => ({ ...prev, isRunning: pressed }));
          }}
          isRunning={player.isRunning}
          flashlightOn={player.flashlightOn}
          isHiding={player.isHiding}
          canInteract={Boolean(
            nearbyProp ||
            (roomsRef.current[player.roomId]?.droppedItems?.some(
              (d) => Math.hypot(d.x - player.x, (d.y - player.y) * 0.8) < 38
            ))
          )}
          canHide={Boolean(nearbyProp && nearbyProp.type === 'hiding_spot')}
          hasActiveItem={Boolean(player.inventory[player.selectedItemIndex])}
          promptText={null}
        />
      )}

      {/* GUIDE MODAL */}
      <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {/* TABBY'S DIARY & ENDINGS TREE MODAL */}
      <TabbyDiaryModal
        isOpen={showDiaryModal}
        onClose={() => setShowDiaryModal(false)}
        diaryEntries={getActiveDiaryEntries(storedDiary)}
        runNotes={runNotes}
        endingsTree={getEndingsTree(storedDiary)}
      />
    </div>
  );
}
