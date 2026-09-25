import React, { ReactNode } from 'react';

interface TooltipProps {
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

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    'bottom-left': 'top-full right-0 mt-2',
    'bottom-right': 'top-full left-0 mt-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent',
    'bottom-left': 'bottom-full right-3.5 border-b-slate-900 border-x-transparent border-t-transparent',
    'bottom-right': 'bottom-full left-3.5 border-b-slate-900 border-x-transparent border-t-transparent',
  };

  return (
    <div className={`relative inline-flex items-center group/tooltip ${className}`}>
      {children}
      <div
        role="tooltip"
        className={`absolute z-50 pointer-events-none whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform scale-95 group-hover/tooltip:scale-100 ${
          delay ? 'group-hover/tooltip:delay-100' : ''
        } ${positionClasses[position]}`}
      >
        <div className="bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700/60 max-w-xs text-center leading-relaxed">
          {content}
        </div>
        <div
          className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
        />
      </div>
    </div>
  );
};

export default Tooltip;
