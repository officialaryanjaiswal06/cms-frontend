import React, { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Shield, Moon, Sun, User, Bell, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import PublicFooter from "@/components/layout/PublicFooter"
import PublicHeaderSlider from "@/components/layout/PublicHeaderSlider"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"
import axios from 'axios'
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const FALLBACK_MODULES = [
    { name: 'HOME', id: '', isStatic: true },
    { name: 'PROGRAMS', id: 'program' },
    { name: 'ACADEMIC', id: 'academic' },
];


export default function CMSLanding() {
    const { isAuthenticated, logout, user, hasAnyRole, permissions } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [modules, setModules] = useState<{ name: string, id: string, isStatic?: boolean }[]>([]);
    const [academicPrograms, setAcademicPrograms] = useState<any[]>([]);
    const [loadingPrograms, setLoadingPrograms] = useState(true);
    const [previews, setPreviews] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Fetch dynamic modules
    useEffect(() => {
        const fetchModules = async () => {
            try {
                const res = await axios.get('http://localhost:8080/internal/modules/list');
                const apiModules = Array.isArray(res.data) ? res.data : [];
                const mapped = apiModules
                    .filter(m => !['notification', 'footer', 'header'].includes(m.toLowerCase()))
                    .map(m => ({
                        name: m.toUpperCase(),
                        id: m.toLowerCase()
                    }));
                setModules([{ name: 'HOME', id: '', isStatic: true }, ...mapped]);
            } catch (error) {
                console.error("Failed to fetch modules", error);
                setModules(FALLBACK_MODULES);
            }
        };
        fetchModules();
    }, []);

    // Fetch Academic Programs for the landing page body
    useEffect(() => {
        const fetchPrograms = async () => {
            setLoadingPrograms(true);
            try {
                const res = await axios.get('http://localhost:8080/content/public/posts/PROGRAM');
                setAcademicPrograms(Array.isArray(res.data) ? res.data : []);
            } catch (error) {
                console.error("Failed to fetch programs", error);
            } finally {
                setLoadingPrograms(false);
            }
        };
        fetchPrograms();
    }, []);

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 400;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const handleMouseEnter = async (moduleId: string) => {
        if (!moduleId || previews[moduleId] || loading[moduleId]) return;
        setLoading(prev => ({ ...prev, [moduleId]: true }));
        try {
            const apiModule = moduleId.toUpperCase().replace('-', '_');
            const res = await axios.get(`http://localhost:8080/content/public/posts/${apiModule}`);
            const posts = Array.isArray(res.data) ? res.data.slice(0, 8) : [];
            setPreviews(prev => ({ ...prev, [moduleId]: posts }));
        } catch (error) {
            console.error(`Failed to fetch preview`, error);
        } finally {
            setLoading(prev => ({ ...prev, [moduleId]: false }));
        }
    };

    const hasNotificationPermission = permissions?.some(p =>
        ['NOTIFICATION_READ', 'NOTIFICATION_CREATE', 'NOTIFICATION_UPDATE', 'NOTIFICATION_DELETE'].includes(p)
    );

    const canAccessDashboard = hasAnyRole(['SUPERADMIN', 'ADMIN', 'EDITOR', 'MODULE_EDITOR', 'PROGRAM_EDITOR', 'ABOUT_US_EDITOR']) || hasNotificationPermission;

    const handleOpenChange = (moduleId: string, isOpen: boolean) => {
        setOpenMenus(prev => ({ ...prev, [moduleId]: isOpen }));
    };

    const handleTriggerClick = (moduleId: string) => {
        if (openMenus[moduleId]) {
            navigate(`/view/${moduleId}`);
        } else {
            handleOpenChange(moduleId, true);
        }
    };

    useEffect(() => {
        if (canAccessDashboard) {
            navigate('/dashboard', { replace: true });
        }
    }, [canAccessDashboard, navigate]);

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 font-sans">
            {/* Header */}
            <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50">
                {/* Row 1: Branding & User Actions */}
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <Shield className="h-6 w-6 text-amber-500" />
                            </div>
                            <span className="font-serif font-bold text-xl text-slate-900 dark:text-slate-50 hidden md:inline-block">
                                Universal College Of Management
                            </span>
                            <span className="font-serif font-bold text-xl text-slate-900 dark:text-slate-50 md:hidden">
                                UCM
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
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
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate('/notifications')}
                                    className="rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    title="Notifications"
                                >
                                    <Bell className="h-5 w-5" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate('/profile')}
                                    className="rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 mr-2"
                                    title="My Profile"
                                >
                                    <User className="h-5 w-5" />
                                </Button>

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

                {/* Row 2: Dynamic Navigation */}
                <div className="bg-slate-900 dark:bg-slate-900/50 border-t border-slate-800">
                    <div className="container mx-auto px-4">
                        <NavigationMenu className="w-full justify-center">
                            <NavigationMenuList className="gap-2 md:gap-6 py-1">
                                {modules.map((module) =>
                                    module.isStatic ? (
                                        <NavigationMenuItem key={module.id || 'home'}>
                                            <NavigationMenuLink asChild>
                                                <Link
                                                    to="/"
                                                    className="flex items-center h-10 px-4 text-[12px] font-bold uppercase tracking-widest text-slate-300 hover:text-amber-500 transition-colors outline-none"
                                                >
                                                    {module.name}
                                                </Link>
                                            </NavigationMenuLink>
                                        </NavigationMenuItem>
                                    ) : (
                                        <DropdownMenu
                                            key={module.id}
                                            open={openMenus[module.id] || false}
                                            onOpenChange={(isOpen) => handleOpenChange(module.id, isOpen)}
                                        >
                                            <DropdownMenuTrigger
                                                onPointerEnter={() => handleMouseEnter(module.id)}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleTriggerClick(module.id);
                                                }}
                                                className="bg-transparent h-10 px-4 text-[12px] font-bold uppercase tracking-widest text-slate-300 hover:text-amber-500 data-[state=open]:text-amber-500 data-[state=open]:bg-white/5 rounded-none border-0 focus:bg-white/5 focus:outline-none transition-all flex items-center gap-1"
                                            >
                                                {module.name}
                                                <ChevronDown className="h-3 w-3" />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="rounded-none border-t-2 border-amber-500 shadow-xl p-0 w-[280px] bg-white dark:bg-slate-900 overflow-hidden">
                                                <DropdownMenuLabel className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500 border-b border-slate-100 dark:border-slate-800">
                                                    {module.name}
                                                </DropdownMenuLabel>
                                                <ul className="flex flex-col">
                                                    {loading[module.id] ? (
                                                        <div className="p-4 space-y-2">
                                                            <div className="h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                                                            <div className="h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                                                        </div>
                                                    ) : (previews[module.id]?.length || 0) > 0 ? (
                                                        previews[module.id]?.map((post) => (
                                                            <DropdownMenuItem key={post.id} asChild className="p-0 focus:bg-transparent">
                                                                <Link
                                                                    to={`/view/${module.id}/${post.id}`}
                                                                    className="block select-none rounded-none p-3 leading-none no-underline outline-none transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 last:border-0"
                                                                >
                                                                    <div className="text-[13px] font-medium leading-none">
                                                                        {post.displayTitle || post.data?.Title || post.data?.title || 'Untitled'}
                                                                    </div>
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        ))
                                                    ) : (
                                                        <div className="text-[13px] text-slate-400 p-4 italic text-center text-slate-700 dark:text-slate-300">
                                                            No records found.
                                                        </div>
                                                    )}
                                                </ul>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )
                                )}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>
                </div>
            </header>

            <PublicHeaderSlider />

            <main className="flex-1">
                {/* Academic Programs Section */}
                <section className="py-20 bg-slate-50 dark:bg-slate-950 overflow-hidden group">
                    <div className="container mx-auto px-4 relative">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-slate-50 mb-2">
                                    Academic Programs
                                </h2>
                                <div className="h-1 w-20 bg-amber-500" />
                            </div>

                            {/* Scroll Buttons */}
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleScroll('left')}
                                    className="rounded-full border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-500 hover:text-white"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleScroll('right')}
                                    className="rounded-full border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-500 hover:text-white"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Carousel Container */}
                        <div
                            ref={scrollContainerRef}
                            className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar scroll-smooth justify-center md:justify-start lg:justify-center"
                        >
                            {loadingPrograms ? (
                                Array(4).fill(0).map((_, i) => (
                                    <div key={i} className="min-w-[300px] h-[350px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg border border-dashed border-slate-300" />
                                ))
                            ) : academicPrograms.length > 0 ? (
                                academicPrograms.map((program) => {
                                    const title = program.displayTitle || program.data?.Title || program.data?.title || 'Untitled';
                                    const description = program.data?.desc || program.data?.Description || program.data?.description || program.data?.content || '';

                                    return (
                                        <div
                                            key={program.id}
                                            className="w-[320px] md:w-[350px] flex-shrink-0 snap-start"
                                        >
                                            <div className="h-full bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow duration-300 min-h-[320px]">
                                                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100 uppercase tracking-tight w-full">
                                                    {String(title)}
                                                </h3>
                                                <div className="w-full mb-6">
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-2 h-[40px] overflow-hidden break-words">
                                                        {String(description)}
                                                    </p>
                                                </div>
                                                <Button asChild className="bg-[#007bff] hover:bg-[#0069d9] text-white rounded-none px-6 py-4 h-auto text-xs font-bold uppercase tracking-wider">
                                                    <Link to={`/view/program/${program.id}`}>View Details</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-20 text-center w-full">
                                    <p className="text-slate-500">No programs found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <PublicFooter />
        </div>
    );
}
