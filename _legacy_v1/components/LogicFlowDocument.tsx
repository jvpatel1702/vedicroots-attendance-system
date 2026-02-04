
import React from 'react';

const LogicFlowDocument: React.FC = () => {
  return (
    <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 max-w-4xl mx-auto text-gray-800 leading-relaxed font-sans animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-8 border-b pb-8">
         <div className="w-16 h-16 bg-[#1b4332] rounded-2xl flex items-center justify-center text-white text-3xl">
           <i className="fas fa-file-invoice"></i>
         </div>
         <div>
           <h1 className="text-3xl font-black tracking-tight text-[#1b4332]">VedicRoots Connect</h1>
           <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Attendance Finalization Workflow (MVP)</p>
         </div>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-black">1</span>
          Purpose & Scope
        </h2>
        <p className="text-gray-600 pl-10">
          The Attendance Finalization workflow ensures that every student is accounted for by the designated school cutoff time (09:30 AM). It bridges the gap between teacher observation and official office records, preventing "ghost" absences through automated submission rules.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
          <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-black">2</span>
          Daily Timeline
        </h2>
        <div className="pl-10 space-y-4">
          <div className="flex gap-4">
            <div className="w-24 shrink-0 font-bold text-emerald-700">07:30 - 09:30</div>
            <div>
              <p className="font-bold">The Morning Window</p>
              <p className="text-sm text-gray-500">Teachers mark students as Present, Absent, or Late. A "Submission" is required once all students are marked.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-24 shrink-0 font-bold text-rose-700">09:30 Sharp</div>
            <div>
              <p className="font-bold">The Hard Cutoff</p>
              <p className="text-sm text-gray-500">Any students still "Unmarked" are automatically flagged as Absent in the system. Morning statuses are locked for teachers.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-24 shrink-0 font-bold text-amber-700">09:30 - EOD</div>
            <div>
              <p className="font-bold">Late Arrival Tracking</p>
              <p className="text-sm text-gray-500">Only "Late Arrival" actions are permitted. Arrival time is auto-captured. Audit logs track these exceptions for Admin review.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-black">3</span>
          Acceptance Criteria
        </h2>
        <ul className="pl-14 list-disc space-y-2 text-gray-600">
          <li><strong>Zero Missing Data:</strong> Submission is disabled until 100% of students are marked.</li>
          <li><strong>Audit Integrity:</strong> Every status change includes a timestamp and the profile ID of the marker.</li>
          <li><strong>Role Sovereignty:</strong> Teachers cannot edit morning marks after the cutoff; only Admins possess override rights.</li>
          <li><strong>Smart Exclusion:</strong> Weekends, holidays, and registered vacations automatically remove students/dates from requirements.</li>
        </ul>
      </section>

      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Stakeholder Note</p>
        <p className="text-sm italic text-gray-500">This workflow satisfies the MVP requirements for automated morning roll-call without over-complicating absence categories.</p>
      </div>
    </div>
  );
};

export default LogicFlowDocument;
