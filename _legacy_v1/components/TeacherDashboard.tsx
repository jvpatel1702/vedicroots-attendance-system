
import React, { useState, useMemo, useEffect } from 'react';
import { Profile, Classroom, Student, AttendanceRecord, Holiday, Vacation, ClassroomSubmission } from '../types';
import SwipeableCard from './SwipeableCard';

interface TeacherDashboardProps {
  user: Profile;
  data: any;
  onLogout: () => void;
  onUpdateAttendance: (record: any) => void;
  onFinalizeSubmission?: (classroomId: string) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, data, onLogout, onUpdateAttendance }) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const todayStr = new Date().toLocaleDateString('en-CA');

  // Keep time updated for cutoff logic
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const assignedClasses = useMemo(() => {
    const classIds = data.teacherClassrooms
      .filter((tc: any) => tc.teacherId === user.id)
      .map((tc: any) => tc.classroomId);
    return data.classrooms.filter((c: Classroom) => classIds.includes(c.id));
  }, [data, user.id]);

  useEffect(() => {
    if (!selectedClassId && assignedClasses.length > 0) {
      setSelectedClassId(assignedClasses[0].id);
    }
  }, [assignedClasses, selectedClassId]);

  const isHoliday = useMemo(() => data.holidays.some((h: Holiday) => h.date === todayStr), [data.holidays, todayStr]);
  const isWeekend = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  }, []);

  const cutoffDate = useMemo(() => {
    const [hours, minutes] = data.settings.cutoffTime.split(':').map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  }, [data.settings.cutoffTime]);

  const isPastCutoff = currentTime > cutoffDate;

  const filteredStudents = useMemo(() => {
    if (!selectedClassId) return [];
    const students = data.students.filter((s: Student) => s.classroomId === selectedClassId);
    return students.filter((s: Student) => {
      const isOnVacation = data.vacations.some((v: Vacation) => 
        v.studentId === s.id && todayStr >= v.startDate && todayStr <= v.endDate
      );
      return !isOnVacation;
    });
  }, [selectedClassId, data.students, data.vacations, todayStr]);

  const getStatus = (id: string) => data.attendance.find((a: any) => a.studentId === id && a.date === todayStr)?.status || 'UNMARKED';

  const submission = useMemo(() => 
    data.submissions.find((s: ClassroomSubmission) => s.classroomId === selectedClassId && s.date === todayStr),
    [data.submissions, selectedClassId, todayStr]
  );

  const markedCount = filteredStudents.filter(s => getStatus(s.id) !== 'UNMARKED').length;
  const totalCount = filteredStudents.length;
  const isComplete = markedCount === totalCount && totalCount > 0;

  const handleFinalize = () => {
    if (!isComplete) return;
    const newSubmission: ClassroomSubmission = {
      id: Math.random().toString(36).substr(2, 9),
      classroomId: selectedClassId!,
      date: todayStr,
      submittedAt: new Date().toISOString(),
      submittedBy: user.id
    };
    data.submissions.push(newSubmission);
    alert(`Attendance for ${data.classrooms.find((c:any) => c.id === selectedClassId)?.name} submitted successfully!`);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-2xl relative overflow-hidden font-sans">
      <header className="bg-white px-6 pt-10 pb-6 border-b border-gray-100 flex justify-between items-center z-20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <i className="fas fa-leaf text-[#1b4332] text-sm"></i>
            <span className="text-[10px] font-bold text-[#1b4332] uppercase tracking-[0.2em]">VedicRoots Connect</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">
            {isPastCutoff ? 'Post-Cutoff' : 'Morning Roll'}
          </h1>
          <p className="text-xs font-bold text-gray-400 mt-0.5">
            {isPastCutoff ? 'Viewing Exceptions' : `Submit before ${data.settings.cutoffTime}`}
          </p>
        </div>
        <button onClick={onLogout} className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center hover:text-rose-500 transition-colors">
          <i className="fas fa-sign-out-alt text-lg"></i>
        </button>
      </header>

      {/* Progress Indicator */}
      {!isPastCutoff && !submission && !isHoliday && !isWeekend && (
        <div className="bg-white px-6 py-3 border-b border-gray-50">
           <div className="flex justify-between items-center mb-1">
             <span className="text-[10px] font-black text-gray-400 uppercase">Progress</span>
             <span className="text-[10px] font-black text-[#1b4332] uppercase">{markedCount}/{totalCount} Students</span>
           </div>
           <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
             <div 
               className="h-full bg-[#2d6a4f] transition-all duration-500" 
               style={{ width: `${(markedCount / totalCount) * 100}%` }}
             ></div>
           </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
        {assignedClasses.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {assignedClasses.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClassId(c.id)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                  selectedClassId === c.id ? 'bg-[#1b4332] text-white' : 'bg-white text-gray-500 border border-gray-100'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {isHoliday || isWeekend ? (
          <div className="bg-white p-12 rounded-[2rem] text-center border border-gray-100 shadow-sm mt-10">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
              <i className="fas fa-couch"></i>
            </div>
            <h2 className="text-lg font-bold text-gray-900">No School Today</h2>
            <p className="text-sm text-gray-400 mt-2 font-medium">{isWeekend ? 'Enjoy the weekend rest.' : 'Today is a public holiday.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submission && (
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                <i className="fas fa-check-circle text-emerald-500"></i>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-tight">Morning attendance submitted</span>
              </div>
            )}

            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {filteredStudents.length} Students Listed
              </h3>
            </div>

            {filteredStudents.map((s: Student) => {
              const status = getStatus(s.id);
              const isLocked = !!submission || (isPastCutoff && status !== 'UNMARKED' && status !== 'ABSENT');

              return (
                <div key={s.id} className={isLocked && !isPastCutoff ? 'opacity-50 pointer-events-none' : ''}>
                  <SwipeableCard
                    student={s}
                    status={status}
                    onMark={(newStatus) => {
                      // Post-cutoff logic: only allow marking Late if student was absent/unmarked
                      if (isPastCutoff) {
                        onUpdateAttendance({ 
                          studentId: s.id, 
                          status: 'LATE', 
                          date: todayStr, 
                          markedBy: user.id,
                          arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          isPostCutoff: true
                        });
                      } else {
                        onUpdateAttendance({ studentId: s.id, status: newStatus, date: todayStr, markedBy: user.id });
                      }
                    }}
                    mode={isPastCutoff ? 'POST_CUTOFF' : 'NORMAL'}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Finalize Button - Sticky Bottom */}
      {!isPastCutoff && !submission && !isHoliday && !isWeekend && (
        <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
           <button 
             onClick={handleFinalize}
             disabled={!isComplete}
             className={`w-full py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all ${
               isComplete 
               ? 'bg-[#1b4332] text-white shadow-xl shadow-green-900/20 active:scale-95' 
               : 'bg-gray-100 text-gray-400 cursor-not-allowed'
             }`}
           >
             Submit Morning Attendance
           </button>
        </div>
      )}

      {/* Post-Cutoff Legend */}
      {isPastCutoff && (
        <div className="p-4 bg-[#1b4332] text-white text-[10px] font-black uppercase tracking-widest text-center">
          <i className="fas fa-clock mr-2"></i> Only Late Arrivals Permitted After {data.settings.cutoffTime}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
