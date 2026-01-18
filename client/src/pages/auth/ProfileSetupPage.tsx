import { useState, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { useAuth } from '../../context/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { AxiosError } from 'axios';

type EducationForm = {
  id?: number;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  description: string;
};

type ExperienceForm = {
  id?: number;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
};

type ProfileData = {
  skills: string[];
  educations: Array<{
    id: number;
    school: string;
    degree: string | null;
    fieldOfStudy: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
  }>;
  experiences: Array<{
    id: number;
    company: string;
    position: string;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
    currentlyWorking: boolean;
    description: string | null;
  }>;
};

const emptyEducation: EducationForm = {
  school: '',
  degree: '',
  fieldOfStudy: '',
  startDate: '',
  endDate: '',
  description: '',
};

const emptyExperience: ExperienceForm = {
  company: '',
  position: '',
  location: '',
  startDate: '',
  endDate: '',
  currentlyWorking: false,
  description: '',
};

export default function ProfileSetupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState('');
  const [educations, setEducations] = useState<EducationForm[]>([]);
  const [experiences, setExperiences] = useState<ExperienceForm[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [validationErrors, setValidationErrors] = useState<{
    educations?: { [key: number]: { [field: string]: string } };
    experiences?: { [key: number]: { [field: string]: string } };
  }>({});

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      if (user.role === 'company') {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await api.get<{ profile: ProfileData }>('/profile');
        const profile = res.data.profile;

        setSkills(profile.skills || []);

        if (profile.educations?.length) {
          setEducations(
            profile.educations.map((edu) => ({
              id: edu.id,
              school: edu.school || '',
              degree: edu.degree || '',
              fieldOfStudy: edu.fieldOfStudy || '',
              startDate: edu.startDate || '',
              endDate: edu.endDate || '',
              description: edu.description || '',
            }))
          );
        }

        if (profile.experiences?.length) {
          setExperiences(
            profile.experiences.map((exp) => ({
              id: exp.id,
              company: exp.company || '',
              position: exp.position || '',
              location: exp.location || '',
              startDate: exp.startDate || '',
              endDate: exp.endDate || '',
              currentlyWorking: !!exp.currentlyWorking,
              description: exp.description || '',
            }))
          );
        }
      } catch (err) {
        if (err instanceof AxiosError && err.response?.status === 401) {
          navigate('/login');
          return;
        }
        setError('Failed to load profile. You can still create a new one.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, navigate]);

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const addSkill = () => {
    const trimmed = currentSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setCurrentSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const addEducation = () => {
    setEducations((prev) => [...prev, { ...emptyEducation }]);
  };

  const removeEducation = (index: number) => {
    setEducations((prev) => prev.filter((_, i) => i !== index));
  };

  const addExperience = () => {
    setExperiences((prev) => [...prev, { ...emptyExperience }]);
  };

  const removeExperience = (index: number) => {
    setExperiences((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEducation = <K extends keyof EducationForm>(
    index: number,
    field: K,
    value: EducationForm[K]
  ) => {
    setEducations((prev) =>
      prev.map((edu, i) => (i === index ? { ...edu, [field]: value } : edu))
    );
    if (validationErrors.educations?.[index]?.[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        educations: {
          ...prev.educations,
          [index]: { ...prev.educations?.[index], [field]: '' },
        },
      }));
    }
  };

  const updateExperience = <K extends keyof ExperienceForm>(
    index: number,
    field: K,
    value: ExperienceForm[K]
  ) => {
    setExperiences((prev) =>
      prev.map((exp, i) => {
        if (i !== index) return exp;
        const updated: ExperienceForm = { ...exp, [field]: value };
        if (field === 'currentlyWorking' && value === true) {
          updated.endDate = '';
        }
        return updated;
      })
    );
    if (validationErrors.experiences?.[index]?.[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        experiences: {
          ...prev.experiences,
          [index]: { ...prev.experiences?.[index], [field]: '' },
        },
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};
    let isValid = true;

    educations.forEach((edu, index) => {
      const eduErrors: { [field: string]: string } = {};
      if (!edu.school.trim()) {
        eduErrors.school = 'School name is required';
        isValid = false;
      }
      if (!edu.degree.trim()) {
        eduErrors.degree = 'Degree is required';
        isValid = false;
      }
      if (Object.keys(eduErrors).length > 0) {
        if (!errors.educations) errors.educations = {};
        errors.educations[index] = eduErrors;
      }
    });

    experiences.forEach((exp, index) => {
      const expErrors: { [field: string]: string } = {};
      if (!exp.company.trim()) {
        expErrors.company = 'Company name is required';
        isValid = false;
      }
      if (!exp.position.trim()) {
        expErrors.position = 'Position is required';
        isValid = false;
      }
      if (Object.keys(expErrors).length > 0) {
        if (!errors.experiences) errors.experiences = {};
        errors.experiences[index] = expErrors;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      setError('Please fix the validation errors before saving.');
      return;
    }

    setSaving(true);

    try {
      await api.put('/profile', {
        skills,
        educations: educations.map((edu) => ({
          id: edu.id,
          school: edu.school,
          degree: edu.degree,
          fieldOfStudy: edu.fieldOfStudy || null,
          startDate: edu.startDate || null,
          endDate: edu.endDate || null,
          description: edu.description || null,
        })),
        experiences: experiences.map((exp) => ({
          id: exp.id,
          company: exp.company,
          position: exp.position,
          location: exp.location || null,
          startDate: exp.startDate || null,
          endDate: exp.currentlyWorking ? null : exp.endDate || null,
          currentlyWorking: exp.currentlyWorking,
          description: exp.description || null,
        })),
      });

      setSuccess(true);
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-text">
          <svg
            className="animate-spin h-5 w-5 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-6xl mb-4">👤</div>
        <p className="text-text mb-4 text-center">
          You need to be signed in to complete your profile.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-accent transition-colors"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  if (user.role === 'company') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/profile')}
            className="text-muted hover:text-primary mb-4 flex items-center gap-1 transition-colors"
          >
            ← Back to Profile
          </button>
          <h1 className="text-3xl font-bold text-text mb-2">Edit Your Profile</h1>
          <p className="text-muted">
            Add your skills, education, and work experience to stand out to employers.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-400">
            <span className="text-xl">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-green-400">
            <span className="text-xl">✓</span>
            <span>Profile saved successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-secondary rounded-xl border border-muted/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <span className="text-xl">✨</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-text">Skills</h2>
                <p className="text-sm text-muted">Add your technical and soft skills</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="skill-input" className="block text-sm font-medium text-text mb-2">
                  Add a Skill
                </label>
                <div className="flex gap-2">
                  <input
                    id="skill-input"
                    type="text"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    className="flex-1 px-4 py-2.5 bg-background border border-muted/50 rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                    placeholder="e.g., JavaScript, Python, Project Management"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-accent transition-colors flex items-center gap-2 font-medium"
                  >
                    <span>+</span> Add
                  </button>
                </div>
                <p className="text-xs text-muted mt-1">Press Enter or click Add to add a skill</p>
              </div>

              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 bg-primary/20 text-primary px-3 py-1.5 rounded-full text-sm font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:bg-primary/30 rounded-full p-0.5 transition-colors"
                        aria-label={`Remove ${skill}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-background/50 rounded-lg border-2 border-dashed border-muted/30">
                  <p className="text-muted text-sm">
                    No skills added yet. Start typing above to add your first skill.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-secondary rounded-xl border border-muted/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <span className="text-xl">🎓</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text">Education</h2>
                  <p className="text-sm text-muted">Add your educational background</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addEducation}
                className="flex items-center gap-1.5 text-primary hover:text-accent font-medium text-sm transition-colors"
              >
                + Add Education
              </button>
            </div>

            {educations.length > 0 ? (
              <div className="space-y-4">
                {educations.map((edu, idx) => (
                  <div
                    key={edu.id ?? `edu-${idx}`}
                    className="relative bg-background p-5 rounded-lg border border-muted/30"
                  >
                    <button
                      type="button"
                      onClick={() => removeEducation(idx)}
                      className="absolute top-3 right-3 p-1.5 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      aria-label="Remove education entry"
                    >
                      ✕
                    </button>

                    <div className="grid gap-4 pr-8">
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">
                          School / University <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Stanford University"
                          className={`w-full px-4 py-2.5 bg-secondary border rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
                            validationErrors.educations?.[idx]?.school
                              ? 'border-red-500'
                              : 'border-muted/50 focus:border-primary'
                          }`}
                          value={edu.school}
                          onChange={(e) => updateEducation(idx, 'school', e.target.value)}
                        />
                        {validationErrors.educations?.[idx]?.school && (
                          <p className="text-red-400 text-xs mt-1">
                            {validationErrors.educations[idx].school}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            Degree <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Bachelor's, Master's"
                            className={`w-full px-4 py-2.5 bg-secondary border rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
                              validationErrors.educations?.[idx]?.degree
                                ? 'border-red-500'
                                : 'border-muted/50 focus:border-primary'
                            }`}
                            value={edu.degree}
                            onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                          />
                          {validationErrors.educations?.[idx]?.degree && (
                            <p className="text-red-400 text-xs mt-1">
                              {validationErrors.educations[idx].degree}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            Field of Study
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Computer Science"
                            className="w-full px-4 py-2.5 bg-secondary border border-muted/50 rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                            value={edu.fieldOfStudy}
                            onChange={(e) => updateEducation(idx, 'fieldOfStudy', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            Start Date
                          </label>
                          <input
                            type="month"
                            className="w-full px-4 py-2.5 bg-secondary border border-muted/50 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                            value={edu.startDate}
                            onChange={(e) => updateEducation(idx, 'startDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            End Date (or Expected)
                          </label>
                          <input
                            type="month"
                            className="w-full px-4 py-2.5 bg-secondary border border-muted/50 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                            value={edu.endDate}
                            onChange={(e) => updateEducation(idx, 'endDate', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-1">
                          Description <span className="text-muted font-normal">(Optional)</span>
                        </label>
                        <textarea
                          placeholder="Describe your achievements, coursework, or activities..."
                          rows={3}
                          className="w-full px-4 py-2.5 bg-secondary border border-muted/50 rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
                          value={edu.description}
                          onChange={(e) => updateEducation(idx, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-background/50 rounded-lg border-2 border-dashed border-muted/30">
                <div className="text-4xl mb-2">🎓</div>
                <p className="text-muted text-sm mb-3">No education entries yet</p>
                <button
                  type="button"
                  onClick={addEducation}
                  className="inline-flex items-center gap-1.5 text-primary hover:text-accent font-medium text-sm"
                >
                  + Add your first education entry
                </button>
              </div>
            )}
          </section>

          <section className="bg-secondary rounded-xl border border-muted/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <span className="text-xl">💼</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text">Work Experience</h2>
                  <p className="text-sm text-muted">Add your professional experience</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addExperience}
                className="flex items-center gap-1.5 text-primary hover:text-accent font-medium text-sm transition-colors"
              >
                + Add Experience
              </button>
            </div>

            {experiences.length > 0 ? (
              <div className="space-y-4">
                {experiences.map((exp, idx) => (
                  <div
                    key={exp.id ?? `exp-${idx}`}
                    className="relative bg-background p-5 rounded-lg border border-muted/30"
                  >
                    <button
                      type="button"
                      onClick={() => removeExperience(idx)}
                      className="absolute top-3 right-3 p-1.5 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      aria-label="Remove experience entry"
                    >
                      ✕
                    </button>

                    <div className="grid gap-4 pr-8">
                      {/* Company */}
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">
                          Company <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Google, Microsoft"
                          className={`w-full px-4 py-2.5 bg-secondary border rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
                            validationErrors.experiences?.[idx]?.company
                              ? 'border-red-500'
                              : 'border-muted/50 focus:border-primary'
                          }`}
                          value={exp.company}
                          onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                        />
                        {validationErrors.experiences?.[idx]?.company && (
                          <p className="text-red-400 text-xs mt-1">
                            {validationErrors.experiences[idx].company}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            Position <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Software Engineer"
                            className={`w-full px-4 py-2.5 bg-secondary border rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
                              validationErrors.experiences?.[idx]?.position
                                ? 'border-red-500'
                                : 'border-muted/50 focus:border-primary'
                            }`}
                            value={exp.position}
                            onChange={(e) => updateExperience(idx, 'position', e.target.value)}
                          />
                          {validationErrors.experiences?.[idx]?.position && (
                            <p className="text-red-400 text-xs mt-1">
                              {validationErrors.experiences[idx].position}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            Location <span className="text-muted font-normal">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., San Francisco, CA"
                            className="w-full px-4 py-2.5 bg-secondary border border-muted/50 rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                            value={exp.location}
                            onChange={(e) => updateExperience(idx, 'location', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exp.currentlyWorking}
                            onChange={(e) =>
                              updateExperience(idx, 'currentlyWorking', e.target.checked)
                            }
                            className="w-4 h-4 text-primary bg-secondary border-muted rounded focus:ring-primary/50 focus:ring-2"
                          />
                          <span className="ml-2 text-sm text-text">I currently work here</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            Start Date
                          </label>
                          <input
                            type="month"
                            className="w-full px-4 py-2.5 bg-secondary border border-muted/50 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                            value={exp.startDate}
                            onChange={(e) => updateExperience(idx, 'startDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            End Date
                          </label>
                          <input
                            type="month"
                            className="w-full px-4 py-2.5 bg-secondary border border-muted/50 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            value={exp.endDate}
                            onChange={(e) => updateExperience(idx, 'endDate', e.target.value)}
                            disabled={exp.currentlyWorking}
                          />
                          {exp.currentlyWorking && (
                            <p className="text-xs text-muted mt-1">Present</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-1">
                          Description <span className="text-muted font-normal">(Optional)</span>
                        </label>
                        <textarea
                          placeholder="Describe your responsibilities and achievements..."
                          rows={3}
                          className="w-full px-4 py-2.5 bg-secondary border border-muted/50 rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
                          value={exp.description}
                          onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-background/50 rounded-lg border-2 border-dashed border-muted/30">
                <div className="text-4xl mb-2">💼</div>
                <p className="text-muted text-sm mb-3">No work experience added yet</p>
                <button
                  type="button"
                  onClick={addExperience}
                  className="inline-flex items-center gap-1.5 text-primary hover:text-accent font-medium text-sm"
                >
                  + Add your first work experience
                </button>
              </div>
            )}
          </section>

          <div className="flex items-center justify-between pt-4 border-t border-muted/30">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-6 py-3 text-muted hover:text-text font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                <>💾 Save Profile</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
