import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Sparkles, ChevronRight, ExternalLink, Loader, MapPin, DollarSign, 
  Briefcase, CheckCircle2, Plus, Filter, Compass, Zap, BookmarkPlus, FileText 
} from 'lucide-react';
import { TagsInput } from "react-tag-input-component";

interface JobResult {
  id?: string;
  company: string;
  title: string;
  match?: string;
  salary: string;
  remote: string;
  position?: string;
  location?: string;
  type?: string;
  notes?: string;
}

interface UnifiedJobDiscoveryProps {
  onSaveJob?: (job: JobResult) => void;
  isAdmin?: boolean;
}

export function UnifiedJobDiscovery({ onSaveJob, isAdmin = false }: UnifiedJobDiscoveryProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'ai-search'>('browse');
  const [skills, setSkills] = useState<string[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'junior' | 'mid' | 'senior'>('mid');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<JobResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock discover jobs
  const MOCK_DISCOVER_JOBS: JobResult[] = [
    { id: 'd1', company: 'Google', position: 'Senior Frontend Engineer', title: 'Senior Frontend Engineer', location: 'Mountain View, CA', salary: '$180k - $250k', remote: 'On-site', type: 'Full-time', notes: 'Requires 5+ years React experience.' },
    { id: 'd2', company: 'Stripe', position: 'UI Engineer', title: 'UI Engineer', location: 'Remote', salary: '$160k - $210k', remote: 'Remote', type: 'Full-time', notes: 'Focus on design systems and accessibility.' },
    { id: 'd3', company: 'Vercel', position: 'Developer Advocate', title: 'Developer Advocate', location: 'Remote', salary: '$150k - $190k', remote: 'Remote', type: 'Full-time', notes: 'Content creation and community engagement.' },
    { id: 'd4', company: 'Airbnb', position: 'Staff Software Engineer', title: 'Staff Software Engineer', location: 'San Francisco, CA', salary: '$200k - $280k', remote: 'On-site', type: 'Full-time', notes: 'Leading core architecture initiatives.' },
    { id: 'd5', company: 'Spotify', position: 'Web Engineer', title: 'Web Engineer', location: 'New York, NY', salary: '$140k - $190k', remote: 'Hybrid', type: 'Full-time', notes: 'Working on the web player experience.' },
    { id: 'd6', company: 'Netflix', position: 'Senior UI/UX Engineer', title: 'Senior UI/UX Engineer', location: 'Los Gatos, CA', salary: '$200k - $300k', remote: 'On-site', type: 'Full-time', notes: 'A/B testing and performance optimization.' },
  ];

  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!skills.length && !jobTitle && !location) {
      setError('Please enter at least one search criteria');
      return;
    }

    setIsSearching(true);
    setError('');
    setHasSearched(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/ai/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: skills.join(', '),
          company_preference: location || 'Any',
          job_type: 'Full-time',
          experience_level: experienceLevel,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      const jobsArray = Array.isArray(data) ? data : (data.jobs || []);
      setResults(jobsArray);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Search took too long. Please try again with more specific criteria.');
      } else {
        setError('Failed to search for jobs. Please try again.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const filteredBrowseJobs = MOCK_DISCOVER_JOBS.filter(job => {
    const query = searchQuery.toLowerCase();
    return (
      job.company.toLowerCase().includes(query) || 
      job.title.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query) ||
      (job.notes?.toLowerCase().includes(query) || false)
    );
  });

  return (
    <motion.div
      key="unified-discovery"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto pb-20"
    >
      {/* Hero Section */}
      <div className="mb-12">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-3 px-6 py-3 bg-indigo-50 rounded-2xl border border-indigo-200 mb-6"
        >
          <Compass className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-black text-indigo-600 uppercase tracking-widest">Job Discovery Hub</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-4xl md:text-5xl font-black text-slate-900 mb-3 leading-tight"
        >
          Find Your Next <span className="text-indigo-600">Opportunity</span>
        </motion.h1>
        <p className="text-base text-slate-500 font-medium">Browse curated opportunities or discover AI-powered personalized recommendations</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 bg-slate-100 p-2 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-4 py-2.5 rounded-lg font-bold uppercase tracking-wide text-sm transition-all flex items-center gap-2 ${
            activeTab === 'browse' 
              ? 'bg-white text-indigo-600 shadow-lg' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass className="w-4 h-4" />
          Browse All
        </button>
        <button
          onClick={() => setActiveTab('ai-search')}
          className={`px-4 py-2.5 rounded-lg font-bold uppercase tracking-wide text-sm transition-all flex items-center gap-2 ${
            activeTab === 'ai-search' 
              ? 'bg-white text-indigo-600 shadow-lg' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Search
        </button>
      </div>

      {/* Browse Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'browse' && (
          <motion.div
            key="browse-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Search */}
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search companies, jobs, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none"
                />
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBrowseJobs.map((job) => (
                <motion.div 
                  key={job.id}
                  whileHover={{ y: -4 }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all group overflow-hidden flex flex-col h-full"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{job.company}</h3>
                        <p className="text-indigo-600 font-bold text-sm mt-1">{job.title}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold whitespace-nowrap">
                        {job.type}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-6 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 flex-shrink-0 text-slate-400" />
                        {job.salary}
                      </div>
                    </div>
                    
                    {job.notes && (
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4">{job.notes}</p>
                    )}
                  </div>

                  <button 
                    onClick={() => onSaveJob?.(job)}
                    className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg font-bold uppercase tracking-wide text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    Save
                  </button>
                </motion.div>
              ))}
            </div>

            {filteredBrowseJobs.length === 0 && (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">No jobs found matching your search</p>
              </div>
            )}
          </motion.div>
        )}

        {/* AI Search Tab */}
        {activeTab === 'ai-search' && (
          <motion.div
            key="ai-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <form onSubmit={handleAISearch} className="mb-12">
              <div className="space-y-8">
                {/* Skills */}
                <div>
                  <label className="block text-sm font-bold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-600" />
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

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">Job Title</label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g., Senior Frontend Engineer"
                      className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">Location/Company</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Remote, San Francisco"
                      className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">Experience</label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value as any)}
                      className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                      <option value="junior">Junior (0-2 years)</option>
                      <option value="mid">Mid-level (2-5 years)</option>
                      <option value="senior">Senior (5+ years)</option>
                    </select>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm font-bold"
                  >
                    ⚠️ {error}
                  </motion.div>
                )}

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-lg font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg"
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
                      onClick={() => {
                        setSkills([]);
                        setJobTitle('');
                        setLocation('');
                        setResults([]);
                        setHasSearched(false);
                        setError('');
                      }}
                      className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-lg font-bold uppercase tracking-wide transition-all"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* Results */}
            <AnimatePresence mode="wait">
              {!hasSearched ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <Sparkles className="w-12 h-12 text-indigo-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold">Fill in your preferences to get AI-powered recommendations</p>
                </motion.div>
              ) : isSearching ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"
                  />
                  <p className="text-slate-400 font-bold">Finding your perfect opportunities...</p>
                </motion.div>
              ) : results.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    Found <span className="text-indigo-600">{results.length} Recommendations</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {results.map((job, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all"
                      >
                        {job.match && (
                          <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 mb-3">
                            {job.match}% match
                          </div>
                        )}
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{job.title}</h3>
                        <p className="text-indigo-600 font-bold text-sm mb-4">at {job.company}</p>
                        <div className="space-y-2 text-sm text-slate-600 mb-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            {job.remote}
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            {job.salary}
                          </div>
                        </div>
                        <button
                          onClick={() => onSaveJob?.(job)}
                          className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg font-bold uppercase tracking-wide text-xs transition-all flex items-center justify-center gap-2"
                        >
                          <BookmarkPlus className="w-4 h-4" />
                          Save
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="no-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 bg-slate-50 rounded-2xl"
                >
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">No jobs matched your criteria</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
