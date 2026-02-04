
import React, { useState, useRef } from 'react';
import { Student, AttendanceStatus } from '../types';

interface SwipeableCardProps {
  student: Student;
  status: AttendanceStatus;
  onMark: (status: AttendanceStatus) => void;
  mode?: 'NORMAL' | 'POST_CUTOFF';
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({ student, status, onMark, mode = 'NORMAL' }) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (mode === 'POST_CUTOFF') return;
    startX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragOffset(Math.max(-100, Math.min(100, currentX - startX.current)));
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 70) onMark('PRESENT');
    else if (dragOffset < -70) onMark('ABSENT');
    setDragOffset(0);
  };

  const getStatusColor = () => {
    if (mode === 'POST_CUTOFF' && (status === 'UNMARKED' || status === 'ABSENT')) return 'border-amber-200 bg-amber-50';
    switch (status) {
      case 'PRESENT': return 'border-emerald-500 bg-emerald-50';
      case 'ABSENT': return 'border-rose-500 bg-rose-50';
      case 'LATE': return 'border-amber-500 bg-amber-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] h-20 shadow-sm transition-all group active:scale-[0.98]">
      {/* Background Actions */}
      <div className="absolute inset-0 flex justify-between items-center px-6 bg-gray-50">
        <div className={`flex flex-col items-center transition-opacity ${dragOffset > 20 ? 'opacity-100' : 'opacity-0'}`}>
          <i className="fas fa-check text-emerald-500 text-xl"></i>
        </div>
        <div className={`flex flex-col items-center transition-opacity ${dragOffset < -20 ? 'opacity-100' : 'opacity-0'}`}>
          <i className="fas fa-times text-rose-500 text-xl"></i>
        </div>
      </div>

      <div
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${dragOffset}px)` }}
        className={`absolute inset-0 border flex items-center p-4 cursor-grab active:cursor-grabbing transition-colors duration-300 ${getStatusColor()}`}
      >
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-500 mr-4 text-xs">
          {student.firstName[0]}{student.lastName[0]}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-800 text-sm leading-tight">{student.firstName} {student.lastName}</h4>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">
            {status === 'UNMARKED' ? 'Not Marked' : status}
          </p>
        </div>
        
        {mode === 'POST_CUTOFF' && (status === 'UNMARKED' || status === 'ABSENT') ? (
          <button 
            onClick={() => onMark('LATE')}
            className="px-4 py-2 bg-amber-500 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-amber-900/10"
          >
            Mark Late
          </button>
        ) : (
          <div className="text-gray-200">
            {status === 'PRESENT' && <i className="fas fa-check-circle text-emerald-500"></i>}
            {status === 'ABSENT' && <i className="fas fa-times-circle text-rose-500"></i>}
            {status === 'LATE' && <i className="fas fa-clock text-amber-500"></i>}
            {status === 'UNMARKED' && <i className="fas fa-ellipsis-h"></i>}
          </div>
        )}
      </div>
    </div>
  );
};

export default SwipeableCard;
