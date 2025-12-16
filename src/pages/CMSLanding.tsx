import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Shield, Moon, Sun, User, Bell } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"

export default function CMSLanding() {
    const { isAuthenticated, logout, user, hasAnyRole, permissions } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    // Define roles that can access dashboard
    const hasNotificationPermission = permissions?.some(p =>
        ['NOTIFICATION_READ', 'NOTIFICATION_CREATE', 'NOTIFICATION_UPDATE', 'NOTIFICATION_DELETE'].includes(p)
    );

    // Check if user has any of the required roles OR has notification permissions
    const canAccessDashboard = hasAnyRole(['SUPERADMIN', 'ADMIN', 'EDITOR', 'MODULE_EDITOR', 'PROGRAM_EDITOR', 'ABOUT_US_EDITOR']) || hasNotificationPermission;

    // Auto-redirect privileged users to dashboard
    useEffect(() => {
        if (canAccessDashboard) {
            navigate('/dashboard', { replace: true });
        }
    }, [canAccessDashboard, navigate]);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans">
            {/* Header */}
            <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <Shield className="h-6 w-6 text-amber-500" />
                        </div>
                        <span className="font-serif font-bold text-xl text-slate-900 dark:text-slate-50">Universal College Of Management</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 mr-2"
                        >
                            {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-slate-700" />}
                        </Button>

                        {isAuthenticated ? (
                            <div className="flex items-center gap-2">
                                {/* Notifications Button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate('/notifications')}
                                    className="rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    title="Notifications"
                                >
                                    <Bell className="h-5 w-5" />
                                </Button>

                                {/* Profile Button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate('/profile')}
                                    className="rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 mr-2"
                                    title="My Profile"
                                >
                                    <User className="h-5 w-5" />
                                </Button>

                                <span className="text-sm text-slate-600 dark:text-slate-400 hidden md:inline-block mr-2">
                                    Welcome, <span className="font-medium text-slate-900 dark:text-slate-200">{user?.username || 'User'}</span>
                                </span>
                                <Button variant="outline" onClick={logout} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white border-0">
                                <Link to="/login">Login</Link>
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex items-center justify-center p-4">
                {/* Empty State / Simplified Landing */}
                <div className="text-center space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                        Select an option from the menu to proceed.
                    </p>

                    <div className="flex justify-center gap-4">
                        {canAccessDashboard ? (
                            <Button asChild size="lg" className="bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white">
                                <Link to="/dashboard">Go to Dashboard</Link>
                            </Button>
                        ) : !isAuthenticated && (
                            <Button asChild size="lg" className="bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white">
                                <Link to="/login">Student Login</Link>
                            </Button>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-auto bg-white dark:bg-slate-900">
                <div className="container mx-auto px-4 text-center text-slate-500 dark:text-slate-400">
                    <p>© 2024 Universal College Of Management. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
