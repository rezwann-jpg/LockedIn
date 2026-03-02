import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Send, FileCheck, AlertCircle } from 'lucide-react';

interface Resume {
    id: number;
    versionName: string;
    isMain: boolean;
}

interface ApplicationModalProps {
    jobId: number;
    jobTitle: string;
    onClose: () => void;
    onSuccess: () => void;
}

const ApplicationModal: React.FC<ApplicationModalProps> = ({ jobId, jobTitle, onClose, onSuccess }) => {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5050/api/jobs/resumes', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setResumes(response.data.resumes);
                const main = response.data.resumes.find((r: Resume) => r.isMain);
                if (main) setSelectedResumeId(main.id);
            } catch (err) {
                console.error('Error fetching resumes:', err);
            }
        };
        fetchResumes();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        console.log('Applying for jobId:', jobId);

        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5050/api/jobs/${jobId}/apply`, {
                resumeId: selectedResumeId,
                coverLetter
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to submit application. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-background border border-white/10 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div>
                        <h3 className="text-xl font-bold text-white">Apply for Role</h3>
                        <p className="text-primary text-sm font-medium uppercase tracking-wider">{jobTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-gray-300">Select Resume</label>
                        <div className="grid gap-3">
                            {resumes.map((resume) => (
                                <div
                                    key={resume.id}
                                    onClick={() => setSelectedResumeId(resume.id)}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${selectedResumeId === resume.id
                                        ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10'
                                        : 'bg-white/5 border-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedResumeId === resume.id ? 'bg-primary' : 'bg-white/10'}`}>
                                            <FileCheck className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="font-medium text-white">{resume.versionName}</span>
                                    </div>
                                    {resume.isMain && <span className="text-[10px] bg-white/10 text-gray-400 px-2 py-1 rounded-full uppercase">Main</span>}
                                </div>
                            ))}
                            {resumes.length === 0 && (
                                <div className="text-sm text-gray-400 bg-white/5 p-4 rounded-xl border border-dashed border-white/10">
                                    No resumes found. Please add a resume in your profile first.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-300">Cover Letter (Optional)</label>
                        <textarea
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-primary transition-colors min-h-[150px] text-sm"
                            placeholder="Tell the hiring manager why you're a great fit..."
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-2xl text-white font-bold border border-white/10 hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || (resumes.length > 0 && !selectedResumeId)}
                            className="flex-[2] bg-primary hover:bg-accent disabled:opacity-50 px-6 py-4 rounded-2xl text-white font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            <Send className="w-5 h-5" />
                            {submitting ? 'Submitting...' : 'Send Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApplicationModal;
