/**
 * Virtual Thumbstick / Joystick for 2.5D Mobile Floor Movement
 * Provides 360-degree analog control with pointer capture and smooth return animation.
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  size?: number; // base diameter in px, default 84
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMove,
  size = 84,
}) => {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState<boolean>(false);
  const activePointerIdRef = useRef<number | null>(null);
  const maxRadius = size / 2 - 8; // Max thumb displacement

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (activePointerIdRef.current !== null) return;

    activePointerIdRef.current = e.pointerId;
    if (baseRef.current) {
      baseRef.current.setPointerCapture(e.pointerId);
    }
    setIsActive(true);
    updateKnobPosition(e.clientX, e.clientY);

    // Mild haptic pulse
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // ignore
      }
    }
  };

  const updateKnobPosition = useCallback((clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rawDx = clientX - centerX;
    const rawDy = clientY - centerY;
    const distance = Math.hypot(rawDx, rawDy);

    let normX = 0;
    let normY = 0;
    let clampedX = rawDx;
    let clampedY = rawDy;

    if (distance > maxRadius) {
      clampedX = (rawDx / distance) * maxRadius;
      clampedY = (rawDy / distance) * maxRadius;
    }

    setKnobPos({ x: clampedX, y: clampedY });

    // Deadzone (0.12) to avoid accidental micro drift
    const deadzone = 0.12;
    const ratio = distance / maxRadius;
    if (ratio > deadzone) {
      normX = Math.max(-1, Math.min(1, clampedX / maxRadius));
      normY = Math.max(-1, Math.min(1, clampedY / maxRadius));
    }

    onMove({ x: normX, y: normY });
  }, [maxRadius, onMove]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activePointerIdRef.current) return;
    e.preventDefault();
    updateKnobPosition(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activePointerIdRef.current) return;
    e.preventDefault();
    if (baseRef.current && baseRef.current.hasPointerCapture(e.pointerId)) {
      baseRef.current.releasePointerCapture(e.pointerId);
    }
    activePointerIdRef.current = null;
    setIsActive(false);
    setKnobPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  useEffect(() => {
    return () => {
      onMove({ x: 0, y: 0 });
    };
  }, [onMove]);

  return (
    <div
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`relative rounded-full select-none touch-none flex items-center justify-center transition-colors shadow-xl ${
        isActive
          ? 'bg-slate-900/75 border-2 border-amber-400/80 shadow-amber-500/20'
          : 'bg-black/50 border border-white/20'
      } backdrop-blur-md`}
      aria-label="Thumbstick Joystick"
    >
      {/* Directional Guide Cross Indicators */}
      <div className="absolute inset-2 rounded-full border border-dashed border-white/10 pointer-events-none" />
      <div className="absolute w-1 h-1 rounded-full bg-white/20 pointer-events-none" />

      {/* Draggable Thumb Knob */}
      <div
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: isActive ? 'none' : 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        className={`w-9 h-9 rounded-full pointer-events-none shadow-lg flex items-center justify-center border transition-colors ${
          isActive
            ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-200 text-slate-950 scale-105'
            : 'bg-slate-700/80 border-slate-500/60 text-slate-300'
        }`}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
      </div>
    </div>
  );
};
