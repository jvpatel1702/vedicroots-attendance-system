import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        // User is authenticated, get their role and redirect to appropriate dashboard
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role === 'ADMIN') {
            redirect('/admin');
        } else if (profile?.role === 'TEACHER') {
            redirect('/teacher');
        } else if (profile?.role === 'OFFICE') {
            redirect('/office');
        }
    }

    // User is not authenticated, redirect to login
    redirect('/login');
}
