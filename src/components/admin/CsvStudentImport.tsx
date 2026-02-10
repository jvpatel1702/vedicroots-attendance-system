'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Upload, FileSpreadsheet, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import { useOrganization } from '@/context/OrganizationContext';

interface CsvRow {
    first_name: string;
    last_name: string;
    dob: string;
    grade: string;
    classroom?: string;
    student_number?: string;
}

interface ParsedStudent extends CsvRow {
    isValid: boolean;
    errors: string[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CsvStudentImport({ isOpen, onClose, onSuccess }: Props) {
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
    const [grades, setGrades] = useState<{ id: string; name: string }[]>([]);
    const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>([]);
    const [academicYear, setAcademicYear] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const fetchLookupData = async () => {
        if (!selectedOrganization) return;

        // Fetch grades directly by organization_id
        const { data: gradeData } = await supabase
            .from('grades')
            .select('id, name')
            .eq('organization_id', selectedOrganization.id)
            .order('order');
        if (gradeData) setGrades(gradeData);

        // Fetch classrooms via locations linked to org
        const { data: locationData } = await supabase
            .from('locations')
            .select('id')
            .eq('organization_id', selectedOrganization.id);

        if (locationData) {
            const locationIds = locationData.map(l => l.id);
            const { data: classroomData } = await supabase
                .from('classrooms')
                .select('id, name')
                .in('location_id', locationIds);
            if (classroomData) setClassrooms(classroomData);
        }

        // Get active academic year
        const { data: yearData } = await supabase
            .from('academic_years')
            .select('id')
            .eq('is_active', true)
            .single();
        if (yearData) setAcademicYear(yearData.id);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        await fetchLookupData();

        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            alert('CSV must have a header row and at least one data row');
            return;
        }

        const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
        const requiredHeaders = ['first_name', 'last_name', 'dob', 'grade'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            alert(`Missing required columns: ${missingHeaders.join(', ')}`);
            return;
        }

        const parsed: ParsedStudent[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row: Record<string, string> = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx] || '';
            });

            const errors: string[] = [];

            // Validate required fields
            if (!row.first_name) errors.push('Missing first name');
            if (!row.last_name) errors.push('Missing last name');
            if (!row.dob) errors.push('Missing date of birth');
            if (!row.grade) errors.push('Missing grade');

            // Validate date format
            if (row.dob && !/^\d{4}-\d{2}-\d{2}$/.test(row.dob)) {
                errors.push('DOB must be YYYY-MM-DD format');
            }

