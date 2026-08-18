import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GripHorizontal, GripVertical } from 'lucide-react';
import { AppTheme } from '../types';

interface ResizeDividerProps {
  direction: 'horizontal' | 'vertical';
  onResizeStart?: () => void;
  onResize: (delta: number, currentClientPos: number) => void;
  onResizeEnd?: () => void;
  onDoubleClick?: () => void;
  title?: string;
  className?: string;
  theme?: AppTheme;
}

export const ResizeDivider: React.FC<ResizeDividerProps> = ({
  direction,
  onResizeStart,
  onResize,
  onResizeEnd,
  onDoubleClick,
  title,
  className = '',
  theme = 'dark',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef<number>(0);
  const lastPosRef = useRef<number>(0);
  const isDark = theme === 'dark';

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      const pos = direction === 'horizontal' ? e.clientY : e.clientX;
      startPosRef.current = pos;
      lastPosRef.current = pos;
      if (onResizeStart) onResizeStart();
    },
    [direction, onResizeStart]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      setIsDragging(true);
      const touch = e.touches[0];
      const pos = direction === 'horizontal' ? touch.clientY : touch.clientX;
      startPosRef.current = pos;
      lastPosRef.current = pos;
      if (onResizeStart) onResizeStart();
    },
    [direction, onResizeStart]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'horizontal' ? e.clientY : e.clientX;
      const delta = currentPos - lastPosRef.current;
      lastPosRef.current = currentPos;
      onResize(delta, currentPos);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const currentPos = direction === 'horizontal' ? touch.clientY : touch.clientX;
      const delta = currentPos - lastPosRef.current;
      lastPosRef.current = currentPos;
      onResize(delta, currentPos);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (onResizeEnd) onResizeEnd();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchcancel', handleMouseUp);

    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = direction === 'horizontal' ? 'row-resize' : 'col-resize';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchcancel', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, direction, onResize, onResizeEnd]);

  if (direction === 'horizontal') {
    return (
      <div
        id="ilmhub-resize-divider-horizontal"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={onDoubleClick}
        title={title || 'Drag to resize, double-click to reset'}
        className={`group relative flex h-2 w-full cursor-row-resize items-center justify-center border-t border-b transition-colors select-none z-30 ${
          isDark
            ? 'bg-[#071A2F] border-[#1E3A5F]/60 hover:bg-[#0B2747]'
            : 'bg-slate-200 border-slate-300 hover:bg-slate-300'
        } ${
          isDragging
            ? isDark
              ? 'bg-[#FFD43B]/20 border-[#FFD43B]/60'
              : 'bg-sky-200 border-sky-400'
            : ''
        } ${className}`}
      >
        {/* Glow Line Indicator */}
        <div
          className={`h-[2px] w-full transition-all ${
            isDragging
              ? isDark
                ? 'bg-[#FFD43B] shadow-[0_0_8px_#FFD43B]'
                : 'bg-sky-500 shadow-[0_0_8px_rgba(2,132,199,0.5)]'
              : isDark
              ? 'bg-transparent group-hover:bg-[#FFD43B]/70'
              : 'bg-transparent group-hover:bg-sky-400'
          }`}
        />
        {/* Central Grip Indicator */}
        <div
          className={`absolute flex items-center justify-center rounded-full px-2 py-0.5 transition-all ${
            isDragging
              ? isDark
                ? 'bg-[#FFD43B] text-[#071A2F] shadow-md scale-110'
                : 'bg-sky-600 text-white shadow-md scale-110'
              : isDark
              ? 'bg-[#0B2747] border border-[#1E3A5F] text-slate-400 group-hover:border-[#FFD43B]/50 group-hover:text-[#FFD43B]'
              : 'bg-white border border-slate-300 text-slate-500 group-hover:border-sky-400 group-hover:text-sky-600 shadow-xs'
          }`}
        >
          <GripHorizontal className="h-3.5 w-3.5" />
        </div>
      </div>
    );
  }

  return (
    <div
      id="ilmhub-resize-divider-vertical"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onDoubleClick={onDoubleClick}
      title={title || 'Drag to resize, double-click to reset'}
      className={`group relative flex w-2 h-full cursor-col-resize items-center justify-center border-l border-r transition-colors select-none z-30 shrink-0 ${
        isDark
          ? 'bg-[#071A2F] border-[#1E3A5F]/60 hover:bg-[#0B2747]'
          : 'bg-slate-200 border-slate-300 hover:bg-slate-300'
      } ${
        isDragging
          ? isDark
            ? 'bg-[#FFD43B]/20 border-[#FFD43B]/60'
            : 'bg-sky-200 border-sky-400'
          : ''
      } ${className}`}
    >
      {/* Glow Line Indicator */}
      <div
        className={`w-[2px] h-full transition-all ${
          isDragging
            ? isDark
              ? 'bg-[#FFD43B] shadow-[0_0_8px_#FFD43B]'
              : 'bg-sky-500 shadow-[0_0_8px_rgba(2,132,199,0.5)]'
            : isDark
            ? 'bg-transparent group-hover:bg-[#FFD43B]/70'
            : 'bg-transparent group-hover:bg-sky-400'
        }`}
      />
      {/* Central Grip Indicator */}
      <div
        className={`absolute flex items-center justify-center rounded-full py-2 px-0.5 transition-all ${
          isDragging
            ? isDark
              ? 'bg-[#FFD43B] text-[#071A2F] shadow-md scale-110'
              : 'bg-sky-600 text-white shadow-md scale-110'
            : isDark
            ? 'bg-[#0B2747] border border-[#1E3A5F] text-slate-400 group-hover:border-[#FFD43B]/50 group-hover:text-[#FFD43B]'
            : 'bg-white border border-slate-300 text-slate-500 group-hover:border-sky-400 group-hover:text-sky-600 shadow-xs'
        }`}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>
    </div>
  );
};
