import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { LogOut, User, Briefcase, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { name: 'Jobs', path: '/jobs', icon: Briefcase },
        ...(user?.role === 'job_seeker'
            ? [{ name: 'My Profile', path: '/profile', icon: User }]
            : []),
        ...(user?.role === 'company'
            ? [{ name: 'Dashboard', path: '/employer/dashboard', icon: LayoutDashboard }]
            : []),
    ];

    return (
        <nav className="bg-background/80 backdrop-blur-md border-b border-muted/20 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">L</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-text">LockedIn</span>
                        </Link>

                        <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-muted hover:text-primary transition-colors"
                                >
                                    <link.icon className="w-4 h-4 mr-2" />
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="hidden sm:flex sm:items-center sm:gap-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-muted">
                                    Hi, <span className="text-text font-medium">{user.name}</span>
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-sm font-medium text-text hover:text-primary transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-accent transition-all shadow-lg shadow-primary/20"
                                >
                                    Join Now
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center sm:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-muted hover:text-text hover:bg-muted/10 transition-colors"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="sm:hidden bg-background border-b border-muted/20 pb-4">
                    <div className="pt-2 pb-3 space-y-1 px-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center px-3 py-2 text-base font-medium text-muted hover:text-primary hover:bg-muted/10 rounded-lg"
                            >
                                <link.icon className="w-5 h-5 mr-3" />
                                {link.name}
                            </Link>
                        ))}
                    </div>
                    <div className="pt-4 pb-3 border-t border-muted/20 px-4">
                        {user ? (
                            <div className="space-y-4">
                                <div className="flex items-center px-3">
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-base font-medium text-text">{user.name}</div>
                                        <div className="text-sm font-medium text-muted">{user.email}</div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center px-3 py-2 text-base font-medium text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                                    >
                                        <LogOut className="w-5 h-5 mr-3" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Link
                                    to="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block w-full text-center px-4 py-2 text-base font-medium text-text border border-muted/20 rounded-lg"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block w-full text-center px-4 py-2 text-base font-medium bg-primary text-white rounded-lg shadow-lg shadow-primary/20"
                                >
                                    Join Now
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
