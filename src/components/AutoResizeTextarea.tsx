import React, { useEffect, useRef, forwardRef, useImperativeHandle, useLayoutEffect } from 'react';

export interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
}

export const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ value, minRows = 2, className = '', onChange, onInput, style, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    const adjustHeight = () => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = 'auto';
      const scrollH = el.scrollHeight;
      if (scrollH > 0) {
        el.style.height = `${scrollH}px`;
      }
    };

    useLayoutEffect(() => {
      adjustHeight();
    }, [value]);

    useEffect(() => {
      // Also adjust on window resize or when fonts/styles settle
      adjustHeight();
      window.addEventListener('resize', adjustHeight);
      return () => window.removeEventListener('resize', adjustHeight);
    }, []);

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      if (onInput) onInput(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      if (onChange) onChange(e);
    };

    return (
      <textarea
        ref={textareaRef}
        value={value}
        rows={minRows}
        onInput={handleInput}
        onChange={handleChange}
        style={{ ...style }}
        className={`resize-y transition-none overflow-hidden hover:overflow-auto ${className}`}
        {...props}
      />
    );
  }
);

AutoResizeTextarea.displayName = 'AutoResizeTextarea';
export default AutoResizeTextarea;
