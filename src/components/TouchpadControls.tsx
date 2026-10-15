/**
 * Mobile Virtual Thumbstick & Compact Action Cluster
 * Features:
 * - Analog Virtual Joystick (360-degree smooth movement in 2.5D)
 * - Compact, sleek action buttons that don't block the screen
 * - Pointer-event debouncing to eliminate double-firing glitches (flashlight / doors)
 */
import React, { useRef } from 'react';
import { Hand, Sparkles, Flashlight, Shield, Zap, ArrowDownToLine } from 'lucide-react';
import { VirtualJoystick } from './VirtualJoystick';

interface TouchpadControlsProps {
  onJoystickMove: (vector: { x: number; y: number }) => void;
  onInteract: () => void;
  onUseItem: () => void;
  onDropItem?: () => void;
  onToggleFlashlight: () => void;
  onToggleHide: () => void;
  onToggleRun: (running: boolean) => void;
  isRunning: boolean;
  flashlightOn: boolean;
  isHiding: boolean;
  canInteract: boolean;
  canHide: boolean;
  hasActiveItem: boolean;
  promptText: string | null;
}

export const TouchpadControls: React.FC<TouchpadControlsProps> = ({
  onJoystickMove,
  onInteract,
  onUseItem,
  onDropItem,
  onToggleFlashlight,
  onToggleHide,
  onToggleRun,
  isRunning,
  flashlightOn,
  isHiding,
  canInteract,
  canHide,
  hasActiveItem,
  promptText,
}) => {
  // Debounce protection map to prevent rapid double-clicks on touch devices
  const lastActionTimeRef = useRef<Record<string, number>>({});

  const triggerAction = (actionKey: string, callback: () => void, cooldownMs = 250) => {
    const now = Date.now();
    const lastTime = lastActionTimeRef.current[actionKey] || 0;
    if (now - lastTime < cooldownMs) {
      return; // Prevent glitchy double-trigger
    }
    lastActionTimeRef.current[actionKey] = now;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // ignore
      }
    }
    callback();
  };

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none z-30 select-none pb-2 px-2 sm:pb-3 sm:px-4">
        <div className="flex items-end justify-between max-w-4xl mx-auto w-full">
          {/* LEFT ZONE: Compact Virtual Thumbstick Joystick - Shifted 5px to the right */}
          <div className="pointer-events-auto p-1 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 shadow-lg ml-[5px]">
            <VirtualJoystick onMove={onJoystickMove} size={82} />
          </div>

        {/* RIGHT ZONE: Sleek, Compact Action Button Cluster */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5 p-1.5 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg">
          {/* Top Mini-Row: Flashlight, Hide, Sprint */}
          <div className="flex items-center gap-1.5">
            {/* Flashlight toggle */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                triggerAction('flashlight', onToggleFlashlight, 200);
              }}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-semibold border transition-all active:scale-90 touch-none ${
                flashlightOn
                  ? 'bg-amber-500/90 text-slate-950 border-amber-300 shadow-md shadow-amber-500/30'
                  : 'bg-slate-800/75 text-slate-300 border-slate-700/80 hover:bg-slate-700/80'
              }`}
              title="Flashlight (Space)"
              aria-label="Flashlight"
            >
              <Flashlight className="w-4 h-4" />
            </button>

            {/* Hide / Unhide button */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                triggerAction('hide', onToggleHide, 300);
              }}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-semibold border transition-all active:scale-90 touch-none ${
                isHiding
                  ? 'bg-purple-600/90 text-white border-purple-400 ring-2 ring-purple-300 shadow-md'
                  : canHide
                  ? 'bg-purple-900/80 text-purple-300 border-purple-500/60 animate-pulse'
                  : 'bg-slate-800/75 text-slate-400 border-slate-700/80'
              }`}
              title="Hide (H)"
              aria-label="Hide"
            >
              <Shield className="w-4 h-4" />
            </button>

            {/* Sprint toggle / hold */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                triggerAction('sprint', () => onToggleRun(!isRunning), 150);
              }}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-semibold border transition-all active:scale-90 touch-none ${
                isRunning
                  ? 'bg-rose-600/90 text-white border-rose-400 shadow-md shadow-rose-600/30'
                  : 'bg-slate-800/75 text-slate-300 border-slate-700/80 hover:bg-slate-700/80'
              }`}
              title="Sprint (Shift)"
              aria-label="Sprint"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Primary Row: Use Item, Drop, & Interact */}
          <div className="flex items-center gap-1.5">
            {/* Quick Drop Button if active item */}
            {hasActiveItem && onDropItem && (
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  triggerAction('dropItem', onDropItem, 300);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-xs font-semibold border transition-all active:scale-90 touch-none bg-rose-950/70 border-rose-500/50 hover:bg-rose-900/80 text-rose-300 shadow-md"
                title="إلقاء الأداة (Q)"
                aria-label="Drop Item"
              >
                <ArrowDownToLine className="w-4 h-4 text-rose-400" />
              </button>
            )}

            {/* Use Item Button */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                triggerAction('useItem', onUseItem, 250);
              }}
              className={`h-9 px-3 flex items-center gap-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-90 touch-none ${
                hasActiveItem
                  ? 'bg-cyan-700/80 text-cyan-100 border-cyan-400/80 shadow-md shadow-cyan-600/20'
                  : 'bg-slate-800/75 text-slate-400 border-slate-700/80'
              }`}
              title="Use Item (F)"
              aria-label="Use Item"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span className="text-[9px] font-pixel">استخدام</span>
            </button>

            {/* Primary Action Button: INTERACT (Doors, Drawers, etc.) */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                triggerAction('interact', onInteract, 350);
              }}
              className={`h-9 px-3.5 flex items-center gap-1.5 rounded-xl text-xs font-bold border transition-all active:scale-90 touch-none ${
                canInteract
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300/50 animate-pulse'
                  : 'bg-slate-800/85 text-slate-200 border-slate-600'
              }`}
              title="Interact (E)"
              aria-label="Interact"
            >
              <Hand className="w-4 h-4" />
              <span className="text-[10px] font-pixel">تفاعل</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
