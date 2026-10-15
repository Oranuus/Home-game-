/**
 * Game HUD - Clocks, Heartbeat Meter, Inventory Hotbar, and Background Music Playlist Widget
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Heart,
  Battery,
  HelpCircle,
  RotateCcw,
  Clock,
  Music,
  Play,
  Pause,
  SkipForward,
  Plus,
  ListMusic,
  ArrowDownToLine,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { InventoryItem, PlayerState } from '../types/game';
import { bgmPlayer, BGMTrack } from '../audio/bgmPlayer';

interface GameHUDProps {
  player: PlayerState;
  currentTimeSec: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenGuide: () => void;
  onOpenDiary?: () => void;
  hasUnreadDiaryNotes?: boolean;
  onRestartLoop: () => void;
  onSelectItem: (index: number) => void;
  onDropItem?: (index: number) => void;
  topBarText?: string | null;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  currentTimeSec,
  isMuted,
  onToggleMute,
  onOpenGuide,
  onOpenDiary,
  hasUnreadDiaryNotes,
  onRestartLoop,
  onSelectItem,
  onDropItem,
  topBarText,
}) => {
  // BGM Player state subscription
  const [bgmTrack, setBgmTrack] = useState<BGMTrack>(bgmPlayer.getCurrentTrack());
  const [bgmPlaying, setBgmPlaying] = useState<boolean>(bgmPlayer.getIsPlaying());
  const [bgmVolume, setBgmVolume] = useState<number>(bgmPlayer.getVolume());
  const [showPlaylist, setShowPlaylist] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsubscribe = bgmPlayer.subscribe(() => {
      setBgmTrack(bgmPlayer.getCurrentTrack());
      setBgmPlaying(bgmPlayer.getIsPlaying());
      setBgmVolume(bgmPlayer.getVolume());
    });
    return unsubscribe;
  }, []);

  // Convert currentTimeSec to clock time starting from 11:50 PM
  const totalGameMinutes = 50 + Math.floor((currentTimeSec / 25) * 2);
  const hour = 11 + Math.floor(totalGameMinutes / 60);
  const minutes = totalGameMinutes % 60;
  const displayHour = hour > 12 ? hour - 12 : hour;
  const isMidnight = hour >= 12;
  const clockText = `${displayHour === 0 ? 12 : displayHour}:${minutes < 10 ? '0' + minutes : minutes} ${isMidnight ? 'AM' : 'PM'}`;

  // Heartbeat color & animation
  const isHighPanic = player.heartRate > 120;
  const heartRateColor = player.heartRate > 140 ? 'text-rose-500 animate-ping' : isHighPanic ? 'text-rose-400' : 'text-emerald-400';

  // Handle custom file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      bgmPlayer.addCustomTrack(file);
    }
  };

  // Long press & Drag-to-drop handlers
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number; index: number } | null>(null);

  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, index };
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (player.inventory[index]) {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try { navigator.vibrate(30); } catch {}
        }
        onDropItem?.(index);
      }
    }, 380);
  };

  const handlePointerMove = (index: number, e: React.PointerEvent) => {
    if (pointerStartRef.current && pointerStartRef.current.index === index) {
      const deltaY = e.clientY - pointerStartRef.current.y;
      if (deltaY > 28) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        pointerStartRef.current = null;
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try { navigator.vibrate(25); } catch {}
        }
        onDropItem?.(index);
      }
    }
  };

  const handlePointerUpOrCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pointerStartRef.current = null;
  };

  const activeSelectedItem = player.inventory[player.selectedItemIndex];

  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none z-20 p-2 select-none">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-1.5 max-w-5xl mx-auto">
        {/* Left: Clock & Loop Info */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-white shadow-lg">
          <Clock className={`w-3.5 h-3.5 ${isMidnight ? 'text-rose-500 animate-spin' : 'text-amber-400'}`} />
          <div className="flex flex-col">
            <span className={`text-[10px] font-pixel tracking-wider ${isMidnight ? 'text-rose-400 font-bold' : 'text-amber-300'}`}>
              {clockText}
            </span>
            <span className="text-[8px] text-slate-400 font-sans">
              حلقة #{player.loopCount} · {Math.floor(currentTimeSec / 60)}:{(currentTimeSec % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Center: Music Playlist Bar */}
        <div className="pointer-events-auto relative flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-1 rounded-xl border border-purple-500/30 text-white shadow-lg">
          <div className="flex items-center gap-1">
            <Music className={`w-3 h-3 text-purple-400 ${bgmPlaying ? 'animate-bounce' : 'opacity-60'}`} />
            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className="flex items-center gap-1 text-left max-w-[110px] sm:max-w-[170px] truncate hover:text-purple-300 transition-colors"
              title="قائمة الموسيقى"
            >
              <span className="text-[9px] font-pixel text-purple-300 truncate">
                {bgmTrack.titleAr}
              </span>
            </button>
          </div>

          <div className="w-px h-3 bg-slate-700 mx-0.5" />

          {/* Play / Pause */}
          <button
            onClick={() => bgmPlayer.togglePlay()}
            className="p-0.5 rounded hover:bg-slate-800 text-slate-200 active:scale-95 transition-all"
            title={bgmPlaying ? 'إيقاف مؤقت' : 'تشغيل الموسيقى'}
          >
            {bgmPlaying ? <Pause className="w-3 h-3 text-amber-400 fill-amber-400" /> : <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />}
          </button>

          {/* Next Track */}
          <button
            onClick={() => bgmPlayer.nextTrack()}
            className="p-0.5 rounded hover:bg-slate-800 text-slate-300 active:scale-95 transition-all"
            title="المقطع التالي"
          >
            <SkipForward className="w-3 h-3" />
          </button>

          {/* Playlist Dropdown Toggle */}
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className={`p-0.5 rounded hover:bg-slate-800 transition-all ${showPlaylist ? 'bg-purple-900/60 text-purple-300' : 'text-slate-300'}`}
            title="عرض قائمة المسارات"
          >
            <ListMusic className="w-3 h-3" />
          </button>

          {/* Upload Custom Audio File Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-amber-300 active:scale-95 transition-all"
            title="إضافة ملف صوتي مخصص من جهازك"
          >
            <Plus className="w-3 h-3" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Playlist Dropdown Menu */}
          {showPlaylist && (
            <div className="absolute top-full left-0 mt-1.5 w-60 bg-slate-900/95 border border-purple-500/40 rounded-xl shadow-2xl backdrop-blur-md p-2 space-y-1 z-30">
              <div className="text-[9px] font-pixel text-purple-300 px-1.5 py-1 border-b border-slate-800 flex items-center justify-between">
                <span>قائمة موسيقى اللعبة</span>
                <span className="text-[8px] text-slate-400">({bgmPlayer.getPlaylist().length})</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {bgmPlayer.getPlaylist().map((t, idx) => {
                  const isCurrent = t.id === bgmTrack.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        bgmPlayer.setTrack(idx);
                        bgmPlayer.play();
                      }}
                      className={`w-full text-left px-2 py-1 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-purple-600/30 text-amber-300 font-semibold border border-purple-500/40'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate flex items-center gap-1.5">
                        <span className="text-[8px] font-pixel text-slate-500">{idx + 1}.</span>
                        <span className="truncate text-[10px]">{t.titleAr}</span>
                      </div>
                      {isCurrent && bgmPlaying && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Volume Slider in Playlist */}
              <div className="pt-1.5 border-t border-slate-800 flex items-center gap-1.5 px-1.5">
                <Volume2 className="w-3 h-3 text-slate-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={bgmVolume}
                  onChange={(e) => bgmPlayer.setVolume(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Heart Rate, Battery & Quick Tools */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 shadow-lg text-white">
          {/* Heart Rate */}
          <div className="flex items-center gap-1" title="Heart Rate (BPM)">
            <Heart className={`w-3 h-3 ${heartRateColor}`} />
            <span className="text-[10px] font-pixel text-slate-200">
              {Math.round(player.heartRate)}
            </span>
          </div>

          <div className="w-px h-3 bg-slate-700" />

          {/* Flashlight Battery */}
          <div className="flex items-center gap-1" title="Flashlight Battery">
            <Battery className={`w-3 h-3 ${player.battery < 20 ? 'text-rose-400' : 'text-amber-400'}`} />
            <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all ${
                  player.battery < 20 ? 'bg-rose-500' : player.battery < 50 ? 'bg-amber-500' : 'bg-emerald-400'
                }`}
                style={{ width: `${player.battery}%` }}
              />
            </div>
          </div>

          <div className="w-px h-3 bg-slate-700" />

          {/* Tabby's Diary & Endings Button */}
          {onOpenDiary && (
            <button
              onClick={onOpenDiary}
              className="relative px-2 py-0.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/70 border border-amber-500/50 text-amber-300 hover:text-amber-200 active:scale-95 transition-all flex items-center gap-1 shadow-sm"
              title="مذكرات تابي وشجرة النهايات"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[9px] font-pixel">المذكرات</span>
              {hasUnreadDiaryNotes && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>
          )}

          <div className="w-px h-3 bg-slate-700" />

          {/* Sound & Guide buttons */}
          <button
            onClick={onToggleMute}
            className="p-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all"
            title={isMuted ? 'تشغيل المؤثرات' : 'كتم المؤثرات'}
          >
            {isMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
          </button>

          <button
            onClick={onOpenGuide}
            className="p-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all"
            title="دليل اللعبة والأزرار"
          >
            <HelpCircle className="w-3 h-3 text-cyan-400" />
          </button>

          <button
            onClick={onRestartLoop}
            className="p-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all"
            title="إعادة بدء الليلة (Restart Loop)"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Inventory Hotbar (Centered at top, with drop support) */}
      <div className="flex flex-col items-center mt-1.5 gap-0.5">
        <div className="pointer-events-auto flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 rounded-2xl border border-white/15 shadow-xl">
          {Array.from({ length: 5 }).map((_, idx) => {
            const item: InventoryItem | undefined = player.inventory[idx];
            const isSelected = player.selectedItemIndex === idx;

            return (
              <button
                key={idx}
                onClick={() => onSelectItem(idx)}
                onPointerDown={(e) => handlePointerDown(idx, e)}
                onPointerMove={(e) => handlePointerMove(idx, e)}
                onPointerUp={handlePointerUpOrCancel}
                onPointerCancel={handlePointerUpOrCancel}
                className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border transition-all active:scale-95 touch-none ${
                  isSelected
                    ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400/40 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-500'
                }`}
                title={item ? `${item.nameAr} - اضغط مطولاً أو اسحب لأسفل للإسقاط` : `فارغ (${idx + 1})`}
              >
                {item ? (
                  <>
                    <span className="text-sm sm:text-base select-none">{item.icon}</span>
                    {item.uses !== undefined && (
                      <span className="absolute bottom-0 right-0.5 text-[7px] font-pixel text-amber-300 bg-black/80 px-0.5 rounded-sm leading-none">
                        {item.uses}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[8px] text-slate-600 font-pixel">{idx + 1}</span>
                )}
              </button>
            );
          })}

          {/* Quick Drop Button if active item selected */}
          {activeSelectedItem && onDropItem && (
            <button
              onClick={() => onDropItem(player.selectedItemIndex)}
              className="flex items-center gap-1 px-1.5 py-1 rounded-xl bg-rose-950/80 hover:bg-rose-900/90 border border-rose-500/50 text-rose-300 text-[8px] font-pixel transition-all active:scale-90 shadow-md ml-0.5"
              title={`إلقاء ${activeSelectedItem.nameAr} على الأرض`}
            >
              <ArrowDownToLine className="w-3 h-3 text-rose-400" />
              <span className="hidden sm:inline">إلقاء</span>
            </button>
          )}
        </div>

        {/* Compact Tooltip instruction */}
        <span className="text-[7.5px] text-slate-400/80 font-sans tracking-tight">
          اضغط مطولاً أو اسحب العنصر لأسفل لإلقائه على الأرض
        </span>

        {/* Dedicated Top Text Bar (شريط النصوص العلوي) - Small, crisp, unified for React & notifications */}
        {topBarText && (
          <div className="mt-1 pointer-events-none animate-fadeIn flex justify-center max-w-xl px-2">
            <div className="bg-slate-950/95 text-amber-200 border border-amber-500/60 rounded-full px-3 py-0.5 text-[9.5px] sm:text-[11px] font-mono tracking-tight shadow-2xl backdrop-blur-md flex items-center gap-1.5 ring-1 ring-black/70">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span className="truncate">{topBarText}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
