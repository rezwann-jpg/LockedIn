import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Mail, Calendar, FileText, CheckCircle, XCircle, Clock, Loader2, Users, Search, Target } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Applicant {
    id: number;
    status: string;
    appliedAt: string;
    userName: string;
    userEmail: string;
    coverLetter: string | null;
    resumeUrl: string | null;
    resumeId?: number;
    resumeVersion?: string;
    searchHighlight?: string;
}

interface JobApplicantsListProps {
    jobId: number;
    jobTitle: string;
    onClose: () => void;
}

const statusColors: Record<string, string> = {
    applied: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    reviewed: 'bg-primary/10 text-primary border-primary/20',
    interviewing: 'bg-accent/10 text-accent border-accent/20',
    offered: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
    hired: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20',
};

export default function JobApplicantsList({ jobId, jobTitle, onClose }: JobApplicantsListProps) {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [keyword, setKeyword] = useState('');

    const fetchApplicants = async () => {
        try {
            setLoading(true);
            const res = await api.get<{ applicants: Applicant[] }>(`/jobs/${jobId}/applicants`, {
                params: { keyword: keyword || undefined }
            });
            setApplicants(res.data.applicants);
        } catch (err) {
            console.error('Failed to fetch applicants:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchApplicants();
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [jobId, keyword]);

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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-background shadow-2xl h-full border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-500">
                <header className="p-8 border-b border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight">Applicants</h2>
                            <p className="text-gray-500 font-bold text-lg mt-1">For <span className="text-primary">{jobTitle}</span></p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white">
                            <XCircle size={32} />
                        </button>
                    </div>

                    {/* FTS Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search in resumes (e.g. 'React', 'NodeJS', 'Expert')..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-primary focus:bg-white/10 transition-all font-medium"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                        {applicants.length > 0 && keyword && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded">
                                {applicants.length} Found
                            </div>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {loading && applicants.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <Loader2 className="animate-spin h-10 w-10 text-primary" />
                            <p className="text-gray-500 font-bold">Scanning resumes...</p>
                        </div>
                    ) : applicants.length > 0 ? (
                        applicants.map(app => (
                            <div key={app.id} className="bg-white/5 rounded-[32px] border border-white/10 p-6 space-y-6 group hover:border-primary/20 transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-xl">
                                            {app.userName.charAt(0)}
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-white">{app.userName}</h3>
                                            <div className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                                                <Mail size={14} />
                                                {app.userEmail}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[app.status] || statusColors.applied}`}>
                                        {app.status}
                                    </div>
                                </div>

                                {app.searchHighlight ? (
                                    <div className="space-y-2 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <Target size={12} /> Resume Match
                                        </div>
                                        <p
                                            className="text-gray-300 text-sm italic"
                                            dangerouslySetInnerHTML={{ __html: `...${app.searchHighlight}...` }}
                                        />
                                    </div>
                                ) : app.coverLetter && (
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                            <FileText size={12} /> Cover Letter
                                        </div>
                                        <p className="text-gray-400 text-sm leading-relaxed bg-black/20 p-4 rounded-2xl border border-white/5">
                                            {app.coverLetter}
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                    <div className="flex gap-4">
                                        {app.resumeId && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-xs font-bold text-white border border-white/5">
                                                <FileText size={14} className="text-primary" />
                                                {app.resumeVersion || 'CV'}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-black uppercase tracking-widest">
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
                                            className="p-2 text-accent hover:bg-accent/10 rounded-xl transition-colors disabled:opacity-50"
                                            title="Interview"
                                        >
                                            <Clock size={24} />
                                        </button>
                                        <button
                                            disabled={updatingId === app.id}
                                            onClick={() => handleUpdateStatus(app.id, 'offered')}
                                            className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors disabled:opacity-50"
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
                            <Users size={48} className="text-gray-800" />
                            <p className="text-gray-500 font-bold">
                                {keyword ? `No applicants matching "${keyword}"` : 'No applicants yet for this position.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
