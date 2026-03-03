import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { AxiosError } from 'axios';
import { Upload, FileText, CheckCircle, Trash2, Plus, AlertCircle, Loader2 } from 'lucide-react';

interface Resume {
    id: number;
    versionName: string;
    isMain: boolean;
    createdAt: string;
}

const ResumeManager: React.FC = () => {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [newVersionName, setNewVersionName] = useState('');
    const [newResumeText, setNewResumeText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    const fetchResumes = async () => {
        setError(null);
        try {
            const response = await api.get<{ resumes: Resume[] }>('/jobs/resumes');
            setResumes(response.data.resumes);
        } catch (err) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.error || 'Failed to load resumes. Please try again.');
            } else {
                setError('Failed to load resumes.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newResumeText.trim()) return;
        setUploadError(null);
        setUploading(true);
        try {
            await api.post('/jobs/resumes', {
                versionName: newVersionName.trim() || 'Main Resume',
                searchText: newResumeText,
                isMain: resumes.length === 0
            });
            setNewVersionName('');
            setNewResumeText('');
            setShowForm(false);
            fetchResumes();
        } catch (err) {
            if (err instanceof AxiosError) {
                setUploadError(err.response?.data?.error || 'Failed to upload resume. Please try again.');
            } else {
                setUploadError('Failed to upload resume.');
            }
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        setDeleting(id);
        try {
            await api.delete(`/jobs/resumes/${id}`);
            setResumes(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error('Failed to delete resume:', err);
        } finally {
            setDeleting(null);
        }
    };

    useEffect(() => {
        fetchResumes();
    }, []);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center gap-3 text-muted">
                <Loader2 className="animate-spin w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Loading resumes...</span>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Resume list */}
            <div className="grid gap-3">
                {resumes.length === 0 && !error && (
                    <div className="text-center py-10 border-2 border-dashed border-muted/20 rounded-2xl">
                        <FileText className="mx-auto text-muted/30 mb-3" size={36} />
                        <p className="text-muted text-sm font-medium">No resumes uploaded yet.</p>
                        <p className="text-muted/60 text-xs mt-1">Upload your first resume to apply for jobs quickly.</p>
                    </div>
                )}
                {resumes.map((resume) => (
                    <div
                        key={resume.id}
                        className="flex items-center gap-4 p-4 bg-background/60 border border-muted/15 rounded-2xl hover:border-primary/30 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-text text-sm truncate">{resume.versionName}</h4>
                            <p className="text-xs text-muted mt-0.5">
                                Added {new Date(resume.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {resume.isMain && (
                                <span className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full">
                                    <CheckCircle className="w-3 h-3" />
                                    Main
                                </span>
                            )}
                            <button
                                onClick={() => handleDelete(resume.id)}
                                disabled={deleting === resume.id}
                                className="p-2 text-muted/50 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            >
                                {deleting === resume.id
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Trash2 className="w-4 h-4" />
                                }
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toggle upload form */}
            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full py-3 border-2 border-dashed border-primary/30 text-primary text-sm font-bold rounded-2xl hover:bg-primary/5 hover:border-primary/60 transition-all flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Resume
                </button>
            ) : (
                <form onSubmit={handleUpload} className="bg-primary/5 border border-primary/20 p-6 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                            <Upload className="w-4 h-4" />
                            Upload New Resume
                        </div>
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); setUploadError(null); }}
                            className="text-muted hover:text-text text-xs"
                        >
                            Cancel
                        </button>
                    </div>

                    {uploadError && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {uploadError}
                        </div>
                    )}

                    <input
                        type="text"
                        placeholder="Version name (e.g. Software Dev Resume)"
                        className="w-full bg-background border border-muted/30 rounded-xl px-4 py-2.5 text-text text-sm outline-none focus:border-primary transition-colors placeholder:text-muted/50"
                        value={newVersionName}
                        onChange={(e) => setNewVersionName(e.target.value)}
                    />
                    <textarea
                        placeholder="Paste your resume text here (used for full-text search matching)..."
                        className="w-full bg-background border border-muted/30 rounded-xl px-4 py-3 text-text text-sm outline-none focus:border-primary transition-colors min-h-[140px] resize-none placeholder:text-muted/50"
                        value={newResumeText}
                        onChange={(e) => setNewResumeText(e.target.value)}
                        required
                    />
                    <button
                        type="submit"
                        disabled={uploading || !newResumeText.trim()}
                        className="w-full bg-primary hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Uploading...' : 'Save Resume'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default ResumeManager;
