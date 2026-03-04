// src/components/NotificationBell.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, BellRing, Briefcase, CheckCheck, X } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';

type Notification = {
    id: number;
    type: string;
    title: string;
    message: string;
    jobId: number | null;
    companyId: number | null;
    isRead: boolean;
    createdAt: string;
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function NotificationBell() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get<{ notifications: Notification[]; unreadCount: number }>(
                '/notifications'
            );
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch {
            // Fail silently — don't disrupt the user experience
        }
    }, []);

    // Initial fetch + polling every 30 seconds
    useEffect(() => {
        if (!user || user.role !== 'job_seeker') return;

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user, fetchNotifications]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleNotificationClick = async (n: Notification) => {
        if (!n.isRead) {
            try {
                await api.patch(`/notifications/${n.id}/read`);
                setNotifications((prev) =>
                    prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
                );
                setUnreadCount((c) => Math.max(0, c - 1));
            } catch {
                // ignore
            }
        }
        if (n.jobId) {
            setIsOpen(false);
            navigate(`/jobs?highlight=${n.jobId}`);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {
            // ignore
        }
    };

    if (!user || user.role !== 'job_seeker') return null;

    const BellIcon = unreadCount > 0 ? BellRing : Bell;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell button */}
            <button
                id="notification-bell-btn"
                onClick={() => setIsOpen((prev) => !prev)}
                className="relative p-2 rounded-xl text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
                <BellIcon
                    className={`w-5 h-5 ${unreadCount > 0 ? 'text-primary animate-[wiggle_0.5s_ease-in-out]' : ''}`}
                />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 animate-in zoom-in duration-200">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    id="notification-dropdown"
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-secondary border border-muted/20 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-muted/10 bg-secondary/80 backdrop-blur-sm">
                        <h3 className="text-sm font-black text-text uppercase tracking-wider">
                            Notifications
                        </h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-bold transition-colors"
                                    title="Mark all as read"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-lg text-muted hover:text-text hover:bg-muted/10 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto max-h-[360px]">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted">
                                <Bell className="w-10 h-10 opacity-20" />
                                <p className="text-sm font-medium">No notifications yet</p>
                                <p className="text-xs opacity-60">Subscribe to companies to get alerts when they post new jobs</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`w-full text-left flex items-start gap-3 px-4 py-3.5 hover:bg-primary/5 transition-colors border-b border-muted/5 last:border-0 ${!n.isRead ? 'bg-primary/5' : ''}`}
                                >
                                    {/* Icon */}
                                    <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${!n.isRead ? 'bg-primary/20 text-primary' : 'bg-muted/10 text-muted'}`}>
                                        <Briefcase className="w-4 h-4" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold truncate ${!n.isRead ? 'text-text' : 'text-muted'}`}>
                                            {n.title}
                                        </p>
                                        <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.message}</p>
                                        <p className="text-[10px] text-muted/60 mt-1">{timeAgo(n.createdAt)}</p>
                                    </div>

                                    {/* Unread dot */}
                                    {!n.isRead && (
                                        <div className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(var(--primary-rgb),0.8)]" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
