import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle, Trash2, Plus } from 'lucide-react';

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
    const [newVersionName, setNewVersionName] = useState('');
    const [newResumeText, setNewResumeText] = useState('');

    const fetchResumes = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5050/api/jobs/resumes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResumes(response.data.resumes);
        } catch (error) {
            console.error('Error fetching resumes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newResumeText.trim()) return;

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5050/api/jobs/resumes', {
                versionName: newVersionName || 'Main Resume',
                searchText: newResumeText,
                isMain: resumes.length === 0 // Make main if it's the first one
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewVersionName('');
            setNewResumeText('');
            fetchResumes();
        } catch (error) {
            console.error('Error uploading resume:', error);
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        fetchResumes();
    }, []);

    if (loading) return <div className="animate-pulse h-40 bg-white/5 rounded-xl"></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    My Resumes
                </h3>
            </div>

            {/* List existing resumes */}
            <div className="grid gap-4">
                {resumes.map((resume) => (
                    <div key={resume.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white">{resume.versionName}</h4>
                                <p className="text-sm text-gray-400">
                                    Added {new Date(resume.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {resume.isMain && (
                                <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                                    <CheckCircle className="w-3 h-3" />
                                    Main
                                </span>
                            )}
                            <button className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}

                {resumes.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-xl">
                        <p className="text-gray-400">No resumes uploaded yet.</p>
                    </div>
                )}
            </div>

            {/* Upload New Section */}
            <form onSubmit={handleUpload} className="bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold mb-2">
                    <Plus className="w-5 h-5" />
                    Upload New Resume
                </div>
                <div>
                    <input
                        type="text"
                        placeholder="Version Name (e.g., Software Dev Resume)"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-primary transition-colors"
                        value={newVersionName}
                        onChange={(e) => setNewVersionName(e.target.value)}
                    />
                </div>
                <div>
                    <textarea
                        placeholder="Paste your resume text here (for full-text search indexing)..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors min-h-[150px] text-sm"
                        value={newResumeText}
                        onChange={(e) => setNewResumeText(e.target.value)}
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-primary hover:bg-accent disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                    <Upload className="w-5 h-5" />
                    {uploading ? 'Uploading...' : 'Upload Resume'}
                </button>
            </form>
        </div>
    );
};

export default ResumeManager;
