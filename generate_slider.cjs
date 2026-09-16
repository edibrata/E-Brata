const fs = require('fs');

const sliderComponent = `
const MultiThumbSlider = ({ values, onChange, disabled }: { values: number[], onChange: (v: number[]) => void, disabled?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const handlePointerDown = (index: number) => (e: React.PointerEvent) => {
    if (disabled) return;
    setDraggingIdx(index);
    e.preventDefault();
  };

  useEffect(() => {
    if (draggingIdx === null) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let percentage = ((e.clientX - rect.left) / rect.width) * 100;
      percentage = Math.round(Math.max(0, Math.min(100, percentage)));

      const min = draggingIdx === 0 ? 1 : values[draggingIdx - 1] + 1;
      const max = draggingIdx === 3 ? 99 : values[draggingIdx + 1] - 1;
      const clamped = Math.max(min, Math.min(max, percentage));

      if (clamped !== values[draggingIdx]) {
         const newValues = [...values];
         newValues[draggingIdx] = clamped;
         onChange(newValues);
      }
    };

    const handlePointerUp = () => {
      setDraggingIdx(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingIdx, values, onChange]);

  return (
    <div className="relative w-full h-16 flex items-center select-none px-3" ref={containerRef}>
      <div className="absolute inset-y-4 left-3 right-3 rounded-lg overflow-hidden flex shadow-inner">
         <div className="bg-rose-200/90 transition-all duration-75" style={{ width: \`\${values[0]}%\` }} />
         <div className="bg-orange-200/90 transition-all duration-75" style={{ width: \`\${values[1] - values[0]}%\` }} />
         <div className="bg-amber-200/90 transition-all duration-75" style={{ width: \`\${values[2] - values[1]}%\` }} />
         <div className="bg-emerald-200/90 transition-all duration-75" style={{ width: \`\${values[3] - values[2]}%\` }} />
         <div className="bg-teal-200/90 transition-all duration-75" style={{ width: \`\${100 - values[3]}%\` }} />
      </div>

      {values.map((val, idx) => (
        <div
          key={idx}
          onPointerDown={handlePointerDown(idx)}
          className={\`absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 rounded-full bg-white border flex items-center justify-center transition-transform shadow-md z-10 \${disabled ? 'cursor-default opacity-90 border-slate-200' : 'cursor-grab hover:scale-110 active:cursor-grabbing hover:border-indigo-500'} \${draggingIdx === idx ? 'border-indigo-600 scale-125 z-20 shadow-lg cursor-grabbing ring-4 ring-indigo-100' : 'border-slate-300'}\`}
          style={{ left: \`calc(\${val}% + 12px)\`, touchAction: 'none' }}
        >
          <div className="flex gap-[2px]">
             <div className="w-[1.5px] h-2.5 bg-slate-300 rounded-full" />
             <div className="w-[1.5px] h-2.5 bg-slate-300 rounded-full" />
          </div>
          
          <div className={\`absolute -bottom-7 w-8 text-center text-[11px] font-bold transition-colors \${draggingIdx === idx ? 'text-indigo-700 scale-110' : 'text-slate-600'}\`}>
             {val}
          </div>
        </div>
      ))}
      
      {/* 0 and 100 markers */}
      <div className="absolute -bottom-3 left-0 text-[10px] font-bold text-slate-400">0</div>
      <div className="absolute -bottom-3 right-0 text-[10px] font-bold text-slate-400">100</div>
    </div>
  );
};
`;

let code = fs.readFileSync('src/components/KriteriaKetuntasan.tsx', 'utf8');

// Insert the MultiThumbSlider component right before KriteriaKetuntasan export
code = code.replace('export const KriteriaKetuntasan:', sliderComponent + '\nexport const KriteriaKetuntasan:');

// Replace the old inputs and color bars block with the MultiThumbSlider
const oldBlockRegex = /<div className="grid grid-cols-5 gap-2 text-center text-\[10px\] mb-2">[\s\S]*?(?={isEditing && !isValid && \()/;

const newBlock = `<div className="grid grid-cols-5 gap-2 text-center text-[10px] mb-6">
              <div className="font-bold text-rose-700">Belum<br/>(Bimbingan)</div>
              <div className="font-bold text-orange-600">Belum<br/>(Remedial Sebagian)</div>
              <div className="font-bold text-amber-600">Hampir<br/>(Perlu Peningkatan)</div>
              <div className="font-bold text-emerald-600">Sudah<br/>(Tuntas)</div>
              <div className="font-bold text-teal-700">Sudah<br/>(Pengayaan)</div>
            </div>

            <MultiThumbSlider 
              values={isEditing ? tempIntervals : currentIntervals} 
              onChange={setTempIntervals} 
              disabled={!isEditing} 
            />
            
            `;

code = code.replace(oldBlockRegex, newBlock);

fs.writeFileSync('src/components/KriteriaKetuntasan.tsx', code);
