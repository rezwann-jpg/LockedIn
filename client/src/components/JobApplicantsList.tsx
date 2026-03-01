import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Mail, Calendar, FileText, CheckCircle, XCircle, Clock, Loader2, Link as LinkIcon, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Applicant {
    id: number;
    status: string;
    appliedAt: string;
    userName: string;
    userEmail: string;
    coverLetter: string | null;
    resumeUrl: string | null;
}

interface JobApplicantsListProps {
    jobId: number;
    jobTitle: string;
    onClose: () => void;
}

export default function JobApplicantsList({ jobId, jobTitle, onClose }: JobApplicantsListProps) {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const fetchApplicants = async () => {
        try {
            const res = await api.get<{ applicants: Applicant[] }>(`/jobs/${jobId}/applicants`);
            setApplicants(res.data.applicants);
        } catch (err) {
            console.error('Failed to fetch applicants:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplicants();
    }, [jobId]);

    const handleUpdateStatus = async (appId: number, newStatus: string) => {
        setUpdatingId(appId);
        try {
            await api.patch(`/jobs/applications/${appId}`, { status: newStatus });
            setApplicants(prev => prev.map(app =>
                app.id === appId ? { ...app, status: newStatus } : app
            ));
        } catch (err) {
            console.error('Failed to update status:', err);
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-secondary shadow-2xl h-full border-l border-muted/20 flex flex-col animate-in slide-in-from-right duration-500">
                <header className="p-8 border-b border-muted/10 space-y-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-black text-text tracking-tight">Applicants</h2>
                        <button onClick={onClose} className="p-2 hover:bg-muted/10 rounded-full transition-colors text-muted hover:text-text">
                            <XCircle size={28} />
                        </button>
                    </div>
                    <p className="text-muted font-bold text-lg">For <span className="text-primary">{jobTitle}</span></p>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <Loader2 className="animate-spin h-10 w-10 text-primary" />
                            <p className="text-muted font-bold">Fetching talent...</p>
                        </div>
                    ) : applicants.length > 0 ? (
                        applicants.map(app => (
                            <div key={app.id} className="bg-background/50 rounded-[32px] border border-muted/10 p-6 space-y-6 group hover:border-primary/20 transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-xl">
                                            {app.userName.charAt(0)}
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-text">{app.userName}</h3>
                                            <div className="flex items-center gap-2 text-muted font-bold text-sm">
                                                <Mail size={14} />
                                                {app.userEmail}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${app.status === 'offered' ? 'bg-emerald-500/10 text-emerald-500' :
                                        app.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                            'bg-blue-500/10 text-blue-500'
                                        }`}>
                                        {app.status}
                                    </div>
                                </div>

                                {app.coverLetter && (
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                                            <FileText size={12} /> Cover Letter
                                        </div>
                                        <p className="text-text/80 text-sm leading-relaxed bg-background/30 p-4 rounded-2xl border border-muted/5">
                                            {app.coverLetter}
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                    <div className="flex gap-4">
                                        {app.resumeUrl && (
                                            <a
                                                href={app.resumeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl text-xs font-bold text-text hover:bg-muted/10 transition-colors border border-muted/10"
                                            >
                                                <LinkIcon size={14} className="text-primary" />
                                                View Resume
                                            </a>
                                        )}
                                        <div className="flex items-center gap-2 text-[10px] text-muted font-black uppercase tracking-widest">
                                            <Calendar size={14} />
                                            {formatDistanceToNow(new Date(app.appliedAt))} ago
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            disabled={updatingId === app.id}
                                            onClick={() => handleUpdateStatus(app.id, 'rejected')}
                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
                                            title="Reject"
                                        >
                                            <XCircle size={24} />
                                        </button>
                                        <button
                                            disabled={updatingId === app.id}
                                            onClick={() => handleUpdateStatus(app.id, 'interviewing')}
                                            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors disabled:opacity-50"
                                            title="Interview"
                                        >
                                            <Clock size={24} />
                                        </button>
                                        <button
                                            disabled={updatingId === app.id}
                                            onClick={() => handleUpdateStatus(app.id, 'offered')}
                                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors disabled:opacity-50"
                                            title="Offer"
                                        >
                                            <CheckCircle size={24} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                            <Users size={48} className="text-muted/20" />
                            <p className="text-muted font-bold">No applicants yet for this position.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
