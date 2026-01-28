import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { ArrowLeft, Loader2, Info, X } from 'lucide-react';
import { AxiosError } from 'axios';

export default function PostJobPage() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        jobType: 'full_time',
        location: '',
        remote: false,
        salaryMin: '',
        salaryMax: '',
        description: '',
        requirements: '',
        responsibilities: '',
        categoryId: '',
        skills: [] as string[],
    });

    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

    const [currentSkill, setCurrentSkill] = useState('');
    const [suggestedSkills, setSuggestedSkills] = useState<{ id: number; name: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addSkill = () => {
        const trimmed = currentSkill.trim();
        if (trimmed && !formData.skills.includes(trimmed)) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, trimmed]
            }));
            setCurrentSkill('');
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s !== skillToRemove)
        }));
    };

    const handleSkillKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    };

    useEffect(() => {
        const fetchSuggestions = async () => {
            const trimmed = currentSkill.trim();
            if (trimmed.length < 2) {
                setSuggestedSkills([]);
                return;
            }
            try {
                const res = await api.get<{ skills: { id: number; name: string }[] }>(`/skills?search=${trimmed}`);
                setSuggestedSkills(res.data.skills);
            } catch (err) {
                console.error('Failed to fetch skill suggestions:', err);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [currentSkill]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get<{ categories: { id: number; name: string }[] }>('/categories');
                setCategories(res.data.categories);
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Basic validation
        if (!formData.title || !formData.description) {
            setError('Please fill in all required fields.');
            setIsSubmitting(false);
            return;
        }

        try {
            await api.post('/company/jobs', {
                ...formData,
                categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
                salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
                salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null,
                remote: formData.remote
            });
            navigate('/employer/dashboard');
        } catch (err) {
            console.error(err);
            if (err instanceof AxiosError) {
                setError(err.response?.data?.error || 'Failed to post job. Please try again.');
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-10 px-4">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-muted hover:text-text transition-colors mb-6"
                >
                    <ArrowLeft size={18} />
                    <span>Back to Dashboard</span>
                </button>

                <div className="bg-secondary rounded-xl border border-muted/30 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-muted/30">
                        <h1 className="text-2xl font-bold text-text">Post a New Job</h1>
                        <p className="text-muted mt-1">Reach thousands of job seekers by creating a detailed job listing.</p>
                    </div>

                    {error && (
                        <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-3">
                            <Info size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-text border-l-4 border-primary pl-3">Basic Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-muted mb-1.5">Job Title <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g. Senior Frontend Engineer"
                                        className="w-full px-4 py-2.5 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted mb-1.5">Job Type</label>
                                    <select
                                        name="jobType"
                                        value={formData.jobType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                                    >
                                        <option value="full_time">Full Time</option>
                                        <option value="part_time">Part Time</option>
                                        <option value="contract">Contract</option>
                                        <option value="internship">Internship</option>
                                        <option value="freelance">Freelance</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted mb-1.5">Job Category <span className="text-red-400">*</span></label>
                                    <select
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted mb-1.5">Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="e.g. San Francisco, CA"
                                        className="w-full px-4 py-2.5 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Compensation */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-text border-l-4 border-primary pl-3">Compensation</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted mb-1.5">Min Salary</label>
                                    <input
                                        type="number"
                                        name="salaryMin"
                                        value={formData.salaryMin}
                                        onChange={handleChange}
                                        placeholder="e.g. 100000"
                                        className="w-full px-4 py-2.5 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted mb-1.5">Max Salary</label>
                                    <input
                                        type="number"
                                        name="salaryMax"
                                        value={formData.salaryMax}
                                        onChange={handleChange}
                                        placeholder="e.g. 150000"
                                        className="w-full px-4 py-2.5 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-text border-l-4 border-primary pl-3">Job Details</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted mb-1.5">Description <span className="text-red-400">*</span></label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                        placeholder="Describe the role and the team..."
                                        className="w-full px-4 py-2.5 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text resize-y"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted mb-1.5">Requirements</label>
                                    <textarea
                                        name="requirements"
                                        value={formData.requirements}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="What skills are required?"
                                        className="w-full px-4 py-2.5 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text resize-y"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted mb-1.5">Responsibilities</label>
                                    <textarea
                                        name="responsibilities"
                                        value={formData.responsibilities}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="What will the candidate do?"
                                        className="w-full px-4 py-2.5 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text resize-y"
                                    />
                                </div>
                            </div>

                            {/* Skills Section */}
                            <div className="space-y-4 pt-4">
                                <h3 className="text-lg font-semibold text-text border-l-4 border-primary pl-3">Required Skills</h3>
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={currentSkill}
                                            onChange={(e) => setCurrentSkill(e.target.value)}
                                            onKeyDown={handleSkillKeyDown}
                                            onFocus={() => setShowSuggestions(true)}
                                            placeholder="Add a skill (e.g. React, Python)"
                                            className="flex-1 px-4 py-2.5 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text"
                                        />
                                        <button
                                            type="button"
                                            onClick={addSkill}
                                            className="px-4 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors font-medium"
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {showSuggestions && suggestedSkills.length > 0 && (
                                        <div className="relative">
                                            <div className="absolute top-0 w-full z-10 bg-background border border-muted/50 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                                {suggestedSkills.filter(s => !formData.skills.includes(s.name)).map(skill => (
                                                    <button
                                                        key={skill.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, skills: [...prev.skills, skill.name] }));
                                                            setCurrentSkill('');
                                                            setShowSuggestions(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2 hover:bg-primary/10 text-text transition-colors border-b border-muted/10 last:border-0"
                                                    >
                                                        {skill.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-background/50 rounded-lg border border-dashed border-muted/50">
                                        {formData.skills.length > 0 ? (
                                            formData.skills.map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-medium border border-primary/20"
                                                >
                                                    {skill}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSkill(skill)}
                                                        className="text-primary/60 hover:text-primary transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-muted text-sm italic">No skills added yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-muted/30 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-2.5 border border-muted text-muted hover:bg-background/50 hover:text-text rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-accent transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Publishing...
                                    </>
                                ) : 'Publish Job'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
