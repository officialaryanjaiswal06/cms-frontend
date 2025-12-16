import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Box, // Generic icon for modules
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { modulesApi } from '@/services/api';
import { Module } from '@/types';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { hasAnyRole, logout, user, permissions, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    const resolveModules = async () => {
      let fetchedModules: Module[] = [];
      let apiFailed = false;

      // 1. If Admin/Superadmin, try fetch from API
      if (hasAnyRole(['SUPERADMIN', 'ADMIN'])) {
        try {
          fetchedModules = await modulesApi.getAll();
          setModules(fetchedModules);
          return; // Success, exit
        } catch (error) {
          console.error("Failed to fetch modules from API, falling back to permissions", error);
          apiFailed = true;
          // Don't return, fall through to derived logic
        }
      }

      // 2. If Regular User OR API failed, derive modules from permissions
      //   if (permissions && (apiFailed || !hasAnyRole(['SUPERADMIN', 'ADMIN']))) {
      //     const derivedModules: Module[] = permissions
      //       .filter(p => p.endsWith('_READ') || p.endsWith("_CREATE") || p.endsWith("_UPDATE") || p.endsWith("_DELETE"))
      //       .map(p => {
      //         const rawName = p
      //     .replace('_READ', '')
      //     .replace('_CREATE', '')
      //     .replace('_UPDATE', '')
      //     .replace('_DELETE', '');

      //         const nameWithSpaces = rawName.replace(/_/g, ' ');
      //         const displayName = nameWithSpaces
      //           .toLowerCase()
      //           .split(' ')
      //           .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      //           .join(' ');

      //         return {
      //           id: 0,
      //           moduleName: displayName
      //         };
      //       });

      //     setModules(derivedModules);
      //   }
      // };
      if (permissions && (apiFailed || !hasAnyRole(['SUPERADMIN', 'ADMIN']))) {
        const moduleSet = new Set<string>(); // to avoid duplicates

        const derivedModules: Module[] = permissions
          .filter(p =>
            p.endsWith('_READ') ||
            p.endsWith('_CREATE') ||
            p.endsWith('_UPDATE') ||
            p.endsWith('_DELETE')
          )
          .map(p => {
            const rawName = p
              .replace('_READ', '')
              .replace('_CREATE', '')
              .replace('_UPDATE', '')
              .replace('_DELETE', '');

            const nameWithSpaces = rawName.replace(/_/g, ' ');
            const displayName = nameWithSpaces
              .toLowerCase()
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

            return displayName;
          })
          .filter(name => {
            if (moduleSet.has(name)) return false; // skip duplicates
            moduleSet.add(name);
            return true;
          })
          .map(name => ({
            id: 0,
            moduleName: name,
          }));

        setModules(derivedModules);
      }
    }

    if (user) {
      resolveModules();
    }
  }, [user, hasAnyRole, permissions]);

  const staticMenuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      visible: true,
    },
    {
      title: 'User Management',
      icon: Users,
      path: '/users',
      visible: hasAnyRole(['SUPERADMIN', 'ADMIN']),
    },
    {
      title: 'Roles & Permissions',
      icon: Shield,
      path: '/roles',
      visible: hasAnyRole(['SUPERADMIN', 'ADMIN']),
    },
    {
      title: 'Notifications',
      icon: Bell,
      path: '/admin/notifications',
      visible: hasAnyRole(['SUPERADMIN', 'ADMIN']) ||
        ['NOTIFICATION_READ', 'NOTIFICATION_CREATE', 'NOTIFICATION_UPDATE', 'NOTIFICATION_DELETE'].some(p => hasPermission(p)) ||
        modules.some(m => ['Notification', 'Notifications'].includes(m.moduleName)),
    },
  ];

  // Dynamically add modules to the menu
  const moduleItems = modules
    .filter(m => !['Notification', 'Notifications'].includes(m.moduleName))
    .map((module) => ({
      title: module.moduleName,
      icon: Box,
      path: `/modules/${module.moduleName.toLowerCase().replace(/\s+/g, '-')}`,
      visible: true,
      // Visibility is handled by the backend (only permitted modules are returned), 
      // so we can set visible: true for everything returned.
    }));

  const menuItems = [...staticMenuItems, ...moduleItems];

  const isActive = (path: string) => location.pathname === path;

  const MenuItem = ({ item }: { item: typeof menuItems[0] }) => {
    if (!item.visible) return null;

    const content = (
      <NavLink
        to={item.path}
        className={cn(
          'sidebar-item w-full',
          isActive(item.path) ? 'sidebar-item-active' : 'sidebar-item-inactive'
        )}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span className="truncate">{item.title}</span>}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <span className="text-lg font-semibold text-sidebar-foreground">
            Admin Panel
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto custom-scrollbar">
        {/* Added overflow-y-auto to handle many modules */}
        {menuItems.map((item) => (
          <MenuItem key={item.path} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {/* User info */}
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user.username}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        )}

        {/* Theme toggle */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'default'}
              onClick={toggleTheme}
              className={cn(
                'w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent',
                collapsed && 'justify-center'
              )}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              {!collapsed && <span className="ml-3">Toggle Theme</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">Toggle Theme</TooltipContent>
          )}
        </Tooltip>

        {/* Logout */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'default'}
              onClick={logout}
              className={cn(
                'w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive',
                collapsed && 'justify-center'
              )}
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && <span className="ml-3">Logout</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">Logout</TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
};

export default Sidebar;
