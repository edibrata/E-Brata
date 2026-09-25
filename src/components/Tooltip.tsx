import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'bottom-left' | 'bottom-right';
  className?: string;
  delay?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
  delay = false,
}) => {
  if (!content) return <>{children}</>;

  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    finalPos: 'top' | 'bottom' | 'left' | 'right';
    arrowLeft?: number;
    arrowTop?: number;
  }>({ top: 0, left: 0, finalPos: 'top' });

  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const GAP = 8;
    const EDGE_PADDING = 10;

    // Ambil dimensi tooltip aktual jika sudah dirender, atau estimasi
    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 180;
    const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 36;

    let targetPos: 'top' | 'bottom' | 'left' | 'right' = 'top';
    if (position === 'bottom' || position === 'bottom-left' || position === 'bottom-right') {
      targetPos = 'bottom';
    } else if (position === 'left') {
      targetPos = 'left';
    } else if (position === 'right') {
      targetPos = 'right';
    }

    // 1. Cek benturan vertikal (Mentok Atas -> ke Bawah, Mentok Bawah -> ke Atas)
    if (targetPos === 'top' && rect.top - tooltipHeight - GAP < EDGE_PADDING) {
      targetPos = 'bottom';
    } else if (targetPos === 'bottom' && rect.bottom + tooltipHeight + GAP > vh - EDGE_PADDING) {
      targetPos = 'top';
    }

    // 2. Cek benturan horizontal jika targetPos left/right (Mentok Kiri -> ke Kanan, Mentok Kanan -> ke Kiri)
    if (targetPos === 'left' && rect.left - tooltipWidth - GAP < EDGE_PADDING) {
      targetPos = 'right';
    } else if (targetPos === 'right' && rect.right + tooltipWidth + GAP > vw - EDGE_PADDING) {
      targetPos = 'left';
    }

    let top = 0;
    let left = 0;
    let arrowLeft: number | undefined = undefined;
    let arrowTop: number | undefined = undefined;

    const triggerCenterX = rect.left + rect.width / 2;
    const triggerCenterY = rect.top + rect.height / 2;

    if (targetPos === 'top') {
      top = rect.top - tooltipHeight - GAP;
      left = triggerCenterX - tooltipWidth / 2;

      // Mentok tepi kiri / kanan saat posisi top
      if (left < EDGE_PADDING) {
        left = EDGE_PADDING;
      } else if (left + tooltipWidth > vw - EDGE_PADDING) {
        left = vw - EDGE_PADDING - tooltipWidth;
      }
      arrowLeft = Math.max(12, Math.min(tooltipWidth - 12, triggerCenterX - left));
    } else if (targetPos === 'bottom') {
      top = rect.bottom + GAP;
      left = triggerCenterX - tooltipWidth / 2;

      // Mentok tepi kiri / kanan saat posisi bottom
      if (left < EDGE_PADDING) {
        left = EDGE_PADDING;
      } else if (left + tooltipWidth > vw - EDGE_PADDING) {
        left = vw - EDGE_PADDING - tooltipWidth;
      }
      arrowLeft = Math.max(12, Math.min(tooltipWidth - 12, triggerCenterX - left));
    } else if (targetPos === 'left') {
      left = rect.left - tooltipWidth - GAP;
      top = triggerCenterY - tooltipHeight / 2;

      // Mentok tepi atas / bawah saat posisi left
      if (top < EDGE_PADDING) {
        top = EDGE_PADDING;
      } else if (top + tooltipHeight > vh - EDGE_PADDING) {
        top = vh - EDGE_PADDING - tooltipHeight;
      }
      arrowTop = Math.max(10, Math.min(tooltipHeight - 10, triggerCenterY - top));
    } else if (targetPos === 'right') {
      left = rect.right + GAP;
      top = triggerCenterY - tooltipHeight / 2;

      // Mentok tepi atas / bawah saat posisi right
      if (top < EDGE_PADDING) {
        top = EDGE_PADDING;
      } else if (top + tooltipHeight > vh - EDGE_PADDING) {
        top = vh - EDGE_PADDING - tooltipHeight;
      }
      arrowTop = Math.max(10, Math.min(tooltipHeight - 10, triggerCenterY - top));
    }

    setCoords({ top, left, finalPos: targetPos, arrowLeft, arrowTop });
  }, [position]);

  const handleMouseEnter = () => {
    if (delay) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 150);
    } else {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      const frame = requestAnimationFrame(calculatePosition);
      
      const handleScrollOrResize = () => {
        calculatePosition();
      };
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);

      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [isVisible, calculatePosition]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <span
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      className={`relative inline-flex items-center ${className}`}
    >
      {children}
      {isVisible && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className="fixed z-[99999] pointer-events-none transition-opacity duration-150 animate-in fade-in-50 zoom-in-95 duration-100"
          >
            <div className="relative bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-2xl border border-slate-700/80 max-w-[280px] sm:max-w-xs text-center leading-relaxed whitespace-normal break-words">
              {content}

              {/* Jarum Panah Dinamis Mengarah ke Trigger */}
              {coords.finalPos === 'top' && (
                <div
                  style={{ left: `${coords.arrowLeft ?? 16}px` }}
                  className="absolute top-full -translate-x-1/2 -mt-[1px] w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900"
                />
              )}
              {coords.finalPos === 'bottom' && (
                <div
                  style={{ left: `${coords.arrowLeft ?? 16}px` }}
                  className="absolute bottom-full -translate-x-1/2 -mb-[1px] w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-slate-900"
                />
              )}
              {coords.finalPos === 'left' && (
                <div
                  style={{ top: `${coords.arrowTop ?? 16}px` }}
                  className="absolute left-full -translate-y-1/2 -ml-[1px] w-0 h-0 border-y-4 border-y-transparent border-l-4 border-l-slate-900"
                />
              )}
              {coords.finalPos === 'right' && (
                <div
                  style={{ top: `${coords.arrowTop ?? 16}px` }}
                  className="absolute right-full -translate-y-1/2 -mr-[1px] w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-slate-900"
                />
              )}
            </div>
          </div>,
          document.body
        )}
    </span>
  );
};

export default Tooltip;
