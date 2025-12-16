import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Shield, School } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
    const { user, roles } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
            {/* Header */}
            <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <School className="h-6 w-6 text-amber-500" />
                        </div>
                        <span className="font-serif font-bold text-xl text-slate-900 dark:text-slate-50">Profile</span>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Profile Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="h-32 bg-slate-900 dark:bg-slate-950 relative">
                            <div className="absolute inset-0 opacity-10">
                                <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" className="text-white" />
                                </svg>
                            </div>
                        </div>

                        <div className="px-8 pb-8">
                            <div className="relative -mt-16 mb-6">
                                <div className="inline-flex items-center justify-center h-32 w-32 rounded-full border-4 border-white dark:border-slate-900 bg-amber-500 text-white shadow-md">
                                    <span className="text-5xl font-serif">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 font-serif">{user?.username}</h1>
                                    <p className="text-slate-500 dark:text-slate-400">Universal College of Management Member</p>
                                </div>

                                <div className="grid gap-4">
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                        <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full">
                                            <Mail className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Email Address</p>
                                            <p className="text-slate-900 dark:text-slate-100 font-medium">{user?.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                        <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full">
                                            <Shield className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Account Roles</p>
                                            <div className="flex gap-2 mt-1">
                                                {roles.length > 0 ? roles.map(role => (
                                                    <span key={role} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-500">
                                                        {role}
                                                    </span>
                                                )) : (
                                                    <span className="text-slate-900 dark:text-slate-100">Standard User</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>


                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;
