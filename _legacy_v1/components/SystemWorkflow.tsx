
import React from 'react';

const SystemWorkflow: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header Card */}
      <div className="bg-[#1b4332] text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <i className="fas fa-book-reader text-[#95d5b2] text-2xl"></i>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#95d5b2]">System Documentation</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-4">VedicRoots Connect Workflow</h1>
          <p className="text-[#95d5b2] max-w-2xl font-medium leading-relaxed">
            A comprehensive guide to the attendance lifecycle, from morning drop-off to administrative finalization and reporting.
          </p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Authentication & Roles */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 text-[#1b4332] rounded-2xl flex items-center justify-center text-xl mb-6">
              <i className="fas fa-id-card"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-4">1. Access & Roles</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex gap-3">
                <i className="fas fa-shield-alt text-amber-500 mt-1"></i>
                <div>
                  <p className="font-bold text-gray-800">Administrator</p>
                  <p>Full CRUD access. Manages Houses, Students, Vacations, and monitors real-time submissions.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <i className="fas fa-chalkboard-teacher text-blue-500 mt-1"></i>
                <div>
                  <p className="font-bold text-gray-800">Teacher</p>
                  <p>Mobile-optimized view. Restricted to assigned Houses. Marks daily attendance and submits morning rolls.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-4">Exclusion Logic</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <i className="fas fa-check-circle text-emerald-500 text-xs"></i>
                <span><strong>Weekends:</strong> Fully blocked.</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-check-circle text-emerald-500 text-xs"></i>
                <span><strong>Holidays:</strong> Date-specific blocks.</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-check-circle text-emerald-500 text-xs"></i>
                <span><strong>Vacations:</strong> Hides student automatically.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: The User Journey */}
        <div className="lg:col-span-2 space-y-8">
          {/* Timeline View */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <i className="fas fa-history text-[#1b4332]"></i>
              Daily Attendance Lifecycle
            </h3>

            <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gray-100">
              {/* Step 1 */}
              <div className="relative pl-12">
                <div className="absolute left-0 w-10 h-10 bg-[#1b4332] rounded-xl flex items-center justify-center text-white text-xs font-black ring-4 ring-white">01</div>
                <div>
                  <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-1">Morning: The Roll-Call (07:30 - 09:30)</h4>
                  <p className="text-sm text-gray-600 mb-3">Teachers arrive at their mobile dashboard. Students are presented as interactive cards.</p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-gray-50 border rounded-lg text-[10px] font-bold text-gray-500">SWIPE RIGHT → PRESENT</span>
                    <span className="px-3 py-1 bg-gray-50 border rounded-lg text-[10px] font-bold text-gray-500">SWIPE LEFT → ABSENT</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative pl-12">
                <div className="absolute left-0 w-10 h-10 bg-[#1b4332] rounded-xl flex items-center justify-center text-white text-xs font-black ring-4 ring-white">02</div>
                <div>
                  <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-1">Validation & Submission</h4>
                  <p className="text-sm text-gray-600 mb-4">The "Finalize" button remains locked until every active student is marked. This ensures no data gaps for the Office.</p>
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                    <i className="fas fa-info-circle text-emerald-600"></i>
                    <p className="text-xs text-emerald-700 font-medium">Once submitted, the teacher's morning roll is locked and synced with the Admin Monitor.</p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative pl-12">
                <div className="absolute left-0 w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white text-xs font-black ring-4 ring-white">03</div>
                <div>
                  <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-1 text-amber-600">Cutoff Transition (09:30 AM)</h4>
                  <p className="text-sm text-gray-600 mb-2">The 09:30 cutoff is a hard logical gate. The system behavior shifts:</p>
                  <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4">
                    <li>Unmarked students are treated as <strong>Absent</strong> for reporting.</li>
                    <li>Teachers can now <strong>only</strong> record "Late Arrivals After Cutoff".</li>
                    <li>Arrival times are auto-stamped with the current device time.</li>
                  </ul>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative pl-12">
                <div className="absolute left-0 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-black ring-4 ring-white">04</div>
                <div>
                  <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-1">Office Review & Override</h4>
                  <p className="text-sm text-gray-600">Admins use the <strong>Live Monitor</strong> to see which Houses are lagging in submission. Admins maintain the "Gold Standard" right to override any status if a parent provides late justification.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Note */}
          <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 flex gap-6 items-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0">
               <i className="fas fa-database text-[#1b4332] text-xl"></i>
            </div>
            <div>
              <h5 className="font-black text-gray-900 text-sm mb-1">Data Integrity & Auditing</h5>
              <p className="text-xs text-gray-500 leading-relaxed">
                Every interaction is logged in the <code>attendance_audit_log</code>. This includes the User ID, Old Status, New Status, and Timestamp, ensuring a transparent trail for mid-year attendance audits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemWorkflow;
