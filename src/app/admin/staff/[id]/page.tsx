'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useOrganization } from '@/context/OrganizationContext';
import { ArrowLeft, Mail, Phone, MapPin, Building2, User, GraduationCap, Calendar } from 'lucide-react';
import Link from 'next/link';

interface StaffProfile {
    id: string;
    email: string;
    role: string;
    person: {
        first_name: string;
        last_name: string;
        photo_url?: string;
        email?: string; // Contact email might differ from login email
        phone?: string;
        address?: string;
    };
    classrooms: {
        classroom_id: string;
        is_primary: boolean;
        classrooms: {
            id: string;
            name: string;
        };
    }[];
}

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();

    const [staff, setStaff] = useState<StaffProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStaffDetails = useCallback(async () => {
        if (!selectedOrganization) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('staff')
            .select(`
                id,
                email,
                role,
                person:persons!inner (
                    first_name,
                    last_name,
                    photo_url,
                    email,
                    phone,
                    address
                ),
                classrooms:teacher_classrooms (
                    classroom_id,
                    is_primary,
                    classrooms (
                        id,
                        name
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching staff details:', error);
        } else if (data) {
            setStaff(data as any);
        }

        setLoading(false);
    }, [id, selectedOrganization, supabase]);

    useEffect(() => {
        fetchStaffDetails();
    }, [fetchStaffDetails]);

    if (!selectedOrganization) return <div className="p-6">Please select an organization.</div>;
    if (loading) return <div className="p-6">Loading staff details...</div>;
    if (!staff) return <div className="p-6">Staff member not found.</div>;

    return (
        <div className="space-y-6">
            {/* Header / Navigation */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/staff"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {staff.person.first_name} {staff.person.last_name}
                    </h1>
                    <p className="text-sm text-gray-500">Staff Profile & Assignments</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                        <div className="px-6 pb-6">
                            <div className="relative -mt-12 mb-4">
                                <div className="h-24 w-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center">
                                    {staff.person.photo_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={staff.person.photo_url}
                                            alt={staff.person.first_name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-3xl font-bold text-gray-400">
                                            {staff.person.first_name[0]}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1 mb-6">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {staff.person.first_name} {staff.person.last_name}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-700 uppercase">
                                        {staff.role}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm text-gray-600">
                                <div className="flex items-center gap-3">
                                    <Mail size={16} className="text-gray-400" />
                                    <span>{staff.email}</span>
                                </div>
                                {staff.person.phone && (
                                    <div className="flex items-center gap-3">
                                        <Phone size={16} className="text-gray-400" />
                                        <span>{staff.person.phone}</span>
                                    </div>
                                )}
                                {staff.person.address && (
                                    <div className="flex items-start gap-3">
                                        <MapPin size={16} className="text-gray-400 mt-0.5" />
                                        <span>{staff.person.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Assigned Classrooms */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Building2 size={20} className="text-indigo-600" />
                            Assigned Classrooms
                        </h3>
                        {staff.classrooms && staff.classrooms.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {staff.classrooms.map((assignment) => (
                                    <Link
                                        key={assignment.classroom_id}
                                        href={`/admin/classrooms/${assignment.classroom_id}`}
                                        className="group block p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 group-hover:text-indigo-700">
                                                    {assignment.classrooms.name}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {assignment.is_primary ? 'Primary Teacher' : 'Support Staff'}
                                                </p>
                                            </div>
                                            <ArrowLeft size={16} className="text-gray-400 rotate-180 group-hover:text-indigo-500 transform transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <GraduationCap className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                                <p className="text-gray-500">No classrooms assigned.</p>
                                <Link
                                    href="/admin/classrooms"
                                    className="text-sm text-indigo-600 hover:underline mt-1 inline-block"
                                >
                                    Manage assignments in Classrooms
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Schedule / Timetable Placeholder */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 opacity-70">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-indigo-600" />
                            Weekly Schedule
                        </h3>
                        <p className="text-sm text-gray-500 italic">
                            Detailed schedule view coming soon.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
