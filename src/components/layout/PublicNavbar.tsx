import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Moon, Sun, ChevronDown, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
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
import { cn } from "@/lib/utils";

const FALLBACK_MODULES = [
    { name: 'HOME', id: '', isStatic: true },
    { name: 'PROGRAMS', id: 'program' },
    { name: 'ACADEMIC', id: 'academic' },
];

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a"> & { title: string }
>(({ className, title, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <Link
                    ref={ref as any}
                    to={props.href || '#'}
                    className={cn(
                        "block select-none rounded-none p-3 leading-none no-underline outline-none transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 last:border-0",
                        className
                    )}
                    {...props}
                >
                    <div className="text-[13px] font-medium leading-none">{title}</div>
                </Link>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"

export default function PublicNavbar() {
    const { theme, toggleTheme } = useTheme();
    const { isAuthenticated, logout, hasAnyRole, permissions, user } = useAuth();
    const navigate = useNavigate();

    const [modules, setModules] = useState<{ name: string, id: string, isStatic?: boolean }[]>([]);
    const [previews, setPreviews] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

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

                setModules([
                    { name: 'HOME', id: '', isStatic: true },
                    ...mapped
                ]);
            } catch (error) {
                console.error("Failed to fetch modules", error);
                setModules(FALLBACK_MODULES);
            }
        };
        fetchModules();
    }, []);

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

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300">
            {/* Row 1: Logo & Auth */}
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <Shield className="h-6 w-6 text-amber-500" />
                        </div>
                        <span className="font-serif font-bold text-xl text-slate-900 dark:text-slate-50 hidden md:inline-block">Universal College</span>
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                            {/* Dashboard Redirect for privileged users */}
                            {(hasAnyRole(['SUPERADMIN', 'ADMIN', 'EDITOR', 'MODULE_EDITOR', 'PROGRAM_EDITOR', 'ABOUT_US_EDITOR']) ||
                                permissions?.some(p => p.startsWith('NOTIFICATION_'))) && (
                                    <Button variant="ghost" size="sm" asChild className="hidden xl:inline-flex">
                                        <Link to="/dashboard">Dashboard</Link>
                                    </Button>
                                )}
                            <Button variant="outline" size="sm" onClick={logout} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-0 px-6">
                            <Link to="/login">Login</Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Row 2: Theme-Consistent Navbar (Dark Slate / Amber) */}
            <div className="bg-slate-900 dark:bg-slate-950 border-t-2 border-amber-500/50 py-0.5 shadow-md">
                <div className="container mx-auto px-4">
                    <NavigationMenu className="w-full justify-center">
                        <NavigationMenuList className="gap-2 md:gap-6 py-1">
                            {modules.map((module) =>
                                module.isStatic ? (
                                    <NavigationMenuItem key={module.name}>
                                        <NavigationMenuLink asChild>
                                            <Link
                                                to="/"
                                                className="inline-flex h-10 w-max items-center justify-center rounded-none px-4 py-2 text-[12px] font-bold uppercase tracking-widest text-slate-300 hover:text-amber-500 hover:bg-white/5 transition-all outline-none"
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
    );
}
