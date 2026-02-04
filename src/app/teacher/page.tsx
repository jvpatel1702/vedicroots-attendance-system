'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useUser } from '@/lib/useUser';

interface Classroom {
    id: string;
    name: string;
    grade: string;
}

export default function TeacherDashboard() {
    const supabase = createClient();
    const { user, loading, isDev } = useUser();
    const [classes, setClasses] = useState<Classroom[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!user && !loading) return; // Wait for user check

            if (isDev) {
                setClasses([
                    { id: 'c1-dev', name: 'Ashoka House (Dev)', grade: '1st Grade' },
                    { id: 'c2-dev', name: 'Banyan House (Dev)', grade: '2nd Grade' },
                ]);
                setDataLoading(false);
                return;
            }

            // If user is real, fetch data
            if (user && !isDev) {
                const { data } = await supabase
                    .from('teacher_classrooms')
                    .select(`
              classrooms (
                id,
                name,
                grade
              )
            `)
                    .eq('teacher_id', user.id);

                if (data) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const formatted = data.map((item: any) => item.classrooms);
                    setClasses(formatted);
                }
                setDataLoading(false);
            }
        }
        fetchData();
    }, [user, loading, isDev, supabase]);

    if (loading || dataLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <h2 className="text-2xl font-bold">Welcome back!</h2>
                <p className="opacity-90 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                {isDev && <span className="inline-block mt-2 px-2 py-0.5 bg-white/20 rounded text-xs">Dev Mode</span>}
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Classrooms</h3>
                <div className="grid gap-4">
                    {classes.length > 0 ? classes.map((cls) => (
                        <Link
                            key={cls.id}
                            href={`/teacher/classroom/${cls.id}`}
                            className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-98 transition-transform"
                        >
                            <div>
                                <h4 className="font-bold text-gray-900">{cls.name}</h4>
                                <p className="text-sm text-gray-500">{cls.grade}</p>
                            </div>
                            <ChevronRight className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                        </Link>
                    )) : (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500">No classes assigned yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
