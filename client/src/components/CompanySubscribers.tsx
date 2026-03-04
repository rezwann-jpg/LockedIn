// src/components/CompanySubscribers.tsx
import { useState, useEffect } from 'react';
import { Users, Mail, Calendar, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/useAuth';
import { format } from 'date-fns';

type Subscriber = {
    id: number;
    userId: number;
    userName: string;
    userEmail: string;
    subscribedAt: string;
};

export default function CompanySubscribers() {
    const { user } = useAuth();
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSubscribers = async () => {
        try {
            const res = await api.get<{ subscribers: Subscriber[] }>('/subscriptions/subscribers');
            setSubscribers(res.data.subscribers);
        } catch (err) {
            console.error('Failed to fetch subscribers:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'company') {
            fetchSubscribers();
        }
    }, [user]);

    if (!user || user.role !== 'company') return null;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted text-sm font-medium uppercase tracking-widest">Loading your followers...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-text uppercase tracking-tight italic">
                    Our <span className="text-primary">Subscribers</span>
                </h3>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full border border-primary/20">
                    {subscribers.length} Talent{subscribers.length !== 1 ? 's' : ''} Following
                </span>
            </div>

            {subscribers.length === 0 ? (
                <div className="bg-secondary/20 border-2 border-dashed border-muted/10 rounded-3xl p-10 text-center space-y-4">
                    <div className="w-16 h-16 bg-muted/5 rounded-full flex items-center justify-center mx-auto text-muted/30">
                        <Users size={32} />
                    </div>
                    <div className="space-y-1">
                        <p className="font-bold text-text">No subscribers yet</p>
                        <p className="text-sm text-muted max-w-[240px] mx-auto">Create compelling job postings to grow your follower base. They'll be notified automatically next time!</p>
                    </div>
                </div>
            ) : (
                <div className="bg-secondary/40 border border-muted/10 rounded-3xl overflow-hidden shadow-xl">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted/5 border-b border-muted/10">
                                <th className="px-6 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Candidate</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Email</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-muted uppercase tracking-[0.2em]">Followed On</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted/5">
                            {subscribers.map((sub) => (
                                <tr key={sub.id} className="hover:bg-primary/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-black">
                                                {sub.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-text">{sub.userName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-muted">
                                            <Mail className="w-3.5 h-3.5" />
                                            {sub.userEmail}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs text-muted/60 font-medium">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {format(new Date(sub.subscribedAt), 'MMM dd, yyyy')}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
