
import { Profile, Student, Classroom, AttendanceRecord, Holiday, Vacation, TeacherClassroom, SchoolSettings } from './types';

export const MOCK_DATA = {
  settings: {
    cutoffTime: "09:30",
    schoolName: "VedicRoots"
  } as SchoolSettings,

  profiles: [
    { id: 'p1', name: 'System Admin', role: 'ADMIN', email: 'admin@vedicroots.edu' },
    { id: 'p2', name: 'Sarah Jenkins', role: 'TEACHER', email: 'teacher@vedicroots.edu' },
    { id: 'p3', name: 'Michael Brown', role: 'TEACHER', email: 'michael@vedicroots.edu' },
  ] as Profile[],
  
  classrooms: [
    { id: 'c1', name: 'Ashoka House', grade: '1st Grade' },
    { id: 'c2', name: 'Banyan House', grade: '2nd Grade' },
    { id: 'c3', name: 'Cedar House', grade: '3rd Grade' },
  ] as Classroom[],

  students: [
    { id: 's1', firstName: 'Aarav', lastName: 'Sharma', classroomId: 'c1' },
    { id: 's2', firstName: 'Ishani', lastName: 'Verma', classroomId: 'c1' },
    { id: 's3', firstName: 'Vihaan', lastName: 'Gupta', classroomId: 'c1' },
    { id: 's4', firstName: 'Ananya', lastName: 'Iyer', classroomId: 'c2' },
    { id: 's5', firstName: 'Reyansh', lastName: 'Malhotra', classroomId: 'c2' },
    { id: 's6', firstName: 'Myra', lastName: 'Singh', classroomId: 'c3' },
  ] as Student[],

  teacherClassrooms: [
    { teacherId: 'p2', classroomId: 'c1' },
    { teacherId: 'p2', classroomId: 'c2' },
    { teacherId: 'p3', classroomId: 'c3' },
  ] as TeacherClassroom[],

  attendance: [] as AttendanceRecord[],
  
  submissions: [] as any[],

  holidays: [
    { id: 'h1', date: '2025-01-01', name: 'New Year' },
    { id: 'h2', date: '2025-08-15', name: 'Independence Day' },
    { id: 'h3', date: '2025-10-02', name: 'Gandhi Jayanti' },
  ] as Holiday[],

  vacations: [
    { id: 'v1', studentId: 's3', startDate: '2024-01-01', endDate: '2025-12-31' },
  ] as Vacation[],
};
