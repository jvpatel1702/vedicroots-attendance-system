import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { X, Save, ArrowRight, ArrowLeft, Trash2, Plus } from 'lucide-react';
import { Steps } from '@/components/ui/steps';
import { cn } from '@/lib/utils';

interface Props {
    student?: any; // Using any temporarily for flexible refactor then will tighten types
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Classroom { id: string; name: string; }
interface Grade { id: string; name: string; }
interface Program { id: string; name: string; }

// Temporary interfaces for the form state
interface Guardian {
    id?: string;
    firstName: string;
    lastName: string;
    relationship: string;
    isEmergency: boolean;
    isPickup: boolean;
}

export default function StudentForm({ student, isOpen, onClose, onSuccess }: Props) {
    const supabase = createClient();
    const [currentStep, setCurrentStep] = useState(1);
    const steps = ['Person Info', 'Student Details', 'Guardians', 'Enrollment'];

    // Metadata State
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);

    // Form Data State
    const [formData, setFormData] = useState({
        // Step 1: Person
        firstName: '',
        lastName: '',
        dob: '',
        photoUrl: '', // Placeholder

        // Step 2: Student Details
        studentNumber: '', // Will auto-gen if empty on submit
        allergies: '',
        medicalConditions: '',
        medications: '',
        doctorName: '',
        doctorPhone: '',

        // Step 3: Guardians
        guardians: [] as Guardian[],

        // Step 4: Enrollment
        organizationId: 'aa000000-0000-0000-0000-000000000001', // Default School
        locationId: 'bb000000-0000-0000-0000-000000000001', // Default Main Campus
        programId: '',
        gradeId: '',
        classroomId: '',
        enrollmentDate: new Date().toISOString().split('T')[0]
    });

    // Helper to update form data
    const updateData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Guardian Input State
    const [newGuardian, setNewGuardian] = useState<Guardian>({
        firstName: '',
        lastName: '',
        relationship: 'Parent',
        isEmergency: true,
        isPickup: true
    });
    const [isAddingGuardian, setIsAddingGuardian] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Fetch metadata
            const fetchMeta = async () => {
                const { data: cls } = await supabase.from('classrooms').select('*').order('name');
                const { data: grds } = await supabase.from('grades').select('*').order('order');
                // Mock programs fetch if table doesn't exist or just hardcode for UI check

                if (cls) setClassrooms(cls);
                if (grds) setGrades(grds);
            };
            fetchMeta();

