import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, ChevronRight, ExternalLink, Loader, MapPin, DollarSign, Briefcase, CheckCircle2, Plus } from 'lucide-react';
import { TagsInput } from "react-tag-input-component";

interface JobResult {
  company: string;
  title: string;
  match: string;
  salary: string;
  remote: string;
}

interface AIJobSearchProps {
  onSaveJob?: (job: JobResult) => void;
  isAdmin?: boolean;
}

export function AIJobSearch({ onSaveJob, isAdmin = false }: AIJobSearchProps) {
  const [skills, setSkills] = useState<string[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'junior' | 'mid' | 'senior'>('mid');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<JobResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!skills.length && !jobTitle && !location) {
      setError('Please enter at least one search criteria');
      return;
    }

    setIsSearching(true);
    setError('');
    setHasSearched(true);

    try {
      const response = await fetch('/api/ai/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: skills.join(', '),
          company_preference: location || 'Any',
          job_type: 'Full-time',
          experience_level: experienceLevel,
        }),
      });

      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError('Failed to search for jobs. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setSkills([]);
    setJobTitle('');
    setLocation('');
    setExperienceLevel('mid');
    setResults([]);
    setHasSearched(false);
    setError('');
  };

  return (
    <motion.div
      key="ai-job-search-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto pb-20"
    >
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-3 px-6 py-3 bg-indigo-50 rounded-2xl border border-indigo-200 mb-6"
        >
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-black text-indigo-600 uppercase tracking-widest">AI-Powered Discovery</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-5xl md:text-6xl font-black text-slate-900 mb-4 leading-tight"
        >
          Discover Jobs <br />
          <span className="text-indigo-600">Tailored to You</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-slate-500 font-medium max-w-2xl mx-auto"
        >
          Let AI find the perfect opportunities based on your skills, experience, and preferences
        </motion.p>
      </div>

      {/* Search Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/50 p-8 md:p-12 mb-12"
      >
        <form onSubmit={handleSearch} className="space-y-8">
          {/* Skills Input */}
          <div>
            <label className="block text-sm font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-xs font-black text-indigo-600">1</span>
              </div>
              Your Skills
            </label>
            <div className="modern-tag-input">
              <TagsInput
                value={skills}
                onChange={setSkills}
                name="skills"
                placeHolder="Add skills like 'React', 'Python', 'DevOps'..."
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">Add skills you want to use in your next role</p>
          </div>

          {/* Grid Layout for remaining fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Job Title */}
            <div>
              <label className="block text-sm font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-black text-indigo-600">2</span>
                </div>
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Frontend Engineer"
                className="form-input"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-black text-indigo-600">3</span>
                </div>
                Location/Company
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Remote, San Francisco, or company"
                className="form-input"
              />
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-black text-indigo-600">4</span>
                </div>
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as any)}
                className="form-select"
              >
                <option value="junior">Junior (0-2 years)</option>
                <option value="mid">Mid-level (2-5 years)</option>
                <option value="senior">Senior (5+ years)</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-bold"
            >
              ⚠️ {error}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSearching}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 active:scale-95"
            >
              {isSearching ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Find Jobs
                </>
              )}
            </button>
            {hasSearched && (
              <button
                type="button"
                onClick={handleClear}
                className="px-8 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {!hasSearched ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-indigo-300" />
            </div>
            <p className="text-slate-400 text-lg font-bold">Fill in your preferences and click "Find Jobs" to get started</p>
          </motion.div>
        ) : isSearching ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-6"
            />
            <p className="text-slate-400 text-lg font-bold">Finding your perfect opportunities...</p>
          </motion.div>
        ) : results.length > 0 ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900 mb-2">
                Found <span className="text-indigo-600">{results.length} Opportunities</span>
              </h2>
              <p className="text-slate-500 font-medium">AI-generated recommendations based on your profile</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((job, index) => (
                <motion.div
                  key={`${job.company}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card-elegant group relative overflow-hidden"
                >
                  {/* Match Badge */}
                  <div className="absolute top-4 right-4">
                    <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-black text-emerald-700 uppercase tracking-widest">
                      {job.match}% match
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Header */}
                    <div>
                      <h3 className="text-xl font-black text-slate-900 mb-1 pr-24">{job.title}</h3>
                      <p className="text-sm text-indigo-600 font-bold uppercase tracking-widest">at {job.company}</p>
                    </div>

                    {/* Details */}
                    <div className="space-y-3 py-4 border-t border-b border-slate-100">
                      <div className="flex items-center gap-3 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-300" />
                        <span className="text-sm font-bold">{job.remote}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <DollarSign className="w-4 h-4 text-slate-300" />
                        <span className="text-sm font-bold">{job.salary}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    {isAdmin && onSaveJob && (
                      <button
                        onClick={() => onSaveJob(job)}
                        className="w-full bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        Save to Wishlist
                      </button>
                    )}
                  </div>

                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-[-100%] group-hover:translate-x-[100%]" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-20 bg-white rounded-3xl border border-slate-200"
          >
            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-400 text-lg font-bold">No jobs matched your criteria</p>
            <p className="text-slate-300 text-sm mt-2">Try adjusting your filters and search again</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
