import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';
export default function PublicLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans antialiased">
            <PublicNavbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <PublicFooter />
        </div>
    );
}
