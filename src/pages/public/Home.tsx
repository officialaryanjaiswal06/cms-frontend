import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

export default function Home() {
    const { isAuthenticated, hasAnyRole, permissions } = useAuth();
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
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="text-center space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        Welcome to Universal College
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                        Select an option from the menu to explore our programs, academic updates, and events.
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
                        {!canAccessDashboard && isAuthenticated && (
                            <Button asChild size="lg" variant="outline">
                                <Link to="/view/program">Browse Programs</Link>
                            </Button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
