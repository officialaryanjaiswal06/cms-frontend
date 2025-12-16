import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell, User, Tag, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { notificationsApi, Notification } from '@/services/api';
import { toast } from 'sonner';

const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user?.email) return;
            try {
                const data = await notificationsApi.getMyNotifications(user.email);
                setNotifications(data);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
                toast.error("Could not load notifications");
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();
    }, [user?.email]);

    const getIconAndColor = (category: string) => {
        switch (category) {
            case 'SYSTEM_ALERT':
                return { icon: AlertTriangle, colorClass: 'text-red-500 bg-red-100 dark:bg-red-900/20' };
            case 'ACCOUNT':
                return { icon: User, colorClass: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20' };
            case 'PROMOTION':
                return { icon: Tag, colorClass: 'text-green-500 bg-green-100 dark:bg-green-900/20' };
            default:
                return { icon: Bell, colorClass: 'text-amber-500 bg-amber-100 dark:bg-amber-900/20' };
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
            {/* Header */}
            <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <Bell className="h-6 w-6 text-amber-500" />
                        </div>
                        <span className="font-serif font-bold text-xl text-slate-900 dark:text-slate-50">Notifications</span>
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
                <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                        </div>
                    ) : notifications.length > 0 ? (
                        notifications.map((notif) => {
                            const { icon: Icon, colorClass } = getIconAndColor(notif.category);
                            return (
                                <div
                                    key={notif.id}
                                    className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 p-2 rounded-full ${colorClass}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-medium text-slate-900 dark:text-slate-100">
                                                    {notif.subject}
                                                </h3>
                                                <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                {notif.messageBody}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12">
                            <div className="inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-900 mb-4">
                                <Bell className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500">No new notifications</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Notifications;
