/**
 * The Haunted House - Victorian Map, Connected Layout & Interactive Props
 * Spacious layout with:
 * 1. Tabby's Bedroom (single door to Corridor)
 * 2. Extended Corridor (Hallway F2) with room doors and stairs to Rotunda
 * 3. Grand Circular Rotunda (Foyer F1) - vertically wider and spacious, with doors to remaining rooms:
 *    - Stairs back to Corridor
 *    - Living Room (Fireplace & Torch)
 *    - Kitchen (Dining table tray with Brass Key)
 *    - Cellar (Basement door)
 *    - Massive Front Exit Door (escape with Axe)
 * 4. Only 2 doors require keys:
 *    - Master Bedroom (Brass Key found in Kitchen) -> contains the Fire Axe in the Armoire!
 *    - Attic Hatch (Attic Key found in Master Bedroom Vanity) -> or break with Axe!
 * 5. One room has a door to another room:
 *    - Master Bedroom connects to Attic
 * 6. NO shortcut doors between other rooms; every other room has exactly one door!
 */
import { RoomDefinition, RoomId } from '../types/game';

export const INITIAL_ROOMS: Record<RoomId, RoomDefinition> = {
  // 1. Tabby's Bedroom - Starting room (Spacious 760px)
  tabby_bedroom: {
    id: 'tabby_bedroom',
    name: "Tabby's Bedroom",
    nameAr: "غرفة نوم الطفلة",
    floor: 'f2',
    width: 760,
    height: 320,
    floorMinY: 195,
    floorMaxY: 295,
    hasLight: true,
    lightFlickering: false,
    wallpaperColor: '#2b2238',
    floorColor: '#231814',
    baseLightLevel: 0.65,
    props: [
      {
        id: 'bedroom_window',
        roomId: 'tabby_bedroom',
        type: 'window',
        name: 'Arched Rain Window',
        x: 320,
        y: 65,
        width: 80,
        height: 100,
        message: 'عاصفة مطرية بالخارج، وبرق يضيء الأفق بين الحين والآخر.'
      },
      {
        id: 'tabby_bed',
        roomId: 'tabby_bedroom',
        type: 'hiding_spot',
        subType: 'bed',
        name: 'Four-Poster Bed',
        x: 80,
        y: 180,
        width: 140,
        height: 90,
        message: 'سرير خشبي متهالك. اضغطي [اختباء] للاختباء تحته.'
      },
      {
        id: 'nightstand',
        roomId: 'tabby_bedroom',
        type: 'container',
        name: 'Nightstand Drawer',
        x: 235,
        y: 190,
        width: 55,
        height: 65,
        isOpen: false,
        hasItem: true,
        itemInside: {
          id: 'item_flashlight',
          type: 'flashlight',
          name: 'Heavy Brass Flashlight',
          nameAr: 'مصباح يدوي نحاسي',
          description: 'A heavy metal flashlight with hand-crank generator. Repels darkness.',
          icon: '🔦',
          uses: 100,
          maxUses: 100,
        },
        message: 'طاولة السرير الصغيرة؛ مصباح نحاسي متين بداخلها.'
      },
      {
        id: 'candle_tabby',
        roomId: 'tabby_bedroom',
        type: 'candle',
        name: 'Bedroom Candelabra',
        x: 430,
        y: 175,
        width: 35,
        height: 55,
        isOn: false,
        message: 'شمعدان نحاسي؛ أشعليه بالشعلة أو الكبريت لإنارة الغرفة وطرد الظلال.'
      },
      {
        id: 'toy_chest',
        roomId: 'tabby_bedroom',
        type: 'container',
        name: 'Vintage Toy Trunk',
        x: 500,
        y: 200,
        width: 75,
        height: 60,
        isOpen: false,
        hasItem: true,
        itemInside: {
          id: 'item_teddy',
          type: 'teddy_bear',
          name: 'Comforting Teddy Bear',
          nameAr: 'الدب المحشو',
          description: 'A comforting old toy. Holding it calms panic; dropping it lures monsters away as a decoy.',
          icon: '🧸',
        },
        message: 'صندوق ألعاب قديم مطرز بالحديد.'
      },
      // Single Door: Exits to the Extended Corridor (hallway_f2)
      {
        id: 'door_tabby_to_hallway',
        roomId: 'tabby_bedroom',
        type: 'door',
        name: 'Carved Bedroom Door',
        x: 670,
        y: 135,
        width: 55,
        height: 125,
        targetRoomId: 'hallway_f2',
        targetX: 90,
        targetY: 240,
        isOpen: true,
        isLocked: false,
        message: 'باب الغرفة المؤدي إلى طرقة الطابق الثاني الممتدة'
      }
    ]
  },

  // 2. Extended Corridor (Hallway F2) - Spacious 880px with room doors and stairs to Rotunda
  hallway_f2: {
    id: 'hallway_f2',
    name: 'Upper Grand Hallway',
    nameAr: 'طرقة الطابق الثاني الممتدة',
    floor: 'f2',
    width: 880,
    height: 320,
    floorMinY: 195,
    floorMaxY: 295,
    hasLight: true,
    lightFlickering: false,
    wallpaperColor: '#241b30',
    floorColor: '#201511',
    baseLightLevel: 0.55,
    props: [
      // Door back to Tabby's Bedroom
      {
        id: 'door_hallway_to_tabby',
        roomId: 'hallway_f2',
        type: 'door',
        name: "Tabby's Room Door",
        x: 70,
        y: 135,
        width: 50,
        height: 125,
        targetRoomId: 'tabby_bedroom',
        targetX: 650,
        targetY: 240,
        isOpen: true,
        message: 'العودة إلى غرفة نوم الطفلة'
      },
      // Door to Bathroom
      {
        id: 'door_to_bathroom',
        roomId: 'hallway_f2',
        type: 'door',
        name: 'Bathroom Door',
        x: 230,
        y: 135,
        width: 50,
        height: 125,
        targetRoomId: 'bathroom',
        targetX: 80,
        targetY: 240,
        isOpen: true,
        isLocked: false,
        message: 'باب الحمام العلوي'
      },
      {
        id: 'grandfather_clock',
        roomId: 'hallway_f2',
        type: 'clock',
        name: 'Victorian Grandfather Clock',
        x: 350,
        y: 105,
        width: 50,
        height: 160,
        message: 'ساعة جدارية ضخمة؛ بندولها الذهبي يتحرك مع دقات متسارعة.'
      },
      {
        id: 'candle_hallway',
        roomId: 'hallway_f2',
        type: 'candle',
        name: 'Corridor Sconce',
        x: 440,
        y: 155,
        width: 30,
        height: 45,
        isOn: false,
        message: 'شموع جدارية بالممر؛ أشعليها بالشعلة لتبديد الظلام في الممر العلوي.'
      },
      // Key Door #1: Master Suite Door (requires brass_key from Kitchen, or Axe)
      {
        id: 'door_to_parents',
        roomId: 'hallway_f2',
        type: 'door',
        name: "Master Suite Door",
        x: 550,
        y: 135,
        width: 55,
        height: 125,
        targetRoomId: 'parents_bedroom',
        targetX: 80,
        targetY: 240,
        isOpen: false,
        isLocked: true,
        requiredKey: 'brass_key',
        message: 'باب غرفة الوالدين: مقفل بالمفتاح النحاسي (موجود بصينية طاولة المطبخ).'
      },
      // Stairs down to the Grand Circular Rotunda (foyer_f1)
      {
        id: 'stairs_to_f1',
        roomId: 'hallway_f2',
        type: 'stairs',
        name: 'Grand Staircase Down',
        x: 770,
        y: 130,
        width: 70,
        height: 130,
        targetRoomId: 'foyer_f1',
        targetX: 100,
        targetY: 240,
        message: 'درج عريض ينحدر نحو الصالة الدائرية بالبهو الرئيسي'
      }
    ]
  },

  // 3. Bathroom - Single door back to Corridor (740px, NO shortcut to Master Bedroom)
  bathroom: {
    id: 'bathroom',
    name: 'Tiled Bathroom',
    nameAr: 'الحمام',
    floor: 'f2',
    width: 740,
    height: 320,
    floorMinY: 195,
    floorMaxY: 295,
    hasLight: true,
    lightFlickering: false,
    wallpaperColor: '#172228',
    floorColor: '#151b1f',
    baseLightLevel: 0.5,
    props: [
      {
        id: 'door_bath_to_hall',
        roomId: 'bathroom',
        type: 'door',
        name: 'Hallway Door',
        x: 70,
        y: 135,
        width: 50,
        height: 125,
        targetRoomId: 'hallway_f2',
        targetX: 230,
        targetY: 240,
        isOpen: true,
        message: 'الخروج لطرقة الطابق الثاني'
      },
      {
        id: 'bathroom_toilet',
        roomId: 'bathroom',
        type: 'container',
        subType: 'toilet',
        name: 'Victorian Pull-Chain Toilet',
        x: 180,
        y: 165,
        width: 45,
        height: 80,
        isOpen: false,
        message: 'مرحاض فيكتوري عتيق مع خزان ماء علوي وسلسلة سحب معدنية.'
      },
      {
        id: 'mirror_sink',
        roomId: 'bathroom',
        type: 'container',
        subType: 'sink',
        name: 'Pedestal Porcelain Sink & Mirror',
        x: 290,
        y: 165,
        width: 60,
        height: 80,
        isOpen: false,
        hasItem: true,
        itemInside: {
          id: 'item_salt',
          type: 'salt_pouch',
          name: 'Blessed Coarse Salt',
          nameAr: 'كيس ملح مبارك',
          description: 'A pouch of coarse salt. Place lines across doorways to block entities.',
          icon: '🧂',
          uses: 4,
          maxUses: 4,
        },
        message: 'حوض خزفي أبيض مع صنبور ماء داكن ومرآة جدارية بيضاوية؛ كيس ملح مبارك موضوع هنا.'
      },
      {
        id: 'candle_bath',
        roomId: 'bathroom',
        type: 'candle',
        name: 'Bathroom Candle',
        x: 420,
        y: 180,
        width: 30,
        height: 45,
        isOn: false,
        message: 'شمعة بجانب المرآة؛ إشعالها يطرد أطياف الظلال المنعكسة.'
      },
      {
        id: 'bathtub',
        roomId: 'bathroom',
        type: 'hiding_spot',
        subType: 'bathtub',
        name: 'Clawfoot Enamel Bathtub',
        x: 520,
        y: 185,
        width: 140,
        height: 80,
        message: 'بانيو كلاسيكي ذو أقدام مخلبية مذهبة. اضغطي [اختباء] للانحناء بداخله بعيداً عن الأعين.'
      }
    ]
  },

  // 4. Parents' Master Suite - Contains the Fire Axe and connects to the Attic! (840px)
  parents_bedroom: {
    id: 'parents_bedroom',
    name: "Parents' Master Suite",
    nameAr: 'غرفة نوم الوالدين',
    floor: 'f2',
    width: 840,
    height: 320,
    floorMinY: 195,
    floorMaxY: 295,
    hasLight: true,
    lightFlickering: false,
    wallpaperColor: '#301822',
    floorColor: '#1c1014',
    baseLightLevel: 0.45,
    props: [
      // Single Door back to Corridor
      {
        id: 'door_parents_to_hall',
        roomId: 'parents_bedroom',
        type: 'door',
        name: 'Suite Door',
        x: 70,
        y: 135,
        width: 50,
        height: 125,
        targetRoomId: 'hallway_f2',
        targetX: 550,
        targetY: 240,
        isOpen: true,
        message: 'الخروج لطرقة الطابق الثاني'
      },
      {
        id: 'master_bed',
        roomId: 'parents_bedroom',
        type: 'hiding_spot',
        subType: 'bed',
        name: 'Canopy King Bed',
        x: 170,
        y: 175,
        width: 150,
        height: 95,
        message: 'سرير والديها الضخم بستائر داكنة. اضغطي [اختباء] للاختباء تحته.'
      },
      // ARMOIRE: Contains the Fire Axe (الفأس) which breaks all doors!
      {
        id: 'parents_wardrobe',
        roomId: 'parents_bedroom',
        type: 'container',
        subType: 'wardrobe',
        name: 'Gargantuan Armoire',
        x: 360,
        y: 120,
        width: 90,
        height: 145,
        isOpen: false,
        hasItem: true,
        itemInside: {
          id: 'item_fire_axe',
          type: 'axe',
          name: 'Heavy Fire Axe',
          nameAr: 'فأس الحريق الحاد',
          description: 'A powerful steel axe! Breaks locked doors, padlocks, and barricades.',
          icon: '🪓',
        },
        message: 'خزانة ملابس ضخمة؛ بداخلها فأس حريق ثقيل يكسر جميع الأبواب المغلقة!'
      },
      {
        id: 'candle_parents',
        roomId: 'parents_bedroom',
        type: 'candle',
        name: 'Master Suite Candelabra',
        x: 480,
        y: 175,
        width: 30,
        height: 48,
        isOn: false,
        message: 'شمعدان نحاسي؛ أشعليه بالشعلة للإنارة المستمرة.'
      },
      // VANITY: Contains the Attic Key
      {
        id: 'parents_dresser',
        roomId: 'parents_bedroom',
        type: 'container',
        name: 'Vanity Table',
        x: 540,
        y: 180,
        width: 75,
        height: 85,
        isOpen: false,
        hasItem: true,
        itemInside: {
          id: 'item_attic_key',
          type: 'cellar_key',
          name: 'Old Attic Iron Key',
          nameAr: 'مفتاح العلية الحديدي',
          description: 'A heavy iron key for the attic secret ceiling door.',
          icon: '🗝️',
        },
        message: 'طاولة تزيين عتيقة؛ درجها يحوي مفتاح باب العلية الحديدي.'
      },
      // Room that has a door to another room: Door to the Attic!
      // Key Door #2: Requires attic_key or can be chopped with the Axe!
      {
        id: 'door_parents_to_attic',
        roomId: 'parents_bedroom',
        type: 'stairs',
        name: 'Secret Attic Door',
        x: 720,
        y: 120,
        width: 60,
        height: 140,
        targetRoomId: 'attic',
        targetX: 90,
        targetY: 240,
        isOpen: false,
        isLocked: true,
        requiredKey: 'cellar_key',
        message: 'باب سري يؤدي إلى السقيفة/العلية؛ مقفل بمفتاح العلية أو يمكن كسره بالفأس!'
      }
    ]
  },

  // 5. The Attic - Connected directly and exclusively to Master Bedroom (760px)
  attic: {
    id: 'attic',
    name: 'The Dark Attic',
    nameAr: 'السقيفة / العلية المظلمة',
    floor: 'attic',
    width: 760,
    height: 320,
    floorMinY: 195,
    floorMaxY: 295,
    hasLight: false,
    baseLightLevel: 0.18,
    wallpaperColor: '#17161c',
    floorColor: '#100f14',
    props: [
      // Single Door back to Parents' Master Suite
      {
        id: 'attic_trapdoor',
        roomId: 'attic',
        type: 'stairs',
        name: 'Door to Master Suite',
        x: 80,
        y: 135,
        width: 60,
        height: 125,
        targetRoomId: 'parents_bedroom',
        targetX: 710,
        targetY: 240,
        message: 'النزول والعودة إلى غرفة نوم الوالدين'
      },
      {
        id: 'candle_attic',
        roomId: 'attic',
        type: 'candle',
        name: 'Ritual Candlestick',
        x: 230,
        y: 195,
        width: 30,
        height: 45,
        isOn: false,
        message: 'شمعدان قديم؛ إشعاله بالشعلة يكشف أسرار العلية ويطرد الظلام.'
      },
      {
        id: 'attic_chest',
        roomId: 'attic',
        type: 'container',
        name: 'Reinforced Iron Trunk',
        x: 340,
        y: 185,
        width: 85,
        height: 70,
        isOpen: false,
        hasItem: true,
        itemInside: {
          id: 'item_matches_attic',
          type: 'matches',
          name: 'Box of Matchsticks',
          nameAr: 'علبة كبريت خشبية',
          description: 'Useful for lighting candles in an emergency.',
          icon: '🔥',
          uses: 6,
          maxUses: 6,
        },
        message: 'صندوق حديدي ثقيل محاط بشباك العنكبوت؛ علبة كبريت بداخلها.'
      },
      {
        id: 'occult_circle',
        roomId: 'attic',
        type: 'window',
        name: 'Eerie Chalk Circle',
        x: 520,
        y: 215,
        width: 110,
        height: 45,
        message: 'رموز غريبة مرسومة بالطبشور والملح المحروق على الخشب.'
      }
    ]
  },

  // 6. Grand Circular Rotunda (Foyer F1) - VERTICALLY WIDER (floorMinY: 140, floorMaxY: 305) & 880px
  // User: "عند الخروج من الطرقة ستقابل صالة دائرية بها باقي الأبواب التي لم تكن في الطرقة، الصالة اجعلها اعرض رأسيا من ذي قبل"
  foyer_f1: {
    id: 'foyer_f1',
    name: 'Grand Circular Rotunda',
    nameAr: 'الصالة الدائرية (البهو الرئيسي)',
    floor: 'f1',
    width: 880,
    height: 320,
    floorMinY: 140, // Vertically wider: walk up deep into the rotunda
    floorMaxY: 305, // and down to foreground
    hasLight: true,
    lightFlickering: false,
    wallpaperColor: '#241f2b',
    floorColor: '#181412',
    baseLightLevel: 0.6,
    props: [
      // Stairs back to Upper Corridor
      {
        id: 'stairs_to_f2',
        roomId: 'foyer_f1',
        type: 'stairs',
        name: 'Stairs to Upper Corridor',
        x: 80,
        y: 95,
        width: 60,
        height: 125,
        targetRoomId: 'hallway_f2',
        targetX: 760,
        targetY: 240,
        message: 'الصعود للدرج إلى طرقة وغرف الطابق الثاني الممتدة'
      },
      // Door to Living Room
      {
        id: 'door_to_living',
        roomId: 'foyer_f1',
        type: 'door',
        name: 'Living Room Archway',
        x: 230,
        y: 95,
        width: 55,
        height: 125,
        targetRoomId: 'living_room',
        targetX: 90,
        targetY: 240,
        isOpen: true,
        message: 'الدخول إلى غرفة المعيشة والمدفأة'
      },
      // Rotunda Sconce Candle
      {
        id: 'candle_rotunda_1',
        roomId: 'foyer_f1',
        type: 'candle',
        name: 'Rotunda Left Chandelier',
        x: 340,
        y: 115,
        width: 35,
        height: 55,
        isOn: false,
        message: 'ثريا جدارية نحاسية بالصالة الدائرية؛ أشعليها بالشعلة لتبديد العتمة.'
      },
      // Massive Front Door - Escape Door (Barricaded with chains, chopped open by the Axe!)
      {
        id: 'front_door',
        roomId: 'foyer_f1',
        type: 'door',
        name: 'Massive Front Exit Door',
        x: 440,
        y: 80,
        width: 75,
        height: 145,
        isLocked: true,
        isBarricaded: true,
        message: 'الباب الخارجي موصد بسلاسل وألواح خشبية! يمكنك تحطيمها بالفأس للهروب!'
      },
      // Rotunda Sconce Candle Right
      {
        id: 'candle_rotunda_2',
        roomId: 'foyer_f1',
        type: 'candle',
        name: 'Rotunda Right Chandelier',
        x: 565,
        y: 115,
        width: 35,
        height: 55,
        isOn: false,
        message: 'ثريا جدارية نحاسية بالصالة الدائرية؛ أشعليها بالشعلة.'
      },
      // Door to Kitchen
      {
        id: 'door_to_kitchen',
        roomId: 'foyer_f1',
        type: 'door',
        name: 'Kitchen Swinging Door',
        x: 650,
        y: 95,
        width: 55,
        height: 125,
        targetRoomId: 'kitchen',
        targetX: 90,
        targetY: 240,
        isOpen: true,
        message: 'الدخول إلى المطبخ وغرفة الطعام'
      },
      // Door to Basement (Barricaded, opened with the Axe)
      {
        id: 'door_to_basement',
        roomId: 'foyer_f1',
        type: 'door',
        name: 'Barricaded Cellar Door',
        x: 775,
        y: 95,
        width: 60,
        height: 125,
        targetRoomId: 'basement',
        targetX: 90,
        targetY: 240,
        isOpen: false,
        isLocked: true,
        isBarricaded: true,
        message: 'باب القبو محكم الإغلاق ومسمر بألواح! حطمي الألواح والقفل بالفأس لفتحه!'
      }
    ]
  },

  // 7. Living Room - Single door to Rotunda only (800px, NO shortcut to Kitchen!)
  living_room: {
    id: 'living_room',
    name: 'The Living Room',
    nameAr: 'غرفة المعيشة والمدفأة',
    floor: 'f1',
    width: 800,
    height: 320,
    floorMinY: 195,
    floorMaxY: 295,
    hasLight: true,
    lightFlickering: false,
    wallpaperColor: '#342421',
    floorColor: '#201612',
    baseLightLevel: 0.6,
    props: [
      // Single Door: Back to Rotunda
      {
        id: 'door_living_to_foyer',
        roomId: 'living_room',
        type: 'door',
        name: 'Rotunda Door',
        x: 70,
        y: 135,
        width: 50,
        height: 125,
        targetRoomId: 'foyer_f1',
        targetX: 230,
        targetY: 220,
        isOpen: true,
        message: 'العودة إلى الصالة الدائرية بالبهو الرئيسي'
      },
      {
        id: 'fireplace',
        roomId: 'living_room',
        type: 'fireplace',
        name: 'Cobblestone Hearth',
        x: 180,
        y: 140,
        width: 105,
        height: 120,
        isOn: true,
        message: 'جمر المدفأة يشتعل ببطء، مشعاً دفئاً ونوراً يطرد العتمة.'
      },
      // TORCH: Found right by the fireplace! Used to light all candles!
      {
        id: 'torch_stand',
        roomId: 'living_room',
        type: 'container',
        name: 'Fireplace Torch Stand',
        x: 310,
        y: 165,
        width: 50,
        height: 75,
        isOpen: false,
        hasItem: true,
        itemInside: {
          id: 'item_torch',
          type: 'torch',
          name: 'Ancient Flaming Torch',
          nameAr: 'الشعلة المضيئة',
          description: 'A flaming hand torch. Use it to light candles around the house.',
          icon: '🔥',
        },
        message: 'حامل شعلة حديدي بجانب المدفأة؛ بداخلها الشعلة المضيئة لإشعال الشموع!'
      },
      {
        id: 'candle_living',
        roomId: 'living_room',
        type: 'candle',
        name: 'Hearth Candelabra',
        x: 400,
        y: 175,
        width: 32,
        height: 50,
        isOn: false,
        message: 'شمعدان خشبي بجانب الكنبة؛ أشعليه بالشعلة للإنارة المستمرة.'
      },
      {
        id: 'living_couch',
        roomId: 'living_room',
        type: 'hiding_spot',
        subType: 'couch',
        name: 'Plush Velvet Sofa',
        x: 480,
        y: 185,
        width: 130,
        height: 80,
        message: 'كنبة مخملية ثقيلة. اضغطي [اختباء] للانحناء خلفها.'
      },
      {
        id: 'living_tv',
        roomId: 'living_room',
        type: 'tv',
        name: 'CRT Television',
        x: 660,
        y: 180,
        width: 60,
        height: 65,
        isOn: false,
        message: 'تلفاز قديم بشاشة رمادية خافتة.'
      }
    ]
  },

  // 8. Kitchen - Single door to Rotunda only (800px, NO shortcut to Living Room!)
  kitchen: {
    id: 'kitchen',
    name: 'The Kitchen',
    nameAr: 'المطبخ وغرفة الطعام',
    floor: 'f1',
    width: 800,
    height: 320,
    floorMinY: 195,
    floorMaxY: 295,
    hasLight: true,
    lightFlickering: false,
    wallpaperColor: '#262d26',
    floorColor: '#171c17',
    baseLightLevel: 0.55,
    props: [
      // Single Door: Back to Rotunda
      {
        id: 'door_kitchen_to_foyer',
        roomId: 'kitchen',
        type: 'door',
        name: 'Rotunda Door',
        x: 70,
        y: 135,
        width: 50,
        height: 125,
        targetRoomId: 'foyer_f1',
        targetX: 650,
        targetY: 220,
        isOpen: true,
        message: 'الخروج إلى الصالة الدائرية بالبهو الرئيسي'
      },
      {
        id: 'kitchen_counter',
        roomId: 'kitchen',
        type: 'container',
        subType: 'kitchen_counter',
        name: 'Marble Countertop & Double Sink',
        x: 180,
        y: 170,
        width: 125,
        height: 85,
        isOpen: false,
        hasItem: true,
        itemInside: {
          id: 'item_slingshot',
          type: 'slingshot',
          name: 'Handcrafted Slingshot',
          nameAr: 'نبالة خشبية متقنة',
          description: 'A wooden slingshot with smooth pebbles. Stuns monsters or distracts them.',
          icon: '🎯',
        },
        message: 'منضدة رخامية عتيقة؛ درجها يحوي نبالة خشبية دقيقة.'
      },
      {
        id: 'candle_kitchen',
        roomId: 'kitchen',
        type: 'candle',
        name: 'Kitchen Candle',
        x: 340,
        y: 180,
        width: 30,
        height: 48,
        isOn: false,
        message: 'شمعة على حافة طاولة المطبخ؛ أشعليها لتبديد العتمة.'
      },
      // DINING TABLE TRAY: Contains the Brass Key for the Master Bedroom!
      {
        id: 'dining_table',
        roomId: 'kitchen',
        type: 'container',
        subType: 'table',
        name: 'Carved Dining Table & Silver Tray',
        x: 430,
        y: 185,
        width: 140,
        height: 80,
        isOpen: false,
        hasItem: true,
        itemInside: {
          id: 'item_brass_key',
          type: 'brass_key',
          name: 'Ornate Brass Key',
          nameAr: 'المفتاح النحاسي المزخرف',
          description: 'A delicate brass key. Fits the locked door of the Master Suite upstairs.',
          icon: '🗝️',
        },
        message: 'طاولة طعام خشبية فاخرة؛ صينيتها الفضية تحوي المفتاح النحاسي لغرفة نوم الوالدين!'
      },
      {
        id: 'refrigerator',
        roomId: 'kitchen',
        type: 'container',
        subType: 'fridge',
        name: 'Vintage Icebox Refrigerator',
        x: 620,
        y: 145,
        width: 75,
        height: 115,
        isOpen: false,
        message: 'ثلاجة قديمة محكمة الإغلاق تقطر ماءً مثلجاً على الأرض.'
      }
    ]
  },

  // 9. The Basement / Cellar - Single door to Rotunda only (800px)
  basement: {
    id: 'basement',
    name: 'The Dark Basement',
    nameAr: 'القبو المظلم',
    floor: 'basement',
    width: 800,
    height: 320,
    floorMinY: 195,
    floorMaxY: 295,
    hasLight: false,
    baseLightLevel: 0.15,
    wallpaperColor: '#121217',
    floorColor: '#0b0b0e',
    props: [
      // Single Door back to Rotunda
      {
        id: 'door_basement_to_foyer',
        roomId: 'basement',
        type: 'door',
        name: 'Cellar Stairs Up',
        x: 70,
        y: 135,
        width: 55,
        height: 125,
        targetRoomId: 'foyer_f1',
        targetX: 775,
        targetY: 220,
        isOpen: true,
        message: 'الصعود عبر درج القبو إلى الصالة الدائرية بالبهو الرئيسي'
      },
      {
        id: 'fusebox',
        roomId: 'basement',
        type: 'fusebox',
        name: 'Industrial Breaker Box',
        x: 210,
        y: 140,
        width: 45,
        height: 65,
        isOn: true,
        message: 'قاطع الكهرباء الرئيسي للمنزل. اضغطي [تفاعل] لإعادة تشغيل أو فصل التيار.'
      },
      {
        id: 'candle_basement',
        roomId: 'basement',
        type: 'candle',
        name: 'Cellar Oil Lamp',
        x: 320,
        y: 190,
        width: 32,
        height: 48,
        isOn: false,
        message: 'مصباح زيتي قديم؛ أشعليه بالشعلة للإنارة المستمرة.'
      },
      {
        id: 'basement_shelf',
        roomId: 'basement',
        type: 'container',
        name: 'Rotting Wood Shelves',
        x: 420,
        y: 160,
        width: 90,
        height: 95,
        isOpen: false,
        hasItem: true,
        itemInside: {
          id: 'item_salt_cellar',
          type: 'salt_pouch',
          name: 'Heavy Salt Bag',
          nameAr: 'كيس ملح خشن إضافي',
          description: 'A heavy bag of coarse rock salt. Good for another 4 lines of warding.',
          icon: '🧂',
          uses: 4,
          maxUses: 4,
        },
        message: 'أرفف خشبية متعفنة؛ كيس ملح مبارك إضافي موضوع هنا.'
      },
      {
        id: 'furnace',
        roomId: 'basement',
        type: 'fireplace',
        name: 'Humming Coal Furnace',
        x: 580,
        y: 140,
        width: 105,
        height: 115,
        isOn: false,
        message: 'فرن فحم ضخم ومصدأ يصدر قعقعة معدنية مكتومة.'
      }
    ]
  }
};
