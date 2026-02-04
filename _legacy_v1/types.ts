
export type UserRole = 'ADMIN' | 'TEACHER';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface Classroom {
  id: string;
  name: string;
  grade: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  classroomId: string;
  profilePicture?: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'UNMARKED';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  markedBy: string;
  timestamp: string;
  arrivalTime?: string; // For post-cutoff late arrivals
  isPostCutoff?: boolean;
}

export interface ClassroomSubmission {
  id: string;
  classroomId: string;
  date: string;
  submittedAt: string;
  submittedBy: string;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

export interface Vacation {
  id: string;
  studentId: string;
  startDate: string;
  endDate: string;
}

export interface TeacherClassroom {
  teacherId: string;
  classroomId: string;
}

export interface SchoolSettings {
  cutoffTime: string; // e.g. "09:30"
  schoolName: string;
}
