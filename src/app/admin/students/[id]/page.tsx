'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useOrganization } from '@/context/OrganizationContext';
import { ArrowLeft, Save, User, Heart, GraduationCap, Calendar, AlertCircle, Plus, Trash2, Users, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface Guardian {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    relationship: string;
    is_primary: boolean;
    is_pickup_authorized: boolean;
    is_emergency_contact: boolean;
}

interface Vacation {
    id: string;
    start_date: string;
    end_date: string;
    reason: string | null;
}

interface Enrollment {
    id: string;
    status: string;
    classroom_id: string | null;
    grade_id: string | null;
    academic_year_id: string | null;
    classrooms: { id: string; name: string } | null;
    grades: { id: string; name: string } | null;
    academic_years: { id: string; name: string } | null;
}

interface ExtendedCareSubscription {
    id: string;
    start_date: string;
    end_date: string | null; // NULL = active
    drop_off_time: string | null;
    pickup_time: string | null;
    days_of_week: string[] | null;
    notes: string | null;
}

interface ElectiveEnrollment {
    id: string;
    status: string;
    start_date: string;
    end_date: string | null;
    offering: {
        id: string;
        schedule_day: string;
        schedule_start_time: string;
        subject: { id: string; name: string };
    };
}

interface ElectiveOffering {
    id: string;
    schedule_day: string;
    schedule_start_time: string;
    subject: { id: string; name: string };
}

interface StudentData {
    id: string;
    student_number: string;
    person: {
        id: string;
        first_name: string;
        last_name: string;
        dob: string | null;
        photo_url: string | null;
    };
    medical: {
        allergies: string;
        medical_conditions: string;
        medications: string;
        doctor_name: string;
        doctor_phone: string;
    } | null;
}

interface Classroom { id: string; name: string; }
interface Grade { id: string; name: string; }
interface AcademicYear { id: string; name: string; is_active: boolean; }

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();

    const [student, setStudent] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Available options
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [electiveOfferings, setElectiveOfferings] = useState<ElectiveOffering[]>([]);

    // Form state - Person Info
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dob, setDob] = useState('');

    // Form state - Medical Info
    const [allergies, setAllergies] = useState('');
    const [medicalConditions, setMedicalConditions] = useState('');
    const [medications, setMedications] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [doctorPhone, setDoctorPhone] = useState('');

    // Guardians
    const [guardians, setGuardians] = useState<Guardian[]>([]);
    const [showAddGuardian, setShowAddGuardian] = useState(false);
    const [newGuardian, setNewGuardian] = useState({ first_name: '', last_name: '', email: '', phone: '', relationship: 'Parent' });

    // Vacations
    const [vacations, setVacations] = useState<Vacation[]>([]);
    const [showAddVacation, setShowAddVacation] = useState(false);
    const [newVacation, setNewVacation] = useState({ start_date: '', end_date: '', reason: '' });

    // Enrollments
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [showAddEnrollment, setShowAddEnrollment] = useState(false);
    const [newEnrollment, setNewEnrollment] = useState({ classroom_id: '', grade_id: '', academic_year_id: '', status: 'ACTIVE' });

    // Extended Care Subscriptions
    const [ecSubscriptions, setEcSubscriptions] = useState<ExtendedCareSubscription[]>([]);
    const [showStartEC, setShowStartEC] = useState(false);
    const [showStopEC, setShowStopEC] = useState(false);
    const [newEC, setNewEC] = useState({
        start_date: new Date().toISOString().split('T')[0],
        before_care: true,
        after_care: true,
        drop_off_time: '07:30',
        pickup_time: '17:00',
        days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    });
    const [stopDate, setStopDate] = useState(new Date().toISOString().split('T')[0]);

    // Electives
    const [electiveEnrollments, setElectiveEnrollments] = useState<ElectiveEnrollment[]>([]);
    const [showAddElective, setShowAddElective] = useState(false);
    const [newElective, setNewElective] = useState({ offering_id: '', start_date: new Date().toISOString().split('T')[0] });

    const fetchStudent = useCallback(async () => {
        if (!selectedOrganization) return;
        setLoading(true);

        // Fetch student with person and medical data
        const { data: studentData, error } = await supabase
            .from('students')
            .select(`
                id,
                student_number,
                person:persons (id, first_name, last_name, dob, photo_url),
                medical:student_medical (allergies, medical_conditions, medications, doctor_name, doctor_phone)
            `)
            .eq('id', id)
            .single();

        if (error) console.error('Error fetching student:', error);

        if (studentData) {
            const typedData = studentData as unknown as StudentData;
            setStudent(typedData);
            const p = typedData.person;
            if (p) {
                setFirstName(p.first_name || '');
                setLastName(p.last_name || '');
                setDob(p.dob || '');
            }
            const m = typedData.medical;
            if (m) {
                setAllergies(m.allergies || '');
                setMedicalConditions(m.medical_conditions || '');
                setMedications(m.medications || '');
                setDoctorName(m.doctor_name || '');
                setDoctorPhone(m.doctor_phone || '');
            }
        }

        // Fetch guardians
        const { data: guardianData } = await supabase
            .from('student_guardians')
            .select(`
                guardian_id,
                relationship,
                is_primary,
                is_pickup_authorized,
                is_emergency_contact,
                guardians (id, first_name, last_name, email, phone)
            `)
            .eq('student_id', id);

        if (guardianData) {
            setGuardians(guardianData.map((g: any) => ({
                id: g.guardians.id,
                first_name: g.guardians.first_name,
                last_name: g.guardians.last_name,
                email: g.guardians.email,
                phone: g.guardians.phone,
                relationship: g.relationship,
                is_primary: g.is_primary,
                is_pickup_authorized: g.is_pickup_authorized,
                is_emergency_contact: g.is_emergency_contact
            })));
        }

        // Fetch vacations
        const { data: vacationData } = await supabase
            .from('student_vacations')
            .select('*')
            .eq('student_id', id)
            .order('start_date', { ascending: false });

        if (vacationData) setVacations(vacationData);

        // Fetch enrollments
        const { data: enrollmentData } = await supabase
            .from('enrollments')
            .select(`
                id, status, classroom_id, grade_id, academic_year_id,
                classrooms (id, name),
                grades (id, name),
                academic_years (id, name)
            `)
            .eq('student_id', id)
            .order('status');

        if (enrollmentData) setEnrollments(enrollmentData as unknown as Enrollment[]);

        // Fetch extended care subscriptions
        const { data: ecData } = await supabase
            .from('extended_care_subscriptions')
            .select('*')
            .eq('student_id', id)
            .order('start_date', { ascending: false });

        if (ecData) setEcSubscriptions(ecData);

        // Fetch elective enrollments
        const { data: electiveData } = await supabase
            .from('elective_enrollments')
            .select(`
                id, status, start_date, end_date,
                offering:elective_offerings (
                    id, schedule_day, schedule_start_time,
                    subject:elective_subjects (id, name)
                )
            `)
            .eq('student_id', id);

        if (electiveData) setElectiveEnrollments(electiveData as unknown as ElectiveEnrollment[]);

        // Fetch classrooms for this org
        const { data: locations } = await supabase
            .from('locations')
            .select('id')
            .eq('organization_id', selectedOrganization.id);

        if (locations && locations.length > 0) {
            const { data: classroomData } = await supabase
                .from('classrooms')
                .select('id, name')
                .in('location_id', locations.map(l => l.id))
                .order('name');
            if (classroomData) setClassrooms(classroomData);
        }

        // Fetch grades for this org
        const { data: gradeData } = await supabase
            .from('grades')
            .select('id, name')
            .eq('organization_id', selectedOrganization.id)
            .order('order');
        if (gradeData) setGrades(gradeData);

        // Fetch academic years
        const { data: yearData } = await supabase
            .from('academic_years')
            .select('id, name, is_active')
            .order('is_active', { ascending: false });
        if (yearData) setAcademicYears(yearData);

        // Fetch available elective offerings
        const { data: offeringData } = await supabase
            .from('elective_offerings')
            .select(`
                id, schedule_day, schedule_start_time,
                subject:elective_subjects (id, name)
            `)
            .order('schedule_day');
        if (offeringData) setElectiveOfferings(offeringData as unknown as ElectiveOffering[]);

        setLoading(false);
    }, [supabase, id, selectedOrganization]);

    useEffect(() => {
        if (selectedOrganization) fetchStudent();
    }, [fetchStudent, selectedOrganization]);

    // Save handlers
    const handleSavePersonInfo = async () => {
        if (!student?.person?.id) return;
        setSaving(true);
        const { error } = await supabase
            .from('persons')
            .update({ first_name: firstName, last_name: lastName, dob: dob || null })
            .eq('id', student.person.id);
        if (error) alert('Error: ' + error.message);
        setSaving(false);
    };

    const handleSaveMedicalInfo = async () => {
        if (!student) return;
        setSaving(true);
        const { error } = await supabase
            .from('student_medical')
            .upsert({
                student_id: student.id,
                allergies, medical_conditions: medicalConditions, medications,
                doctor_name: doctorName, doctor_phone: doctorPhone
            }, { onConflict: 'student_id' });
        if (error) alert('Error: ' + error.message);
        setSaving(false);
    };

    // Guardian handlers
    const handleAddGuardian = async () => {
        if (!student || !newGuardian.first_name || !newGuardian.last_name) return;
        setSaving(true);
        const { data: guardian, error: gError } = await supabase
            .from('guardians')
            .insert({ first_name: newGuardian.first_name, last_name: newGuardian.last_name, email: newGuardian.email || null, phone: newGuardian.phone || null })
            .select()
            .single();
        if (gError || !guardian) { alert('Error creating guardian'); setSaving(false); return; }
        const { error: lError } = await supabase
            .from('student_guardians')
            .insert({ student_id: student.id, guardian_id: guardian.id, relationship: newGuardian.relationship, is_primary: guardians.length === 0 });
        if (lError) alert('Error linking guardian');
        setNewGuardian({ first_name: '', last_name: '', email: '', phone: '', relationship: 'Parent' });
        setShowAddGuardian(false);
        setSaving(false);
        fetchStudent();
    };

    const handleRemoveGuardian = async (guardianId: string) => {
        if (!confirm('Remove this guardian?')) return;
        await supabase.from('student_guardians').delete().eq('student_id', id).eq('guardian_id', guardianId);
        fetchStudent();
    };

    // Vacation handlers
    const handleAddVacation = async () => {
        if (!student || !newVacation.start_date || !newVacation.end_date) return;
        setSaving(true);
        const { error } = await supabase
            .from('student_vacations')
            .insert({ student_id: student.id, start_date: newVacation.start_date, end_date: newVacation.end_date, reason: newVacation.reason || null });
        if (error) alert('Error: ' + error.message);
        setNewVacation({ start_date: '', end_date: '', reason: '' });
        setShowAddVacation(false);
        setSaving(false);
        fetchStudent();
    };

    const handleRemoveVacation = async (vacationId: string) => {
        if (!confirm('Remove this vacation?')) return;
        await supabase.from('student_vacations').delete().eq('id', vacationId);
        fetchStudent();
    };

    // Enrollment handlers
    const handleAddEnrollment = async () => {
        if (!student || !newEnrollment.classroom_id || !newEnrollment.academic_year_id) return;
        setSaving(true);
        const { error } = await supabase
            .from('enrollments')
            .insert({
                student_id: student.id,
                classroom_id: newEnrollment.classroom_id,
                grade_id: newEnrollment.grade_id || null,
                academic_year_id: newEnrollment.academic_year_id,
                status: newEnrollment.status
            });
        if (error) alert('Error: ' + error.message);
        setNewEnrollment({ classroom_id: '', grade_id: '', academic_year_id: '', status: 'ACTIVE' });
        setShowAddEnrollment(false);
        setSaving(false);
        fetchStudent();
    };

    const handleUpdateEnrollmentStatus = async (enrollmentId: string, newStatus: string) => {
        await supabase.from('enrollments').update({ status: newStatus }).eq('id', enrollmentId);
        fetchStudent();
    };

    // Extended Care Subscription handlers
    const activeEcSubscription = ecSubscriptions.find(s => !s.end_date);

    const handleStartEC = async () => {
        if (!student || !newEC.start_date) return;
        if (!newEC.before_care && !newEC.after_care) {
            alert('Please select at least Before Care or After Care.');
            return;
        }
        if (activeEcSubscription) {
            alert('Student already has an active extended care subscription. Please stop it first.');
            return;
        }
        setSaving(true);
        const { error } = await supabase
            .from('extended_care_subscriptions')
            .insert({
                student_id: student.id,
                start_date: newEC.start_date,
                drop_off_time: newEC.before_care ? newEC.drop_off_time : null,
                pickup_time: newEC.after_care ? newEC.pickup_time : null,
                days_of_week: newEC.days_of_week
            });
        if (error) alert('Error: ' + error.message);
        setNewEC({
            start_date: new Date().toISOString().split('T')[0],
            before_care: true,
            after_care: true,
            drop_off_time: '07:30',
            pickup_time: '17:00',
            days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        });
        setShowStartEC(false);
        setSaving(false);
        fetchStudent();
    };

    const handleStopEC = async () => {
        if (!activeEcSubscription) return;
        setSaving(true);
        const { error } = await supabase
            .from('extended_care_subscriptions')
            .update({ end_date: stopDate })
            .eq('id', activeEcSubscription.id);
        if (error) alert('Error: ' + error.message);
        setShowStopEC(false);
        setSaving(false);
        fetchStudent();
    };

    // Elective handlers
    const handleAddElective = async () => {
        if (!student || !newElective.offering_id) return;
        setSaving(true);
        const { error } = await supabase
            .from('elective_enrollments')
            .insert({
                student_id: student.id,
                offering_id: newElective.offering_id,
                start_date: newElective.start_date,
                status: 'ACTIVE'
            });
        if (error) alert('Error: ' + error.message);
        setNewElective({ offering_id: '', start_date: new Date().toISOString().split('T')[0] });
        setShowAddElective(false);
        setSaving(false);
        fetchStudent();
    };

    const handleRemoveElective = async (enrollmentId: string) => {
        if (!confirm('Remove this elective enrollment?')) return;
        await supabase.from('elective_enrollments').update({ status: 'DROPPED', end_date: new Date().toISOString().split('T')[0] }).eq('id', enrollmentId);
        fetchStudent();
    };

    if (!selectedOrganization) return <div className="p-6 text-gray-500">Please select an organization.</div>;
    if (loading) return <div className="p-6 text-gray-500">Loading student details...</div>;
    if (!student) return <div className="p-6 text-red-500">Student not found.</div>;

    const formatMonth = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/students" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft size={20} className="text-gray-600" />
                </Link>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl border-2 border-indigo-200">
                        {firstName[0] || '?'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{firstName} {lastName}</h1>
                        <p className="text-sm text-gray-500">Student ID: {student.student_number}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Person Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <User size={18} className="text-indigo-600" /> Personal Information
                    </h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                            <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <button onClick={handleSavePersonInfo} disabled={saving}
                            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
                            <Save size={16} /> {saving ? 'Saving...' : 'Save Personal Info'}
                        </button>
                    </div>
                </div>

                {/* Guardians */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <Users size={18} className="text-purple-600" /> Guardians / Parents
                        </h2>
                        <button onClick={() => setShowAddGuardian(true)} className="text-purple-600 hover:bg-purple-50 p-1 rounded">
                            <Plus size={18} />
                        </button>
                    </div>
                    {guardians.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No guardians on file.</p>
                    ) : (
                        <div className="space-y-3">
                            {guardians.map(g => (
                                <div key={g.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">{g.first_name} {g.last_name} <span className="text-xs text-gray-500">({g.relationship})</span></p>
                                        <p className="text-xs text-gray-500">{g.phone} {g.email && `• ${g.email}`}</p>
                                    </div>
                                    <button onClick={() => handleRemoveGuardian(g.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                    {showAddGuardian && (
                        <div className="mt-4 p-4 bg-purple-50 rounded-lg space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <input placeholder="First Name" value={newGuardian.first_name} onChange={e => setNewGuardian({ ...newGuardian, first_name: e.target.value })}
                                    className="border border-gray-300 rounded p-2 text-sm" />
                                <input placeholder="Last Name" value={newGuardian.last_name} onChange={e => setNewGuardian({ ...newGuardian, last_name: e.target.value })}
                                    className="border border-gray-300 rounded p-2 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input placeholder="Phone" value={newGuardian.phone} onChange={e => setNewGuardian({ ...newGuardian, phone: e.target.value })}
                                    className="border border-gray-300 rounded p-2 text-sm" />
                                <input placeholder="Email" value={newGuardian.email} onChange={e => setNewGuardian({ ...newGuardian, email: e.target.value })}
                                    className="border border-gray-300 rounded p-2 text-sm" />
                            </div>
                            <select value={newGuardian.relationship} onChange={e => setNewGuardian({ ...newGuardian, relationship: e.target.value })}
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-white">
                                <option>Parent</option><option>Mother</option><option>Father</option><option>Guardian</option><option>Grandparent</option><option>Other</option>
                            </select>
                            <div className="flex gap-2">
                                <button onClick={handleAddGuardian} disabled={saving} className="flex-1 bg-purple-600 text-white py-2 rounded text-sm font-medium">Add Guardian</button>
                                <button onClick={() => setShowAddGuardian(false)} className="flex-1 border border-gray-300 py-2 rounded text-sm">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Enrollments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <GraduationCap size={18} className="text-green-600" /> Enrollments
                    </h2>
                    <button onClick={() => setShowAddEnrollment(true)} className="text-green-600 hover:bg-green-50 p-1 rounded">
                        <Plus size={18} />
                    </button>
                </div>
                {enrollments.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No enrollments found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Classroom</th>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Grade</th>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Year</th>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {enrollments.map(e => (
                                    <tr key={e.id}>
                                        <td className="px-4 py-3 text-gray-900">{e.classrooms?.name || 'Unassigned'}</td>
                                        <td className="px-4 py-3 text-gray-600">{e.grades?.name || 'N/A'}</td>
                                        <td className="px-4 py-3 text-gray-600">{e.academic_years?.name || 'N/A'}</td>
                                        <td className="px-4 py-3">
                                            <select value={e.status} onChange={ev => handleUpdateEnrollmentStatus(e.id, ev.target.value)}
                                                className={`text-xs px-2 py-1 rounded font-medium border-0 ${e.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                <option value="ACTIVE">Active</option>
                                                <option value="INACTIVE">Inactive</option>
                                                <option value="GRADUATED">Graduated</option>
                                                <option value="WITHDRAWN">Withdrawn</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {showAddEnrollment && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            <select value={newEnrollment.classroom_id} onChange={e => setNewEnrollment({ ...newEnrollment, classroom_id: e.target.value })}
                                className="border border-gray-300 rounded p-2 text-sm bg-white">
                                <option value="">Select Classroom</option>
                                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select value={newEnrollment.grade_id} onChange={e => setNewEnrollment({ ...newEnrollment, grade_id: e.target.value })}
                                className="border border-gray-300 rounded p-2 text-sm bg-white">
                                <option value="">Select Grade</option>
                                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <select value={newEnrollment.academic_year_id} onChange={e => setNewEnrollment({ ...newEnrollment, academic_year_id: e.target.value })}
                                className="border border-gray-300 rounded p-2 text-sm bg-white">
                                <option value="">Select Year</option>
                                {academicYears.map(y => <option key={y.id} value={y.id}>{y.name} {y.is_active ? '(Active)' : ''}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleAddEnrollment} disabled={saving} className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-medium">Add Enrollment</button>
                            <button onClick={() => setShowAddEnrollment(false)} className="flex-1 border border-gray-300 py-2 rounded text-sm">Cancel</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Extended Care Subscription */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <Clock size={18} className="text-orange-600" /> Extended Care
                    </h2>
                    {!activeEcSubscription && (
                        <button onClick={() => setShowStartEC(true)} className="text-orange-600 hover:bg-orange-50 px-3 py-1 rounded text-sm font-medium flex items-center gap-1">
                            <Plus size={16} /> Start Service
                        </button>
                    )}
                </div>

                {/* Active Subscription */}
                {activeEcSubscription ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                        ✓ ACTIVE
                                    </span>
                                    <span className="text-sm text-gray-600">since {activeEcSubscription.start_date}</span>
                                </div>
                                <p className="text-sm text-gray-700">
                                    Drop-off: <strong>{activeEcSubscription.drop_off_time || 'N/A'}</strong> |
                                    Pick-up: <strong>{activeEcSubscription.pickup_time || 'N/A'}</strong>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Days: {activeEcSubscription.days_of_week?.join(', ') || 'Weekdays'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowStopEC(true)}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                            >
                                Stop Service
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic mb-4">No active extended care subscription.</p>
                )}

                {/* Stop Service Form */}
                {showStopEC && activeEcSubscription && (
                    <div className="p-4 bg-red-50 rounded-lg space-y-3 mb-4">
                        <p className="text-sm font-medium text-gray-700">Set end date for this subscription:</p>
                        <input type="date" value={stopDate} onChange={e => setStopDate(e.target.value)}
                            className="border border-gray-300 rounded p-2 text-sm w-full" />
                        <div className="flex gap-2">
                            <button onClick={handleStopEC} disabled={saving} className="flex-1 bg-red-600 text-white py-2 rounded text-sm font-medium">
                                Confirm Stop
                            </button>
                            <button onClick={() => setShowStopEC(false)} className="flex-1 border border-gray-300 py-2 rounded text-sm">Cancel</button>
                        </div>
                    </div>
                )}

                {/* Start Service Form */}
                {showStartEC && (
                    <div className="p-4 bg-orange-50 rounded-lg space-y-4 mb-4">
                        {/* Start Date */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                            <input type="date" value={newEC.start_date} onChange={e => setNewEC({ ...newEC, start_date: e.target.value })}
                                className="border border-gray-300 rounded p-2 text-sm w-full max-w-xs" />
                        </div>

                        {/* Before Care Toggle */}
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setNewEC({ ...newEC, before_care: !newEC.before_care })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${newEC.before_care ? 'bg-orange-600' : 'bg-gray-300'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newEC.before_care ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                            <span className="text-sm font-medium text-gray-700">Before Care (Drop-off after 7:00 AM)</span>
                            {newEC.before_care && (
                                <input type="time" value={newEC.drop_off_time} onChange={e => setNewEC({ ...newEC, drop_off_time: e.target.value })}
                                    min="07:00" className="border border-gray-300 rounded p-2 text-sm" />
                            )}
                        </div>

                        {/* After Care Toggle */}
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setNewEC({ ...newEC, after_care: !newEC.after_care })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${newEC.after_care ? 'bg-orange-600' : 'bg-gray-300'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newEC.after_care ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                            <span className="text-sm font-medium text-gray-700">After Care (Pick-up before 6:00 PM)</span>
                            {newEC.after_care && (
                                <input type="time" value={newEC.pickup_time} onChange={e => setNewEC({ ...newEC, pickup_time: e.target.value })}
                                    max="18:00" className="border border-gray-300 rounded p-2 text-sm" />
                            )}
                        </div>

                        {/* Days of Week */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">Days of Week</label>
                            <div className="flex gap-2">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => {
                                            const days = newEC.days_of_week.includes(day)
                                                ? newEC.days_of_week.filter(d => d !== day)
                                                : [...newEC.days_of_week, day];
                                            setNewEC({ ...newEC, days_of_week: days });
                                        }}
                                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${newEC.days_of_week.includes(day)
                                            ? 'bg-orange-600 text-white'
                                            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            <button onClick={handleStartEC} disabled={saving} className="flex-1 bg-orange-600 text-white py-2 rounded text-sm font-medium">
                                Start Extended Care
                            </button>
                            <button onClick={() => setShowStartEC(false)} className="flex-1 border border-gray-300 py-2 rounded text-sm">Cancel</button>
                        </div>
                    </div>
                )}

                {/* Subscription History */}
                {ecSubscriptions.filter(s => s.end_date).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Past Subscriptions</h3>
                        <div className="space-y-2">
                            {ecSubscriptions.filter(s => s.end_date).map(sub => (
                                <div key={sub.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                    <span className="text-gray-700">{sub.start_date} → {sub.end_date}</span>
                                    <span className="text-gray-500 text-xs">{sub.days_of_week?.join(', ')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Electives */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen size={18} className="text-violet-600" /> Elective Classes
                    </h2>
                    <button onClick={() => setShowAddElective(true)} className="text-violet-600 hover:bg-violet-50 p-1 rounded">
                        <Plus size={18} />
                    </button>
                </div>
                {electiveEnrollments.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No elective enrollments.</p>
                ) : (
                    <div className="space-y-2">
                        {electiveEnrollments.map(ee => (
                            <div key={ee.id} className={`flex items-center justify-between p-3 rounded-lg ${ee.status === 'ACTIVE' ? 'bg-violet-50' : 'bg-gray-50'}`}>
                                <div>
                                    <p className="font-medium text-gray-900">{ee.offering?.subject?.name || 'Unknown'}</p>
                                    <p className="text-xs text-gray-500">{ee.offering?.schedule_day} @ {ee.offering?.schedule_start_time} • Started: {ee.start_date}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded font-medium ${ee.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                        {ee.status}
                                    </span>
                                    {ee.status === 'ACTIVE' && (
                                        <button onClick={() => handleRemoveElective(ee.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {showAddElective && (
                    <div className="mt-4 p-4 bg-violet-50 rounded-lg space-y-3">
                        <select value={newElective.offering_id} onChange={e => setNewElective({ ...newElective, offering_id: e.target.value })}
                            className="w-full border border-gray-300 rounded p-2 text-sm bg-white">
                            <option value="">Select Elective Class</option>
                            {electiveOfferings.map(o => (
                                <option key={o.id} value={o.id}>{o.subject?.name} - {o.schedule_day} @ {o.schedule_start_time}</option>
                            ))}
                        </select>
                        <input type="date" value={newElective.start_date} onChange={e => setNewElective({ ...newElective, start_date: e.target.value })}
                            className="w-full border border-gray-300 rounded p-2 text-sm" />
                        <div className="flex gap-2">
                            <button onClick={handleAddElective} disabled={saving} className="flex-1 bg-violet-600 text-white py-2 rounded text-sm font-medium">Enroll in Elective</button>
                            <button onClick={() => setShowAddElective(false)} className="flex-1 border border-gray-300 py-2 rounded text-sm">Cancel</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Vacations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <Calendar size={18} className="text-blue-600" /> Vacation Log
                    </h2>
                    <button onClick={() => setShowAddVacation(true)} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                        <Plus size={18} />
                    </button>
                </div>
                {vacations.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No vacations scheduled.</p>
                ) : (
                    <div className="space-y-2">
                        {vacations.map(v => (
                            <div key={v.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">{v.start_date} to {v.end_date}</p>
                                    {v.reason && <p className="text-xs text-gray-500">{v.reason}</p>}
                                </div>
                                <button onClick={() => handleRemoveVacation(v.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                )}
                {showAddVacation && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <input type="date" placeholder="Start Date" value={newVacation.start_date} onChange={e => setNewVacation({ ...newVacation, start_date: e.target.value })}
                                className="border border-gray-300 rounded p-2 text-sm" />
                            <input type="date" placeholder="End Date" value={newVacation.end_date} onChange={e => setNewVacation({ ...newVacation, end_date: e.target.value })}
                                className="border border-gray-300 rounded p-2 text-sm" />
                        </div>
                        <input placeholder="Reason (optional)" value={newVacation.reason} onChange={e => setNewVacation({ ...newVacation, reason: e.target.value })}
                            className="w-full border border-gray-300 rounded p-2 text-sm" />
                        <div className="flex gap-2">
                            <button onClick={handleAddVacation} disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded text-sm font-medium">Add Vacation</button>
                            <button onClick={() => setShowAddVacation(false)} className="flex-1 border border-gray-300 py-2 rounded text-sm">Cancel</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Medical Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Heart size={18} className="text-red-500" /> Medical Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                        <textarea value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="Known allergies..."
                            className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-red-300 outline-none h-24" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
                        <textarea value={medicalConditions} onChange={e => setMedicalConditions(e.target.value)} placeholder="Medical conditions..."
                            className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-red-300 outline-none h-24" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medications</label>
                        <textarea value={medications} onChange={e => setMedications(e.target.value)} placeholder="Current medications..."
                            className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-red-300 outline-none h-24" />
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
                            <input type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-red-300 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Phone</label>
                            <input type="text" value={doctorPhone} onChange={e => setDoctorPhone(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-red-300 outline-none" />
                        </div>
                    </div>
                </div>
                {(allergies || medicalConditions) && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
                        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                        <p className="text-sm text-amber-800">This student has medical information on file. Please ensure all staff are aware.</p>
                    </div>
                )}
                <button onClick={handleSaveMedicalInfo} disabled={saving}
                    className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors">
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Medical Info'}
                </button>
            </div>
        </div>
    );
}