            // Reset or Prefill
            setCurrentStep(1);
            if (student) {
                // ... logic to prefill from existing student would go here
                // maintaining simplified logic for this iteration to focus on "Add New" flow UI
                updateData('firstName', student.first_name);
                updateData('lastName', student.last_name);
                // ... map other fields
            } else {
                setFormData({
                    firstName: '',
                    lastName: '',
                    dob: '',
                    photoUrl: '',
                    studentNumber: `S${Math.floor(Math.random() * 10000)}`, // Mock Auto-gen
                    allergies: '',
                    medicalConditions: '',
                    medications: '',
                    doctorName: '',
                    doctorPhone: '',
                    guardians: [],
                    organizationId: 'aa000000-0000-0000-0000-000000000001',
                    locationId: 'bb000000-0000-0000-0000-000000000001',
                    programId: '',
                    gradeId: '',
                    classroomId: '',
                    enrollmentDate: new Date().toISOString().split('T')[0]
                });
            }
        }
    }, [isOpen, student]);


    const handleNext = () => {
        if (currentStep < 4) setCurrentStep(curr => curr + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(curr => curr - 1);
    };

    const handleAddGuardian = () => {
        if (!newGuardian.firstName || !newGuardian.lastName) return;
        setFormData(prev => ({
            ...prev,
            guardians: [...prev.guardians, { ...newGuardian, id: `temp_${Date.now()}` }]
        }));
        setNewGuardian({ firstName: '', lastName: '', relationship: 'Parent', isEmergency: true, isPickup: true });
        setIsAddingGuardian(false);
    };

    const handleRemoveGuardian = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            guardians: prev.guardians.filter((_, i) => i !== idx)
        }));
    };

    const handleSubmit = async () => {
        console.log("Submitting Packet:", formData);
        // Here we would call the future backend API
        // For now, we mock success to validate UI flow
        alert("Student Enrollment Packet Captured! check console for object.");
        onSuccess();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{student ? 'Edit Enrollment' : 'New Enrollment'}</h3>
                        <p className="text-sm text-gray-400">Step {currentStep} of 4</p>
                    </div>

                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 shrink-0">
                    <Steps steps={steps} currentStep={currentStep} />
                </div>

                {/* Content Area - Scrollable */}
                <div className="flex-1 overflow-y-auto p-8">

                    {/* STEP 1: PERSON INFO */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h4 className="text-lg font-semibold text-gray-800 border-l-4 border-brand-olive pl-3">Person Information</h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                                    <input type="text" value={formData.firstName} onChange={e => updateData('firstName', e.target.value)} className="input-std w-full border p-2 rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                                    <input type="text" value={formData.lastName} onChange={e => updateData('lastName', e.target.value)} className="input-std w-full border p-2 rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                    <input type="date" value={formData.dob} onChange={e => updateData('dob', e.target.value)} className="input-std w-full border p-2 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Photo Upload</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-400 text-sm">
                                        Drag & drop photo here or click to upload
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: STUDENT DETAILS */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h4 className="text-lg font-semibold text-gray-800 border-l-4 border-brand-olive pl-3">Student Details</h4>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student Number (Auto-assigned)</label>
                                <input type="text" value={formData.studentNumber} disabled className="bg-gray-100 text-gray-500 w-full border p-2 rounded-lg cursor-not-allowed" />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                                    <textarea
                                        value={formData.allergies}
                                        onChange={e => updateData('allergies', e.target.value)}
                                        className="w-full border p-2 rounded-lg h-24"
                                        placeholder="List known allergies..."
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
                                    <textarea
                                        value={formData.medicalConditions}
                                        onChange={e => updateData('medicalConditions', e.target.value)}
                                        className="w-full border p-2 rounded-lg h-24"
                                        placeholder="List medical conditions..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
                                    <input type="text" value={formData.doctorName} onChange={e => updateData('doctorName', e.target.value)} className="w-full border p-2 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Phone</label>
                                    <input type="text" value={formData.doctorPhone} onChange={e => updateData('doctorPhone', e.target.value)} className="w-full border p-2 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: GUARDIANS */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center">
                                <h4 className="text-lg font-semibold text-gray-800 border-l-4 border-brand-olive pl-3">Guardians</h4>
                                <button
                                    onClick={() => setIsAddingGuardian(true)}
                                    className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-indigo-100"
                                >
                                    <Plus size={14} /> Add Guardian
                                </button>
                            </div>

                            {isAddingGuardian && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                                    <h5 className="text-sm font-bold text-gray-700">New Guardian Details</h5>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            placeholder="First Name"
                                            value={newGuardian.firstName}
                                            onChange={e => setNewGuardian(p => ({ ...p, firstName: e.target.value }))}
                                            className="border p-2 rounded text-sm"
                                        />
                                        <input
                                            placeholder="Last Name"
                                            value={newGuardian.lastName}
                                            onChange={e => setNewGuardian(p => ({ ...p, lastName: e.target.value }))}
                                            className="border p-2 rounded text-sm"
                                        />
                                        <select
                                            value={newGuardian.relationship}
                                            onChange={e => setNewGuardian(p => ({ ...p, relationship: e.target.value }))}
                                            className="border p-2 rounded text-sm"
                                        >
                                            <option>Parent</option>
                                            <option>Mother</option>
                                            <option>Father</option>
                                            <option>Grandparent</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 text-sm text-gray-600">
                                            <input type="checkbox" checked={newGuardian.isEmergency} onChange={e => setNewGuardian(p => ({ ...p, isEmergency: e.target.checked }))} />
                                            Emergency Contact
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-gray-600">
                                            <input type="checkbox" checked={newGuardian.isPickup} onChange={e => setNewGuardian(p => ({ ...p, isPickup: e.target.checked }))} />
                                            Pickup Auth
                                        </label>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setIsAddingGuardian(false)} className="text-gray-500 text-xs hover:underline">Cancel</button>
                                        <button onClick={handleAddGuardian} className="bg-brand-olive text-white text-xs px-3 py-1 rounded">Add</button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {formData.guardians.length === 0 ? (
                                    <p className="text-center text-gray-400 italic py-4">No guardians added yet.</p>
                                ) : (
                                    formData.guardians.map((g, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                                            <div>
                                                <p className="font-bold text-gray-800">{g.firstName} {g.lastName}</p>
                                                <p className="text-xs text-gray-500">{g.relationship} • {g.isEmergency ? 'Emergency Contact' : ''}</p>
                                            </div>
                                            <button onClick={() => handleRemoveGuardian(idx)} className="text-red-400 hover:text-red-600 p-2">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 4: ENROLLMENT */}
                    {currentStep === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h4 className="text-lg font-semibold text-gray-800 border-l-4 border-brand-olive pl-3">Enrollment & Financials</h4>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
                                    <input type="date" value={formData.enrollmentDate} onChange={e => updateData('enrollmentDate', e.target.value)} className="w-full border p-2 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Classroom</label>
                                    <select
                                        value={formData.classroomId}
                                        onChange={e => updateData('classroomId', e.target.value)}
                                        className="w-full border p-2 rounded-lg bg-white"
                                    >
                                        <option value="">Select Classroom...</option>
                                        {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                                    <select
                                        value={formData.gradeId}
                                        onChange={e => updateData('gradeId', e.target.value)}
                                        className="w-full border p-2 rounded-lg bg-white"
                                    >
                                        <option value="">Select Grade...</option>
                                        {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start">
                                <span className="text-xl">💡</span>
                                <div className="text-sm text-blue-800">
                                    <p className="font-bold">Financial Packet Preview</p>
                                    <p>Based on the selection, the monthly tuition will be calculated automatically. Invoice generation will happen after enrollment.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between shrink-0">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className={cn("px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors",
                            currentStep === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-200"
                        )}
                    >
                        <ArrowLeft size={18} /> Back
                    </button>

                    {currentStep < 4 ? (
                        <button
                            onClick={handleNext}
                            className="bg-brand-olive text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-opacity-90 shadow-sm"
                        >
                            Next <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
                        >
                            <Save size={18} /> Finish Enrollment
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
