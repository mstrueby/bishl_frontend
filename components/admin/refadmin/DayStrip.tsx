import React, { useEffect, useState, useRef } from 'react';
import apiClient from '../../../lib/apiClient';
import { DayStrip as DayStripData, SummaryCounts } from '../../../types/RefToolValues';
import LoadingState from '../../ui/LoadingState';

const GERMAN_WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
};

const describeArc = (cx: number, cy: number, r: number, startDeg: number, endDeg: number) => {
  const safeEnd = Math.min(endDeg, startDeg + 359.99);
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, safeEnd);
  const largeArcFlag = safeEnd - startDeg > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
};

const RingDiagram: React.FC<{ counts: SummaryCounts; size?: number }> = ({ counts, size = 60 }) => {
  const { totalMatches, fullyAssigned, partiallyAssigned, unassigned } = counts;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const strokeWidth = 5;

  if (totalMatches === 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      </svg>
    );
  }

  const segments: Array<{ count: number; color: string }> = [
    { count: fullyAssigned, color: '#22c55e' },
    { count: partiallyAssigned, color: '#eab308' },
    { count: unassigned, color: '#ef4444' },
  ].filter(s => s.count > 0);

  if (segments.length === 1) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={segments[0].color} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  const numSegments = segments.length;
  const GAP_DEG = 4;
  const totalGapDeg = numSegments * GAP_DEG;
  const usableDeg = 360 - totalGapDeg;

  let currentAngle = 0;
  const paths = segments.map(({ count, color }, i) => {
    const arcDeg = (count / totalMatches) * usableDeg;
    const startDeg = currentAngle;
    const endDeg = currentAngle + arcDeg;
    currentAngle = endDeg + GAP_DEG;
    const d = describeArc(cx, cy, r, startDeg, endDeg);
    return (
      <path
        key={i}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );
  });

  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      {paths}
    </svg>
  );
};

interface DayStripProps {
  year: number;
  month: number;
  selectedDate: string | null;
  onDaySelect: (date: string) => void;
}

const DayStrip: React.FC<DayStripProps> = ({ year, month, selectedDate, onDaySelect }) => {
  const [days, setDays] = useState<DayStripData[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchDayStrip = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/reftool/day-strip', {
          params: { year, month }
        });
        const data = Array.isArray(response.data) ? response.data : [];
        setDays(data);
      } catch (err) {
        console.error('Error fetching day strip:', err);
        setDays([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDayStrip();
  }, [year, month]);

  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedDate, days]);

  if (loading) {
    return <div className="py-4"><LoadingState /></div>;
  }

  if (days.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">Keine Spiele in diesem Monat</p>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto px-1 pt-1 pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      style={{ scrollbarWidth: 'thin' }}
    >
      {days.map((day) => {
        const dateObj = new Date(day.date + 'T00:00:00');
        const weekday = GERMAN_WEEKDAYS[dateObj.getDay()];
        const dayNum = dateObj.getDate();
        const isSelected = day.date === selectedDate;
        const hasMatches = day.counts.totalMatches > 0;

        return (
          <button
            key={day.date}
            ref={isSelected ? selectedRef : undefined}
            onClick={() => onDaySelect(day.date)}
            className={`
              flex-shrink-0 flex flex-col items-center justify-center rounded-lg transition-colors border border-gray-200
              ${isSelected
                ? 'ring-2 ring-indigo-500 bg-indigo-50'
                : hasMatches
                  ? 'hover:bg-gray-50 bg-white'
                  : 'hover:bg-gray-50 bg-white opacity-50'
              }
            `}
            style={{ width: 80, height: 80 }}
          >
            <div className="relative flex-shrink-0" style={{ width: 60, height: 60 }}>
              <RingDiagram counts={day.counts} size={60} />
              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                <span className={`text-xs font-medium ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                  {weekday}
                </span>
                <span className={`text-base font-bold ${isSelected ? 'text-indigo-700' : hasMatches ? 'text-gray-800' : 'text-gray-400'}`}>
                  {dayNum}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-gray-600 leading-none mt-1">
              {day.counts.totalMatches} {day.counts.totalMatches === 1 ? 'Spiel' : 'Spiele'}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default DayStrip;
