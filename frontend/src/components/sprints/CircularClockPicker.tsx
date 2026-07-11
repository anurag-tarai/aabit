import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface CircularClockPickerProps {
  initialTime: string; // "HH:MM" (24h format)
  onSave: (timeStr: string) => void;
  onClose: () => void;
  title?: string;
}

export const CircularClockPicker: React.FC<CircularClockPickerProps> = ({
  initialTime,
  onSave,
  onClose,
  title = "Select Time"
}) => {
  // Parse initial time
  const [initH, initM] = (initialTime || "12:00").split(':').map(Number);
  const isPMInitial = initH >= 12;
  const initHour12 = initH % 12 === 0 ? 12 : initH % 12;

  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const [hour, setHour] = useState<number>(initHour12);
  const [minute, setMinute] = useState<number>(initM || 0);
  const [period, setPeriod] = useState<'AM' | 'PM'>(isPMInitial ? 'PM' : 'AM');
  const [isDragging, setIsDragging] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const cx = 110;
  const cy = 110;
  const r = 82; // radius for numbers

  // Hours: 1 to 12
  const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  // Minutes: 0 to 55 (multiples of 5)
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const handleSVGInteraction = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - rect.left - cx;
    const y = clientY - rect.top - cy;

    // Calculate angle in degrees (0 to 360) where 12 o'clock is 0
    let angleRad = Math.atan2(y, x);
    let angleDeg = angleRad * (180 / Math.PI);
    let adjustedAngle = (angleDeg + 90 + 360) % 360;

    if (mode === 'hour') {
      let h = Math.round(adjustedAngle / 30);
      if (h === 0) h = 12;
      setHour(h);
    } else {
      let m = Math.round(adjustedAngle / 6);
      if (m === 60) m = 0;
      setMinute(m);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    handleSVGInteraction(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    setIsDragging(true);
    const touch = e.touches[0];
    handleSVGInteraction(touch.clientX, touch.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    handleSVGInteraction(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    handleSVGInteraction(touch.clientX, touch.clientY);
  };

  const handleMouseUpOrLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      // Auto transition from hour selection to minute selection
      if (mode === 'hour') {
        setTimeout(() => setMode('minute'), 250);
      }
    }
  };

  const handleSave = () => {
    let finalH = hour;
    if (period === 'PM') {
      if (hour !== 12) finalH += 12;
    } else {
      if (hour === 12) finalH = 0;
    }
    const finalHStr = String(finalH).padStart(2, '0');
    const finalMStr = String(minute).padStart(2, '0');
    onSave(`${finalHStr}:${finalMStr}`);
  };

  // Get active hand angle
  const activeAngle = mode === 'hour' ? (hour % 12) * 30 : minute * 6;
  const handRad = (activeAngle * Math.PI) / 180;
  const handX = cx + r * Math.sin(handRad);
  const handY = cy - r * Math.cos(handRad);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm font-mono text-sm">
      <div className="bg-[#0c0c0c] border border-neutral-800 rounded-lg max-w-[280px] w-full p-4 flex flex-col items-center gap-4 shadow-2xl animate-in zoom-in duration-150">
        
        {/* Header Title */}
        <div className="flex justify-between items-center w-full border-b border-neutral-900 pb-2">
          <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">{title}</span>
          <button onClick={onClose} className="text-neutral-600 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Readout display: Big numbers */}
        <div className="flex items-center justify-center gap-2 py-1 bg-neutral-950 rounded-lg border border-neutral-900 w-full">
          <div className="flex items-baseline gap-1">
            <button
              onClick={() => setMode('hour')}
              className={`text-3xl font-bold transition-colors ${mode === 'hour' ? 'text-emerald-450' : 'text-neutral-600'}`}
            >
              {String(hour).padStart(2, '0')}
            </button>
            <span className="text-2xl text-neutral-800">:</span>
            <button
              onClick={() => setMode('minute')}
              className={`text-3xl font-bold transition-colors ${mode === 'minute' ? 'text-emerald-450' : 'text-neutral-600'}`}
            >
              {String(minute).padStart(2, '0')}
            </button>
          </div>
          
          {/* AM / PM switcher */}
          <div className="flex flex-col gap-0.5 ml-4 border-l border-neutral-900 pl-3">
            <button
              onClick={() => setPeriod('AM')}
              className={`text-[10px] font-bold py-0.5 px-1.5 rounded transition-colors ${period === 'AM' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/50' : 'text-neutral-600'}`}
            >
              AM
            </button>
            <button
              onClick={() => setPeriod('PM')}
              className={`text-[10px] font-bold py-0.5 px-1.5 rounded transition-colors ${period === 'PM' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/50' : 'text-neutral-600'}`}
            >
              PM
            </button>
          </div>
        </div>

        {/* SVG Clock Face */}
        <div className="relative select-none touch-none">
          <svg
            ref={svgRef}
            width="220"
            height="220"
            className="cursor-pointer bg-neutral-950 border border-neutral-900 rounded-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUpOrLeave}
            onTouchCancel={handleMouseUpOrLeave}
          >
            {/* Center circle */}
            <circle cx={cx} cy={cy} r="3" fill="#10b981" />

            {/* Hand Line */}
            <line
              x1={cx}
              y1={cy}
              x2={handX}
              y2={handY}
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              className="transition-all duration-200 ease-out"
            />

            {/* Selection Indicator Circle */}
            <circle
              cx={handX}
              cy={handY}
              r="14"
              fill="#10b981"
              fillOpacity="0.25"
              stroke="#10b981"
              strokeWidth="1.5"
              className="transition-all duration-200 ease-out"
            />
            <circle 
              cx={handX} 
              cy={handY} 
              r="3" 
              fill="#10b981" 
              className="transition-all duration-200 ease-out"
            />

            {/* Labels */}
            {mode === 'hour'
              ? hoursList.map((h) => {
                  const angle = (h % 12) * 30;
                  const rad = (angle * Math.PI) / 180;
                  const tx = cx + r * Math.sin(rad);
                  const ty = cy - r * Math.cos(rad);
                  const isSelected = h === hour;

                  return (
                    <text
                      key={h}
                      x={tx}
                      y={ty + 4} // adjust vertically to align center
                      textAnchor="middle"
                      className={`text-[10px] font-bold font-sans transition-colors ${
                        isSelected ? 'fill-emerald-400 font-extrabold' : 'fill-neutral-600'
                      }`}
                    >
                      {h}
                    </text>
                  );
                })
              : minutesList.map((m) => {
                  const angle = m * 6;
                  const rad = (angle * Math.PI) / 180;
                  const tx = cx + r * Math.sin(rad);
                  const ty = cy - r * Math.cos(rad);
                  const isSelected = m === minute;

                  return (
                    <text
                      key={m}
                      x={tx}
                      y={ty + 4}
                      textAnchor="middle"
                      className={`text-[10px] font-bold font-sans transition-colors ${
                        isSelected ? 'fill-emerald-400 font-extrabold' : 'fill-neutral-600'
                      }`}
                    >
                      {String(m).padStart(2, '0')}
                    </text>
                  );
                })}
          </svg>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full justify-between mt-2 pt-2 border-t border-neutral-900">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 border border-neutral-800 hover:border-neutral-700 rounded transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs text-black bg-emerald-600 hover:bg-emerald-500 font-bold rounded transition-colors"
          >
            OK
          </button>
        </div>

      </div>
    </div>
  );
};
