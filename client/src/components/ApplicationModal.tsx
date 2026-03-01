import React, { useState } from 'react';
import { X, Send, Loader2, FileText, Link as LinkIcon, AlertCircle } from 'lucide-react';
import api from '../lib/api';

interface Job {
    id: number;
    title: string;
    companyName?: string;
}

interface ApplicationModalProps {
    job: Job;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (jobId: number) => void;
}

export default function ApplicationModal({ job, isOpen, onClose, onSuccess }: ApplicationModalProps) {
    const [coverLetter, setCoverLetter] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.post(`/jobs/${job.id}/apply`, {
                coverLetter,
                resumeUrl
            });
            onSuccess(job.id);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to submit application. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-secondary/95 backdrop-blur-2xl border border-muted/20 rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 space-y-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black text-text tracking-tighter">Apply for <span className="text-primary">{job.title}</span></h2>
                            <p className="text-muted font-bold text-lg">{job.companyName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted/10 rounded-full transition-colors text-muted hover:text-text"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 font-medium">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted">
                                <FileText size={16} />
                                Cover Letter
                            </label>
                            <textarea
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                                placeholder="Tell us why you're a great fit (optional)..."
                                className="w-full h-40 px-6 py-4 bg-background/50 border border-muted/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-text font-medium resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted">
                                <LinkIcon size={16} />
                                Resume URL
                            </label>
                            <input
                                type="url"
                                value={resumeUrl}
                                onChange={(e) => setResumeUrl(e.target.value)}
                                placeholder="Link to your portfolio or hosted resume..."
                                className="w-full px-6 py-4 bg-background/50 border border-muted/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-text font-medium"
                            />
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-8 py-4 font-black text-muted hover:text-text transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-8 py-4 bg-primary text-white font-black rounded-2xl hover:bg-accent hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-2xl shadow-primary/20 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <Send size={20} />
                                        Submit
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