            parsed.push({
                first_name: row.first_name,
                last_name: row.last_name,
                dob: row.dob,
                grade: row.grade,
                classroom: row.classroom,
                student_number: row.student_number,
                isValid: errors.length === 0,
                errors
            });
        }

        setParsedData(parsed);
        setImportResult(null);
    };

    const handleImport = async () => {
        if (!selectedOrganization) {
            alert('Please select an organization first');
            return;
        }

        console.log('Starting import for organization:', selectedOrganization.id, selectedOrganization.name);

        setImporting(true);
        let success = 0;
        let failed = 0;

        // Ensure we have basic infrastructure before importing
        // 1. Get or create a default program for this org
        let programId: string | null = null;
        const { data: existingProgram, error: progQueryError } = await supabase
            .from('programs')
            .select('id')
            .eq('organization_id', selectedOrganization.id)
            .limit(1)
            .single();

        if (progQueryError && progQueryError.code !== 'PGRST116') {
            console.error('Program query error:', progQueryError);
        }

        if (existingProgram) {
            programId = existingProgram.id;
            console.log('Using existing program:', programId);
        } else {
            // Create a default program
            console.log('Creating new program for org:', selectedOrganization.id);
            const { data: newProgram, error: programError } = await supabase
                .from('programs')
                .insert({ organization_id: selectedOrganization.id, name: 'Default Program' })
                .select()
                .single();
            if (newProgram) {
                programId = newProgram.id;
                console.log('Created program:', programId);
            }
            if (programError) {
                console.error('Program create error:', programError);
                alert(`Failed to create program: ${programError.message}`);
                setImporting(false);
                return;
            }
        }

        // 2. Get or create a default location for this org
        let locationId: string | null = null;
        const { data: existingLocation } = await supabase
            .from('locations')
            .select('id')
            .eq('organization_id', selectedOrganization.id)
            .limit(1)
            .single();

        if (existingLocation) {
            locationId = existingLocation.id;
        } else {
            // Create a default location
            const { data: newLocation, error: locationError } = await supabase
                .from('locations')
                .insert({ organization_id: selectedOrganization.id, name: 'Main Campus', address: 'TBD' })
                .select()
                .single();
            if (newLocation) locationId = newLocation.id;
            if (locationError) console.error('Location create error:', locationError);
        }

        // 3. Get or create academic year
        let academicYearId: string | null = null;
        const { data: existingYear } = await supabase
            .from('academic_years')
            .select('id')
            .eq('is_active', true)
            .limit(1)
            .single();

        if (existingYear) {
            academicYearId = existingYear.id;
        } else {
            // Create a default academic year
            const currentYear = new Date().getFullYear();
            const { data: newYear, error: yearError } = await supabase
                .from('academic_years')
                .insert({
                    name: `${currentYear}-${currentYear + 1}`,
                    start_date: `${currentYear}-09-01`,
                    end_date: `${currentYear + 1}-06-30`,
                    is_active: true
                })
                .select()
                .single();
            if (newYear) academicYearId = newYear.id;
            if (yearError) console.error('Academic year create error:', yearError);
        }

        if (!programId || !locationId) {
            alert('Failed to set up required infrastructure. Check console for errors.');
            setImporting(false);
            return;
        }

        // Cache for grades and classrooms we create
        const gradeCache: Record<string, string> = {};
        const classroomCache: Record<string, string> = {};

        // Pre-populate cache with existing grades for this org
        const { data: existingGrades } = await supabase
            .from('grades')
            .select('id, name')
            .eq('organization_id', selectedOrganization.id);
        existingGrades?.forEach(g => { gradeCache[g.name.toLowerCase()] = g.id; });

        // Pre-populate cache with existing classrooms
        const { data: existingClassrooms } = await supabase
            .from('classrooms')
            .select('id, name')
            .eq('location_id', locationId);
        existingClassrooms?.forEach(c => { classroomCache[c.name.toLowerCase()] = c.id; });

        for (const student of parsedData.filter(s => s.isValid)) {
            try {
                // Get or create grade
                const gradeName = student.grade.trim();
                let gradeId = gradeCache[gradeName.toLowerCase()];

                if (!gradeId) {
                    // Create the grade with organization_id
                    const { data: newGrade, error: gradeError } = await supabase
                        .from('grades')
                        .insert({ organization_id: selectedOrganization.id, name: gradeName, order: Object.keys(gradeCache).length + 1 })
                        .select()
                        .single();

                    if (newGrade) {
                        gradeId = newGrade.id;
                        gradeCache[gradeName.toLowerCase()] = gradeId;
                    } else {
                        console.error('Grade create error:', gradeError);
                        failed++;
                        continue;
                    }
                }

                // Get or create classroom (if specified)
                let classroomId: string | null = null;
                if (student.classroom) {
                    const classroomName = student.classroom.trim();
                    classroomId = classroomCache[classroomName.toLowerCase()] || null;

                    if (!classroomId) {
                        // Create the classroom
                        const { data: newClassroom, error: classroomError } = await supabase
                            .from('classrooms')
                            .insert({ location_id: locationId, name: classroomName, capacity: 30 })
                            .select()
                            .single();

                        if (newClassroom) {
                            classroomId = newClassroom.id;
                            classroomCache[classroomName.toLowerCase()] = newClassroom.id;
                        } else {
                            console.error('Classroom create error:', classroomError);
                            // Continue without classroom - not a fatal error
                        }
                    }
                }

                // 1. Insert person
                const { data: personData, error: personError } = await supabase
                    .from('persons')
                    .insert({
                        first_name: student.first_name,
                        last_name: student.last_name,
                        dob: student.dob,
                        organization_id: selectedOrganization.id
                    })
                    .select()
                    .single();

                if (personError || !personData) {
                    console.error('Person insert error:', personError);
                    failed++;
                    continue;
                }

                // 2. Insert student
                const studentNumber = student.student_number || `S${Date.now().toString().slice(-6)}`;
                const { data: studentData, error: studentError } = await supabase
                    .from('students')
                    .insert({
                        person_id: personData.id,
                        first_name: student.first_name,
                        last_name: student.last_name,
                        dob: student.dob,
                        student_number: studentNumber
                    })
                    .select()
                    .single();

                if (studentError || !studentData) {
                    console.error('Student insert error:', studentError);
                    failed++;
                    continue;
                }

                // 3. Create enrollment (if classroom specified)
                if (classroomId && academicYearId) {
                    const { error: enrollError } = await supabase.from('enrollments').insert({
                        student_id: studentData.id,
                        classroom_id: classroomId,
                        grade_id: gradeId,
                        academic_year_id: academicYearId,
                        status: 'ACTIVE'
                    });
                    if (enrollError) console.error('Enrollment error:', enrollError);
                }

                success++;
            } catch (err) {
                console.error('Import error:', err);
                failed++;
            }
        }

        setImportResult({ success, failed });
        setImporting(false);

        if (success > 0) {
            onSuccess();
        }
    };

    const handleClose = () => {
        setParsedData([]);
        setImportResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
    };

    if (!isOpen || !mounted) return null;

    const validCount = parsedData.filter(s => s.isValid).length;
    const invalidCount = parsedData.filter(s => !s.isValid).length;

    const modalContent = (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileSpreadsheet className="text-green-600" size={24} />
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Import Students from CSV</h2>
                            <p className="text-sm text-gray-500">Upload a CSV file with student data</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-auto space-y-6">
                    {/* File Upload */}
                    {parsedData.length === 0 && (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                            <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                            <p className="text-gray-600 mb-2">Drag and drop your CSV file, or click to browse</p>
                            <p className="text-xs text-gray-400 mb-4">
                                Required columns: first_name, last_name, dob (YYYY-MM-DD), grade<br />
                                Optional: classroom, student_number
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label
                                htmlFor="csv-upload"
                                className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors"
                            >
                                Select CSV File
                            </label>
                        </div>
                    )}

                    {/* Preview Table */}
                    {parsedData.length > 0 && (
                        <>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1 text-green-600">
                                    <Check size={16} /> {validCount} valid
                                </span>
                                {invalidCount > 0 && (
                                    <span className="flex items-center gap-1 text-red-600">
                                        <AlertCircle size={16} /> {invalidCount} invalid
                                    </span>
                                )}
                            </div>

                            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[400px] overflow-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-600">DOB</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Grade</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Classroom</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {parsedData.map((student, idx) => (
                                            <tr key={idx} className={student.isValid ? '' : 'bg-red-50'}>
                                                <td className="px-4 py-2">
                                                    {student.isValid ? (
                                                        <Check className="text-green-600" size={16} />
                                                    ) : (
                                                        <span className="text-xs text-red-600">{student.errors.join(', ')}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">{student.first_name} {student.last_name}</td>
                                                <td className="px-4 py-2">{student.dob}</td>
                                                <td className="px-4 py-2">{student.grade}</td>
                                                <td className="px-4 py-2">{student.classroom || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Import Result */}
                    {importResult && (
                        <div className={`p-4 rounded-lg ${importResult.failed > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                            <p className="font-medium">
                                Import Complete: {importResult.success} students imported successfully.
                                {importResult.failed > 0 && ` ${importResult.failed} failed.`}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {importResult ? 'Close' : 'Cancel'}
                    </button>
                    {parsedData.length > 0 && !importResult && (
                        <button
                            onClick={handleImport}
                            disabled={importing || validCount === 0}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {importing ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                            {importing ? 'Importing...' : `Import ${validCount} Students`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
