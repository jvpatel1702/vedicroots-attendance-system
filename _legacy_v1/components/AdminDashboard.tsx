
import React, { useState, useMemo } from 'react';
import { Profile, Classroom, Student, AttendanceRecord, Vacation, Holiday, ClassroomSubmission } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SystemWorkflow from './SystemWorkflow';

interface AdminDashboardProps {
  user: Profile;
  data: any;
  onLogout: () => void;
  setData: (data: any) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, data, onLogout, setData }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'STUDENTS' | 'MONITOR' | 'VACATIONS' | 'WORKFLOW'>('OVERVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const todayStr = new Date().toLocaleDateString('en-CA');

  const stats = useMemo(() => {
    const totalStudents = data.students.length;
    const todayAttendance = data.attendance.filter((a: any) => a.date === todayStr);
    const presentCount = todayAttendance.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length;
    
    return {
      totalStudents,
      presentToday: presentCount,
      absenceRate: totalStudents > 0 ? ((totalStudents - presentCount) / totalStudents * 100).toFixed(1) : 0,
      totalClasses: data.classrooms.length,
      submissionsCount: data.submissions.filter((s:any) => s.date === todayStr).length
    };
  }, [data, todayStr]);

  const renderContent = () => {
    switch (activeTab) {
      case 'OVERVIEW':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Enrolled', value: stats.totalStudents, icon: 'fa-user-graduate', color: 'text-[#1b4332]', bg: 'bg-[#d8f3dc]' },
                { label: 'Present Today', value: stats.presentToday, icon: 'fa-check-double', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'House Submissions', value: `${stats.submissionsCount}/${data.classrooms.length}`, icon: 'fa-clipboard-check', color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Absence Rate', value: `${stats.absenceRate}%`, icon: 'fa-chart-pie', color: 'text-rose-600', bg: 'bg-rose-50' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-xl`}>
                      <i className={`fas ${stat.icon}`}></i>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-8">House Performance (Today)</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.classrooms.map((c: Classroom) => ({
                      name: c.name,
                      total: data.students.filter((s: Student) => s.classroomId === c.id).length,
                      present: data.attendance.filter((a: any) => a.date === todayStr && (a.status === 'PRESENT' || a.status === 'LATE') && data.students.find((s: Student) => s.id === a.studentId)?.classroomId === c.id).length,
                    }))}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={40} />
                      <Bar dataKey="present" fill="#2d6a4f" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Arrivals</h3>
                <div className="space-y-4">
                  {data.attendance.slice(-5).reverse().map((a: any, i: number) => {
                    const s = data.students.find((std:Student) => std.id === a.studentId);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${a.isPostCutoff ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-900">{s?.firstName} {s?.lastName}</p>
                          <p className="text-[10px] text-gray-400">{a.status} {a.arrivalTime ? `@ ${a.arrivalTime}` : ''}</p>
                        </div>
                      </div>
                    );
                  })}
                  {data.attendance.length === 0 && <div className="text-center py-20 text-gray-400 text-sm italic">Waiting for check-ins...</div>}
                </div>
              </div>
            </div>
          </div>
        );

      case 'MONITOR':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-8 border-b border-gray-100">
               <h3 className="text-xl font-bold text-gray-900">Morning Submission Tracker</h3>
               <p className="text-sm text-gray-500">Real-time status of House attendance submissions for {todayStr}.</p>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
                      <th className="px-8 py-4">House Name</th>
                      <th className="px-8 py-4">Submission Status</th>
                      <th className="px-8 py-4">Marked/Total</th>
                      <th className="px-8 py-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.classrooms.map((c: Classroom) => {
                      const submission = data.submissions.find((s:any) => s.classroomId === c.id && s.date === todayStr);
                      const classStudents = data.students.filter((s:Student) => s.classroomId === c.id);
                      const marked = data.attendance.filter((a:any) => a.date === todayStr && classStudents.some((s:Student) => s.id === a.studentId)).length;

                      return (
                        <tr key={c.id}>
                          <td className="px-8 py-5 font-bold text-gray-800">{c.name}</td>
                          <td className="px-8 py-5">
                            {submission 
                              ? <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">Submitted</span>
                              : <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-[10px] font-black uppercase">Pending</span>
                            }
                          </td>
                          <td className="px-8 py-5 text-sm font-bold text-gray-500">
                            {marked} / {classStudents.length}
                          </td>
                          <td className="px-8 py-5 text-xs text-gray-400 italic">
                            {submission ? new Date(submission.submittedAt).toLocaleTimeString() : '--:--'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
          </div>
        );

      case 'WORKFLOW':
        return <SystemWorkflow />;

      case 'VACATIONS':
        return (
          <div className="p-10 text-center bg-white rounded-3xl border border-gray-100">
             <i className="fas fa-umbrella-beach text-4xl text-gray-200 mb-4"></i>
             <h3 className="text-xl font-bold text-gray-900">Leave Management</h3>
             <p className="text-gray-500 mt-2">Vacation module is active. Students registered for leave will be auto-hidden from rolls.</p>
          </div>
        );

      default:
        return <div className="p-10 text-center text-gray-400">Section in development...</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fcfdfb]">
      <aside className="w-72 bg-[#1b4332] text-white flex flex-col hidden lg:flex sticky top-0 h-screen">
        <div className="p-10">
          <div className="flex items-center gap-4 mb-12">
            <i className="fas fa-leaf text-[#95d5b2] text-2xl"></i>
            <h1 className="text-xl font-bold tracking-tight">VedicRoots</h1>
          </div>
          <nav className="space-y-2">
            {[
              { id: 'OVERVIEW', label: 'Main View', icon: 'fa-chart-pie' },
              { id: 'MONITOR', label: 'Live Monitoring', icon: 'fa-satellite' },
              { id: 'STUDENTS', label: 'Directory', icon: 'fa-users' },
              { id: 'VACATIONS', label: 'Leave Tracker', icon: 'fa-sun' },
              { id: 'WORKFLOW', label: 'Workflow Manual', icon: 'fa-book' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
                  activeTab === item.id ? 'bg-[#2d6a4f] text-white shadow-xl' : 'text-[#95d5b2] hover:bg-white/5 hover:text-white'
                }`}
              >
                <i className={`fas ${item.icon} text-lg`}></i>
                <span className="font-bold text-sm tracking-wide">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-10">
          <button onClick={onLogout} className="w-full flex items-center gap-4 text-rose-300 font-bold text-sm">
            <i className="fas fa-power-off"></i> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10">
          <h2 className="text-xl font-black text-gray-900 capitalize">{activeTab.replace('_', ' ')}</h2>
        </header>
        <main className="p-10">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
