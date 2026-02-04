
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Profile, Student, Classroom, AttendanceRecord, AttendanceStatus, Holiday, Vacation } from './types';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import { MOCK_DATA } from './mockData';

const App: React.FC = () => {
  const [user, setUser] = useState<Profile | null>(null);
  const [data, setData] = useState(MOCK_DATA);
  const [isLoading, setIsLoading] = useState(true);

  // Persistence Simulation
  useEffect(() => {
    const savedUser = localStorage.getItem('edutrack_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (profile: Profile) => {
    setUser(profile);
    localStorage.setItem('edutrack_user', JSON.stringify(profile));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('edutrack_user');
  };

  // State update helpers for child components
  const updateAttendance = (record: Omit<AttendanceRecord, 'id' | 'timestamp'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };

    setData(prev => {
      // Remove existing record for same student/date if it exists (one per day)
      const filtered = prev.attendance.filter(a => !(a.studentId === record.studentId && a.date === record.date));
      return {
        ...prev,
        attendance: [...filtered, newRecord]
      };
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen">
      {user.role === 'TEACHER' ? (
        <TeacherDashboard 
          user={user} 
          data={data} 
          onLogout={handleLogout} 
          onUpdateAttendance={updateAttendance} 
        />
      ) : (
        <AdminDashboard 
          user={user} 
          data={data} 
          onLogout={handleLogout}
          setData={setData}
        />
      )}
    </div>
  );
};

export default App;
