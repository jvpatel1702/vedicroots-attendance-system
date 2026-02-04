'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            setLoading(false);

            if (profile?.role === 'ADMIN') {
                router.push('/admin');
            } else {
                router.push('/teacher');
            }
        }
    };

    const handleDemoLogin = async (role: 'ADMIN' | 'TEACHER') => {
        setLoading(true);
        setError(null);

        const email = role === 'ADMIN' ? 'admin@vedicroots.com' : 'teacher@vedicroots.com';
        const password = 'password123';
        const name = role === 'ADMIN' ? 'Admin User' : 'Teacher User';

        // 1. Try to Login
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (!signInError && signInData.session) {
            router.push(role === 'ADMIN' ? '/admin' : '/teacher');
            return;
        }

        // 2. If login fails (assume user doesn't exist), try to SignUp
        if (signInError && signInError.message.includes('Invalid login credentials')) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    }
                }
            });

            if (signUpError) {
                setError(`Demo setup failed: ${signUpError.message}`);
                setLoading(false);
                return;
            }

            if (signUpData.user) {
                // 3. Create Profile manually if trigger didn't catch it (doing it here to be safe)
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: signUpData.user.id,
                        email: email,
                        name: name,
                        role: role
                    })
                    .select()
                    .single();

                // If conflict (profile already exists ignoring error), just proceed
                if (profileError && !profileError.message.includes('duplicate key')) {
                    console.error('Profile creation error:', profileError);
                }

                // 4. Login again to be sure (sometimes signup auto-logs in, sometimes strict email confirm prevents it)
                // For dev/demo, we assume email confirmation is OFF or we can login immediately.
                const { data: reSignInData, error: reSignInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (reSignInError) {
                    setError("User created but could not login. Check Email Confirm settings.");
                } else {
                    router.push(role === 'ADMIN' ? '/admin' : '/teacher');
                }
            }
        } else if (signInError) {
            setError(signInError.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-center text-gray-900">Sign in</h2>
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm rounded-md">
                        {error}
                    </div>
                )}
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>

                <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="text-center text-sm font-medium text-gray-500 mb-4">Developer Bypass</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleDemoLogin('ADMIN')}
                            disabled={loading}
                            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:opacity-50"
                            type="button"
                        >
                            Admin Demo
                        </button>
                        <button
                            onClick={() => handleDemoLogin('TEACHER')}
                            disabled={loading}
                            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:opacity-50"
                            type="button"
                        >
                            Teacher Demo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
