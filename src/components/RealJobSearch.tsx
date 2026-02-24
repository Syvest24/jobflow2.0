import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, Loader, MapPin, DollarSign, Briefcase, ExternalLink, Filter, X, Plus, Globe } from 'lucide-react';

interface RealJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  url: string;
  remote: string;
  type: string;
  posted: string;
  source: string;
  match?: string;
}

interface RealJobSearchProps {
  onSaveJob?: (job: RealJob) => void;
  isAdmin?: boolean;
}

export function RealJobSearch({ onSaveJob, isAdmin = false }: RealJobSearchProps) {
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [jobType, setJobType] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<RealJob[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keywords && !location) {
      setError('Please enter job title or location');
      return;
    }

    setIsSearching(true);
    setError('');
    setHasSearched(true);

    try {
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords,
          location: location || 'Remote',
          salary_min: salaryMin ? parseInt(salaryMin) : undefined,
          salary_max: salaryMax ? parseInt(salaryMax) : undefined,
          job_type: jobType || undefined,
        }),
      });

      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setResults(data.jobs || []);
      setSource(data.source);
    } catch (err) {
      setError('Failed to search jobs. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setKeywords('');
    setLocation('');
    setSalaryMin('');
    setSalaryMax('');
    setJobType('');
    setResults([]);
    setHasSearched(false);
    setError('');
    setSource('');
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <motion.div
      key="real-job-search-view"
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
          className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-50 rounded-2xl border border-emerald-200 mb-6"
        >
          <Globe className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-black text-emerald-600 uppercase tracking-widest">Real Job Listings</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-5xl md:text-6xl font-black text-slate-900 mb-4 leading-tight"
        >
          Live Job <br />
          <span className="text-emerald-600">Opportunities</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-slate-500 font-medium max-w-2xl mx-auto"
        >
          Search real job listings from JSearch and Adzuna with advanced filters
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
          {/* Main Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-black text-slate-600 uppercase tracking-widest mb-4">
                Job Title / Keywords
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g., Senior React Engineer"
                className="form-input"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-600 uppercase tracking-widest mb-4">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., San Francisco, London, Remote"
                className="form-input"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide' : 'Show'} Advanced Filters
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-3">
                      Min Salary ($)
                    </label>
                    <input
                      type="number"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      placeholder="e.g., 80000"
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-3">
                      Max Salary ($)
                    </label>
                    <input
                      type="number"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      placeholder="e.g., 150000"
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-3">
                      Job Type
                    </label>
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="form-select"
                    >
                      <option value="">Any</option>
                      <option value="FULL_TIME">Full-time</option>
                      <option value="PART_TIME">Part-time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="TEMPORARY">Temporary</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 active:scale-95"
            >
              {isSearching ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search Jobs
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
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-400 text-lg font-bold">Enter job title and location to get started</p>
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
              className="w-16 h-16 border-4 border-slate-200 border-t-emerald-600 rounded-full mx-auto mb-6"
            />
            <p className="text-slate-400 text-lg font-bold">Searching real job boards...</p>
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
                Found <span className="text-emerald-600">{results.length} Jobs</span>
              </h2>
              <p className="text-slate-500 font-medium">From {source} • Posted recently</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {results.map((job, index) => (
                <motion.div
                  key={`${job.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card-elegant group relative overflow-hidden flex flex-col"
                >
                  {/* Source Badge */}
                  <div className="absolute top-4 right-4">
                    <div className="px-3 py-1 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest">
                      {job.source}
                    </div>
                  </div>

                  <div className="space-y-4 flex-1">
                    {/* Header */}
                    <div>
                      <h3 className="text-lg font-black text-slate-900 mb-1 pr-24 line-clamp-2">{job.title}</h3>
                      <p className="text-sm text-emerald-600 font-bold uppercase tracking-widest">{job.company}</p>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 py-3 border-t border-b border-slate-100">
                      <div className="flex items-center gap-3 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-300" />
                        <span className="text-xs font-bold">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <DollarSign className="w-4 h-4 text-slate-300" />
                        <span className="text-xs font-bold">{job.salary}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Briefcase className="w-4 h-4 text-slate-300" />
                        <span className="text-xs font-bold">{job.type}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 line-clamp-3">{job.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 mt-auto">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View & Apply
                    </a>
                    {isAdmin && onSaveJob && (
                      <button
                        onClick={() => onSaveJob(job)}
                        className="px-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-1 active:scale-95"
                        title="Save to Wishlist"
                      >
                        <Plus className="w-4 h-4" />
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
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-400 text-lg font-bold">No jobs found</p>
            <p className="text-slate-300 text-sm mt-2">Try different keywords or location</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
