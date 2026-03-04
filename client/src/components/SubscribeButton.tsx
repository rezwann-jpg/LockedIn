// src/components/SubscribeButton.tsx
import { useState, useEffect } from 'react';
import { BellPlus, BellOff, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/useAuth';

interface SubscribeButtonProps {
    companyId: number;
    companyName?: string;
    className?: string;
}

export default function SubscribeButton({ companyId, companyName, className = '' }: SubscribeButtonProps) {
    const { user } = useAuth();
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    // Check subscription status on mount
    useEffect(() => {
        if (!user || user.role !== 'job_seeker') {
            setLoading(false);
            return;
        }

        const checkSub = async () => {
            try {
                const res = await api.get<{ subscribed: boolean }>(
                    `/subscriptions/check/${companyId}`
                );
                setSubscribed(res.data.subscribed);
            } catch {
                // ignore — default to unsubscribed
            } finally {
                setLoading(false);
            }
        };

        checkSub();
    }, [companyId, user]);

    // Don't render for non-job-seekers
    if (!user || user.role !== 'job_seeker') return null;

    const handleToggle = async () => {
        if (toggling) return;
        setToggling(true);
        try {
            if (subscribed) {
                await api.delete(`/subscriptions/companies/${companyId}`);
                setSubscribed(false);
            } else {
                await api.post(`/subscriptions/companies/${companyId}`);
                setSubscribed(true);
            }
        } catch (err) {
            console.error('Error toggling subscription:', err);
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return (
            <button
                disabled
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-muted/20 text-muted text-sm font-medium cursor-not-allowed opacity-60 ${className}`}
            >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking...</span>
            </button>
        );
    }

    return (
        <button
            id={`subscribe-btn-${companyId}`}
            onClick={handleToggle}
            disabled={toggling}
            title={
                subscribed
                    ? `Unsubscribe from ${companyName || 'this company'}`
                    : `Subscribe to ${companyName || 'this company'} for job alerts`
            }
            className={`
                flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold
                transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed
                ${subscribed
                    ? 'bg-primary/10 border-primary/30 text-primary hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                    : 'bg-transparent border-muted/30 text-muted hover:bg-primary/10 hover:border-primary/30 hover:text-primary'
                }
                ${className}
            `}
        >
            {toggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : subscribed ? (
                <BellOff className="w-4 h-4" />
            ) : (
                <BellPlus className="w-4 h-4" />
            )}
            <span>{subscribed ? 'Subscribed' : 'Subscribe'}</span>
        </button>
    );
}
