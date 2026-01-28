import type { ReactNode } from 'react';
import Navbar from './Navbar';

interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
            <footer className="py-8 border-t border-muted/20 text-center text-muted text-sm">
                <p>&copy; {new Date().getFullYear()} LockedIn. All rights reserved.</p>
            </footer>
        </div>
    );
}
