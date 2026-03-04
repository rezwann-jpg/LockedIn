// src/components/MySubscriptions.tsx
import { useState, useEffect } from 'react';
import { Building2, X, BellOff, Loader2, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';

type Subscription = {
    id: number;
    companyId: number;
    companyName: string;
    companyLogo: string | null;
    companyIndustry: string | null;
    subscribedAt: string;
};

export default function MySubscriptions() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [unsubscribingId, setUnsubscribingId] = useState<number | null>(null);

    const fetchSubscriptions = async () => {
        try {
            const res = await api.get<{ subscriptions: Subscription[] }>('/subscriptions/companies');
            setSubscriptions(res.data.subscriptions);
        } catch (err) {
            console.error('Failed to fetch subscriptions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'job_seeker') {
            fetchSubscriptions();
        }
    }, [user]);

    const handleUnsubscribe = async (companyId: number) => {
        setUnsubscribingId(companyId);
        try {
            await api.delete(`/subscriptions/companies/${companyId}`);
            setSubscriptions(prev => prev.filter(s => s.companyId !== companyId));
        } catch (err) {
            console.error('Failed to unsubscribe:', err);
        } finally {
            setUnsubscribingId(null);
        }
    };

    if (!user || user.role !== 'job_seeker') return null;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted text-sm font-medium uppercase tracking-widest">Loading your subscriptions...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-text uppercase tracking-tight italic">
                    My <span className="text-primary">Subscribed</span> Companies
                </h3>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full border border-primary/20">
                    {subscriptions.length} Following
                </span>
            </div>

            {subscriptions.length === 0 ? (
                <div className="bg-secondary/20 border-2 border-dashed border-muted/10 rounded-3xl p-10 text-center space-y-4">
                    <div className="w-16 h-16 bg-muted/5 rounded-full flex items-center justify-center mx-auto text-muted/30">
                        <Building2 size={32} />
                    </div>
                    <div className="space-y-1">
                        <p className="font-bold text-text">No subscriptions yet</p>
                        <p className="text-sm text-muted max-w-[240px] mx-auto">Subscribe to companies to get notified whenever they post new jobs.</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-3">
                    {subscriptions.map((sub) => (
                        <div
                            key={sub.id}
                            className="group bg-secondary/40 border border-muted/10 rounded-2xl p-4 flex items-center justify-between hover:border-primary/30 transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-background border border-muted/10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                                    {sub.companyLogo ? (
                                        <img src={sub.companyLogo} alt={sub.companyName} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-lg font-black text-primary">{(sub.companyName || 'C').charAt(0)}</span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-text truncate group-hover:text-primary transition-colors">{sub.companyName}</h4>
                                    <p className="text-xs text-muted truncate">{sub.companyIndustry || 'Industry not specified'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleUnsubscribe(sub.companyId)}
                                    disabled={unsubscribingId === sub.companyId}
                                    className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                    title="Unsubscribe"
                                >
                                    {unsubscribingId === sub.companyId ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <BellOff className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={() => navigate(`/jobs?search=${encodeURIComponent(sub.companyName)}`)}
                                    className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                                    title="View Jobs"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
