'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useOrganization } from '@/context/OrganizationContext';
import {
    ArrowLeft,
    Save,
    User,
    Heart,
    GraduationCap,
    Calendar,
    AlertCircle,
    Plus,
    Trash2,
    Users,
    Clock,
    BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select as ShadcnSelect,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
    start_date: string;
    end_date: string | null;
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
    gender: string | null;
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
    const [gender, setGender] = useState('');

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
    const [newEnrollment, setNewEnrollment] = useState({
        classroom_id: '',
        grade_id: '',
        academic_year_id: '',
        status: 'ACTIVE',
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
    });

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
                gender,
                person:persons (id, first_name, last_name, dob, photo_url),
                medical:student_medical (allergies, medical_conditions, medications, doctor_name, doctor_phone)
            `)
            .eq('id', id)
            .single();

        if (error) console.error('Error fetching student:', error);

        if (studentData) {
            const typedData = studentData as unknown as StudentData;
            setStudent(typedData);
            setGender(typedData.gender ?? '');
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

        // Fetch guardians — names/contact come from persons via person_id FK
        const { data: guardianData } = await supabase
            .from('student_guardians')
            .select(`
                guardian_id,
                relationship,
                is_primary,
                is_pickup_authorized,
                is_emergency_contact,
                guardians (id, person:persons!person_id(first_name, last_name, email, phone))
            `)
            .eq('student_id', id);

        if (guardianData) {
            setGuardians(guardianData.map((g: any) => ({
                id: g.guardians.id,
                first_name: g.guardians.person?.first_name ?? '',
                last_name: g.guardians.person?.last_name ?? '',
                email: g.guardians.person?.email ?? null,
                phone: g.guardians.person?.phone ?? null,
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
                id, status, classroom_id, grade_id, academic_year_id, start_date, end_date,
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
        const { error: personError } = await supabase
            .from('persons')
            .update({ first_name: firstName, last_name: lastName, dob: dob || null })
            .eq('id', student.person.id);
        if (personError) {
            alert('Error saving person: ' + personError.message);
            setSaving(false);
            return;
        }
        const { error: studentError } = await supabase
            .from('students')
            .update({ gender: gender && gender !== '' ? gender : null })
            .eq('id', student.id);
        if (studentError) alert('Error saving gender: ' + studentError.message);
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

        // 1. Create a person record for the guardian (names/contact live in persons)
        const { data: person, error: pError } = await supabase
            .from('persons')
            .insert({
                first_name: newGuardian.first_name,
                last_name: newGuardian.last_name,
                email: newGuardian.email || null,
                phone: newGuardian.phone || null,
            })
            .select()
            .single();
        if (pError || !person) { alert('Error creating person: ' + pError?.message); setSaving(false); return; }

        // 2. Create guardian record linked to the new person
        const { data: guardian, error: gError } = await supabase
            .from('guardians')
            .insert({ person_id: person.id })
            .select()
            .single();
        if (gError || !guardian) { alert('Error creating guardian'); setSaving(false); return; }

        // 3. Link guardian to student
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
                status: newEnrollment.status,
                start_date: newEnrollment.start_date,
                end_date: newEnrollment.end_date || null
            });
        if (error) alert('Error: ' + error.message);
        setNewEnrollment({
            classroom_id: '',
            grade_id: '',
            academic_year_id: '',
            status: 'ACTIVE',
            start_date: new Date().toISOString().split('T')[0],
            end_date: ''
        });
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
                <Button
                    asChild
                    variant="ghost"
                    className="h-auto px-2 py-2 rounded-lg hover:bg-muted"
                >
                    <Link href="/admin/students">
                        <ArrowLeft size={20} className="text-muted-foreground" />
                    </Link>
                </Button>
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

            {/* Main two-column layout: 25% left sidebar | 75% right content */}
            <div className="flex gap-6 items-start">

                {/* LEFT COLUMN (25%) — Personal Info & Medical Info */}
                <div className="w-1/4 shrink-0 space-y-6">

                    {/* Personal Info */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <User size={18} className="text-indigo-600" /> Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label className="mb-1 block text-sm text-gray-700">First Name</Label>
                                    <Input
                                        type="text"
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label className="mb-1 block text-sm text-gray-700">Last Name</Label>
                                    <Input
                                        type="text"
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label className="mb-1 block text-sm text-gray-700">Date of Birth</Label>
                                    <Input
                                        type="date"
                                        value={dob}
                                        onChange={e => setDob(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label className="mb-1 block text-sm text-gray-700">Gender</Label>
                                    <ShadcnSelect
                                        value={gender || ''}
                                        onValueChange={value => setGender(value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </ShadcnSelect>
                                </div>
                                <Button
                                    onClick={handleSavePersonInfo}
                                    disabled={saving}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <Save size={16} /> {saving ? 'Saving...' : 'Save Personal Info'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Medical Info */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <Heart size={18} className="text-red-500" /> Medical Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">Allergies</Label>
                                    <Textarea
                                        value={allergies}
                                        onChange={e => setAllergies(e.target.value)}
                                        placeholder="Known allergies..."
                                        className="h-24"
                                    />
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</Label>
                                    <Textarea
                                        value={medicalConditions}
                                        onChange={e => setMedicalConditions(e.target.value)}
                                        placeholder="Medical conditions..."
                                        className="h-24"
                                    />
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">Medications</Label>
                                    <Textarea
                                        value={medications}
                                        onChange={e => setMedications(e.target.value)}
                                        placeholder="Current medications..."
                                        className="h-24"
                                    />
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</Label>
                                    <Input
                                        type="text"
                                        value={doctorName}
                                        onChange={e => setDoctorName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-1">Doctor Phone</Label>
                                    <Input
                                        type="text"
                                        value={doctorPhone}
                                        onChange={e => setDoctorPhone(e.target.value)}
                                    />
                                </div>
                                {(allergies || medicalConditions) && (
                                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
                                        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                                        <p className="text-sm text-amber-800">
                                            This student has medical information on file. Please ensure all staff are aware.
                                        </p>
                                    </div>
                                )}
                                <Button
                                    onClick={handleSaveMedicalInfo}
                                    disabled={saving}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2"
                                >
                                    <Save size={16} /> {saving ? 'Saving...' : 'Save Medical Info'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                </div>{/* END LEFT COLUMN */}

                {/* RIGHT COLUMN (75%) — Guardians, Enrollments, EC, Electives, Vacations */}
                <div className="flex-1 min-w-0 space-y-6">

                    {/* Guardians */}
                    <Card>
                        <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <Users size={18} className="text-purple-600" /> Guardians / Parents
                            </CardTitle>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => setShowAddGuardian(true)}
                                className="text-purple-600 hover:bg-purple-50"
                            >
                                <Plus size={18} />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {guardians.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No guardians on file.</p>
                            ) : (
                                <div className="space-y-3">
                                    {guardians.map(g => (
                                        <div key={g.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {g.first_name} {g.last_name}{' '}
                                                    <span className="text-xs text-gray-500">({g.relationship})</span>
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {g.phone} {g.email && `• ${g.email}`}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveGuardian(g.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {showAddGuardian && (
                                <div className="mt-4 p-4 bg-purple-50 rounded-lg space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            placeholder="First Name"
                                            value={newGuardian.first_name}
                                            onChange={e => setNewGuardian({ ...newGuardian, first_name: e.target.value })}
                                        />
                                        <Input
                                            placeholder="Last Name"
                                            value={newGuardian.last_name}
                                            onChange={e => setNewGuardian({ ...newGuardian, last_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            placeholder="Phone"
                                            value={newGuardian.phone}
                                            onChange={e => setNewGuardian({ ...newGuardian, phone: e.target.value })}
                                        />
                                        <Input
                                            placeholder="Email"
                                            value={newGuardian.email}
                                            onChange={e => setNewGuardian({ ...newGuardian, email: e.target.value })}
                                        />
                                    </div>
                                    <ShadcnSelect
                                        value={newGuardian.relationship}
                                        onValueChange={value => setNewGuardian({ ...newGuardian, relationship: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Relationship" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Parent">Parent</SelectItem>
                                            <SelectItem value="Mother">Mother</SelectItem>
                                            <SelectItem value="Father">Father</SelectItem>
                                            <SelectItem value="Guardian">Guardian</SelectItem>
                                            <SelectItem value="Grandparent">Grandparent</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </ShadcnSelect>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleAddGuardian}
                                            disabled={saving}
                                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium"
                                        >
                                            Add Guardian
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 text-sm"
                                            onClick={() => setShowAddGuardian(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Enrollments */}
                    <Card>
                        <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <GraduationCap size={18} className="text-green-600" /> Enrollments
                            </CardTitle>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => setShowAddEnrollment(true)}
                                className="text-green-600 hover:bg-green-50"
                            >
                                <Plus size={18} />
                            </Button>
                        </CardHeader>
                        <CardContent>
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
                                                <th className="px-4 py-2 text-left text-gray-600 font-medium">Dates</th>
                                                <th className="px-4 py-2 text-left text-gray-600 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {enrollments.map(e => (
                                                <tr key={e.id}>
                                                    <td className="px-4 py-3 text-gray-900">{e.classrooms?.name || 'Unassigned'}</td>
                                                    <td className="px-4 py-3 text-gray-600">{e.grades?.name || 'N/A'}</td>
                                                    <td className="px-4 py-3 text-gray-600">{e.academic_years?.name || 'N/A'}</td>
                                                    <td className="px-4 py-3 text-gray-600 text-xs">
                                                        <div>Start: {e.start_date}</div>
                                                        {e.end_date && <div>End: {e.end_date}</div>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <ShadcnSelect
                                                            value={e.status}
                                                            onValueChange={value => handleUpdateEnrollmentStatus(e.id, value)}
                                                        >
                                                            <SelectTrigger className="h-7 text-xs px-2 py-1">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="ACTIVE">Active</SelectItem>
                                                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                                                                <SelectItem value="GRADUATED">Graduated</SelectItem>
                                                                <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                                                            </SelectContent>
                                                        </ShadcnSelect>
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
                                        <ShadcnSelect
                                            value={newEnrollment.classroom_id}
                                            onValueChange={value => setNewEnrollment({ ...newEnrollment, classroom_id: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Classroom" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classrooms.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </ShadcnSelect>
                                        <ShadcnSelect
                                            value={newEnrollment.grade_id}
                                            onValueChange={value => setNewEnrollment({ ...newEnrollment, grade_id: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Grade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {grades.map(g => (
                                                    <SelectItem key={g.id} value={g.id}>
                                                        {g.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </ShadcnSelect>
                                        <ShadcnSelect
                                            value={newEnrollment.academic_year_id}
                                            onValueChange={value => setNewEnrollment({ ...newEnrollment, academic_year_id: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {academicYears.map(y => (
                                                    <SelectItem key={y.id} value={y.id}>
                                                        {y.name} {y.is_active ? '(Active)' : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </ShadcnSelect>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="block text-xs font-medium text-gray-600 mb-1">Start Date</Label>
                                            <Input
                                                type="date"
                                                value={newEnrollment.start_date}
                                                onChange={e => setNewEnrollment({ ...newEnrollment, start_date: e.target.value })}
                                                className="text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label className="block text-xs font-medium text-gray-600 mb-1">End Date</Label>
                                            <Input
                                                type="date"
                                                value={newEnrollment.end_date}
                                                onChange={e => setNewEnrollment({ ...newEnrollment, end_date: e.target.value })}
                                                className="text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleAddEnrollment}
                                            disabled={saving}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                                        >
                                            Add Enrollment
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 text-sm"
                                            onClick={() => setShowAddEnrollment(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Extended Care Subscription */}
                    <Card>
                        <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <Clock size={18} className="text-orange-600" /> Extended Care
                            </CardTitle>
                            {!activeEcSubscription && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowStartEC(true)}
                                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                                >
                                    <Plus size={16} /> Start Service
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>

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
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowStopEC(true)}
                                            className="px-4 py-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium"
                                        >
                                            Stop Service
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic mb-4">No active extended care subscription.</p>
                            )}

                            {/* Stop Service Form */}
                            {showStopEC && activeEcSubscription && (
                                <div className="p-4 bg-red-50 rounded-lg space-y-3 mb-4">
                                    <p className="text-sm font-medium text-gray-700">Set end date for this subscription:</p>
                                    <Input
                                        type="date"
                                        value={stopDate}
                                        onChange={e => setStopDate(e.target.value)}
                                        className="text-sm w-full"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleStopEC}
                                            disabled={saving}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                                        >
                                            Confirm Stop
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 text-sm"
                                            onClick={() => setShowStopEC(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Start Service Form */}
                            {showStartEC && (
                                <div className="p-4 bg-orange-50 rounded-lg space-y-4 mb-4">
                                    {/* Start Date */}
                                    <div>
                                        <Label className="block text-xs font-medium text-gray-600 mb-1">Start Date</Label>
                                        <Input
                                            type="date"
                                            value={newEC.start_date}
                                            onChange={e => setNewEC({ ...newEC, start_date: e.target.value })}
                                            className="text-sm w-full max-w-xs"
                                        />
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
                                            <Input
                                                type="time"
                                                value={newEC.drop_off_time}
                                                onChange={e => setNewEC({ ...newEC, drop_off_time: e.target.value })}
                                                min="07:00"
                                                className="text-sm"
                                            />
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
                                            <Input
                                                type="time"
                                                value={newEC.pickup_time}
                                                onChange={e => setNewEC({ ...newEC, pickup_time: e.target.value })}
                                                max="18:00"
                                                className="text-sm"
                                            />
                                        )}
                                    </div>

                                    {/* Days of Week */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-2">Days of Week</label>
                                        <div className="flex gap-2">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                                                <Button
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
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            onClick={handleStartEC}
                                            disabled={saving}
                                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium"
                                        >
                                            Start Extended Care
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 text-sm"
                                            onClick={() => setShowStartEC(false)}
                                        >
                                            Cancel
                                        </Button>
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
                        </CardContent>
                    </Card>

                    {/* Electives */}
                    <Card>
                        <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <BookOpen size={18} className="text-violet-600" /> Elective Classes
                            </CardTitle>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => setShowAddElective(true)}
                                className="text-violet-600 hover:bg-violet-50"
                            >
                                <Plus size={18} />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {electiveEnrollments.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No elective enrollments.</p>
                            ) : (
                                <div className="space-y-2">
                                    {electiveEnrollments.map(ee => (
                                        <div key={ee.id} className={`flex items-center justify-between p-3 rounded-lg ${ee.status === 'ACTIVE' ? 'bg-violet-50' : 'bg-gray-50'}`}>
                                            <div>
                                                <p className="font-medium text-gray-900">{ee.offering?.subject?.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500">
                                                    {ee.offering?.schedule_day} @ {ee.offering?.schedule_start_time} • Started: {ee.start_date}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-1 rounded font-medium ${ee.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                                    {ee.status}
                                                </span>
                                                {ee.status === 'ACTIVE' && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveElective(ee.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {showAddElective && (
                                <div className="mt-4 p-4 bg-violet-50 rounded-lg space-y-3">
                                    <ShadcnSelect
                                        value={newElective.offering_id}
                                        onValueChange={value => setNewElective({ ...newElective, offering_id: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Elective Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {electiveOfferings.map(o => (
                                                <SelectItem key={o.id} value={o.id}>
                                                    {o.subject?.name} - {o.schedule_day} @ {o.schedule_start_time}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </ShadcnSelect>
                                    <Input
                                        type="date"
                                        value={newElective.start_date}
                                        onChange={e => setNewElective({ ...newElective, start_date: e.target.value })}
                                        className="text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleAddElective}
                                            disabled={saving}
                                            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium"
                                        >
                                            Enroll in Elective
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 text-sm"
                                            onClick={() => setShowAddElective(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Vacations */}
                    <Card>
                        <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <Calendar size={18} className="text-blue-600" /> Vacation Log
                            </CardTitle>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => setShowAddVacation(true)}
                                className="text-blue-600 hover:bg-blue-50"
                            >
                                <Plus size={18} />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {vacations.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No vacations scheduled.</p>
                            ) : (
                                <div className="space-y-2">
                                    {vacations.map(v => (
                                        <div key={v.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {v.start_date} to {v.end_date}
                                                </p>
                                                {v.reason && <p className="text-xs text-gray-500">{v.reason}</p>}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveVacation(v.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {showAddVacation && (
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            type="date"
                                            placeholder="Start Date"
                                            value={newVacation.start_date}
                                            onChange={e => setNewVacation({ ...newVacation, start_date: e.target.value })}
                                            className="text-sm"
                                        />
                                        <Input
                                            type="date"
                                            placeholder="End Date"
                                            value={newVacation.end_date}
                                            onChange={e => setNewVacation({ ...newVacation, end_date: e.target.value })}
                                            className="text-sm"
                                        />
                                    </div>
                                    <Input
                                        placeholder="Reason (optional)"
                                        value={newVacation.reason}
                                        onChange={e => setNewVacation({ ...newVacation, reason: e.target.value })}
                                        className="text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleAddVacation}
                                            disabled={saving}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                                        >
                                            Add Vacation
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 text-sm"
                                            onClick={() => setShowAddVacation(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>{/* END RIGHT COLUMN */}

            </div>{/* END two-column flex layout */}
        </div>
    );
}

