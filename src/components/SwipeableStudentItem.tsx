'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';;

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
    status?: string | null;
    arrival_time?: string;
}

interface Props {
    student: Student;
    onMark: (id: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => void;
    isPastCutoff: boolean;
    disabled?: boolean;
}

export default function SwipeableStudentItem({ student, onMark, isPastCutoff, disabled }: Props) {
    const [offsetX, setOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);
    const itemRef = useRef<HTMLDivElement>(null);

    // Reset position when status is updated
    useEffect(() => {
        setOffsetX(0);
    }, [student.status]);

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        if (disabled) return;
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        startX.current = clientX;
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (disabled || !isDragging) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const diff = clientX - startX.current;

        // Limit swipe distance
        if (diff > 150) setOffsetX(150);
        else if (diff < -150) setOffsetX(-150);
        else setOffsetX(diff);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        const threshold = 80;

        if (offsetX > threshold) {
            // Swiped Right
            if (isPastCutoff) {
                onMark(student.id, 'LATE');
            } else {
                onMark(student.id, 'PRESENT');
            }
        } else if (offsetX < -threshold) {
            // Swiped Left
            if (isPastCutoff) {
                // Docs say: "Right or Left Swipe: Marks student as Late"
                onMark(student.id, 'LATE');
            } else {
                onMark(student.id, 'ABSENT');
            }
        }

        setOffsetX(0);
    };

    const getStatusColor = () => {
        switch (student.status) {
            case 'PRESENT': return 'bg-green-50 border-green-200';
            case 'ABSENT': return 'bg-red-50 border-red-200';
            case 'LATE': return 'bg-yellow-50 border-yellow-200';
            default: return 'bg-white border-gray-100';
        }
    };

    // Background indicators
    const rightIndicator = isPastCutoff
        ? { text: 'LATE', color: 'bg-yellow-500', icon: <Clock /> }
        : { text: 'PRESENT', color: 'bg-green-500', icon: <Check /> };

    const leftIndicator = isPastCutoff
        ? { text: 'LATE', color: 'bg-yellow-500', icon: <Clock /> }
        : { text: 'ABSENT', color: 'bg-red-500', icon: <X /> };

    return (
        <div className="relative overflow-hidden rounded-xl h-20 select-none touch-pan-y">
            {/* Background Layers */}
            <div className={cn("absolute inset-0 flex items-center justify-between px-6 text-white font-bold", rightIndicator.color)}>
                <div className="flex items-center gap-2">{rightIndicator.icon} {rightIndicator.text}</div>
            </div>
            <div
                className={cn("absolute inset-0 flex items-center justify-end px-6 text-white font-bold", leftIndicator.color)}
                style={{ opacity: offsetX < 0 ? 1 : 0 }}
            >
                <div className="flex items-center gap-2">{leftIndicator.text} {leftIndicator.icon}</div>
            </div>

            {/* Foreground Card */}
            <div
                ref={itemRef}
                className={cn(
                    "absolute inset-0 flex items-center justify-between px-4 bg-white border shadow-sm transition-transform duration-200 ease-out",
                    getStatusColor(),
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                )}
                style={{ transform: `translateX(${offsetX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseMove={handleTouchMove}
                onMouseUp={handleTouchEnd}
                onMouseLeave={() => { if (isDragging) handleTouchEnd(); }}
            >
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                        {student.profile_picture ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={student.profile_picture} alt={student.first_name} className="h-full w-full object-cover" />
                        ) : (
                            student.first_name[0]
                        )}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{student.first_name} {student.last_name}</p>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-400 capitalize">{student.status === 'UNMARKED' ? 'Swipe to mark' : (student.status || 'UNMARKED')}</p>
                            {student.status === 'LATE' && student.arrival_time && (
                                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded">
                                    {student.arrival_time.substring(0, 5)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="text-gray-300 text-sm">
                    {isPastCutoff ? '< Slide >' : '< Absent | Present >'}
                </div>
            </div>
        </div>
    );
}
