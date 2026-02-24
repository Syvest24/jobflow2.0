/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  List, 
  Plus, 
  Search, 
  TrendingUp, 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ExternalLink,
  MapPin,
  DollarSign,
  MoreVertical,
  Trash2,
  Edit3,
  Sparkles,
  ChevronRight,
  Filter,
  User,
  Lock,
  LogOut,
  Github,
  Linkedin,
  Mail,
  Award,
  Globe,
  FileText,
  Upload,
  Compass,
  BookmarkPlus,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TagsInput } from "react-tag-input-component";
import Markdown from 'react-markdown';
import { Job, JobStatus, NewJob, Portfolio, CoverLetterTemplate } from './types';
import { Analytics } from './components/Analytics';
import { InterviewPrep } from './components/InterviewPrep';
import { CoverLetterTemplates } from './components/CoverLetterTemplates';

const STATUS_COLORS: Record<JobStatus, string> = {
  'Wishlist': 'bg-slate-100 text-slate-700 border-slate-200',
  'Applied': 'bg-blue-50 text-blue-700 border-blue-200',
  'Interviewing': 'bg-amber-50 text-amber-700 border-amber-200',
  'Offer': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
};

const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="bg-indigo-200 text-indigo-900 rounded-sm px-0.5">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [templates, setTemplates] = useState<CoverLetterTemplate[]>([]);
  const [view, setView] = useState<'discover' | 'tracker' | 'portfolio' | 'analytics' | 'interview-prep' | 'templates'>('discover');
  const [trackerLayout, setTrackerLayout] = useState<'board' | 'list'>('board');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingPortfolio, setIsEditingPortfolio] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'All'>('All');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiResultType, setAiResultType] = useState<'cover-letter' | 'resume-tips' | null>(null);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean, hasUrl: boolean } | null>(null);
  const [isInterviewPrepOpen, setIsInterviewPrepOpen] = useState(false);

  const MOCK_DISCOVER_JOBS = [
    { id: 'd1', company: 'Google', position: 'Senior Frontend Engineer', location: 'Mountain View, CA', salary: '$180k - $250k', type: 'Full-time', notes: 'Requires 5+ years React experience.' },
    { id: 'd2', company: 'Stripe', position: 'UI Engineer', location: 'Remote', salary: '$160k - $210k', type: 'Full-time', notes: 'Focus on design systems and accessibility.' },
    { id: 'd3', company: 'Vercel', position: 'Developer Advocate', location: 'Remote', salary: '$150k - $190k', type: 'Full-time', notes: 'Content creation and community engagement.' },
    { id: 'd4', company: 'Airbnb', position: 'Staff Software Engineer', location: 'San Francisco, CA', salary: '$200k - $280k', type: 'Full-time', notes: 'Leading core architecture initiatives.' },
    { id: 'd5', company: 'Spotify', position: 'Web Engineer', location: 'New York, NY', salary: '$140k - $190k', type: 'Full-time', notes: 'Working on the web player experience.' },
    { id: 'd6', company: 'Netflix', position: 'Senior UI/UX Engineer', location: 'Los Gatos, CA', salary: '$200k - $300k', type: 'Full-time', notes: 'A/B testing and performance optimization.' },
    { id: 'd7', company: 'Meta', position: 'Frontend Engineer', location: 'Menlo Park, CA', salary: '$170k - $240k', type: 'Full-time', notes: 'React and GraphQL expertise required.' },
    { id: 'd8', company: 'Amazon', position: 'SDE II', location: 'Seattle, WA', salary: '$160k - $220k', type: 'Full-time', notes: 'AWS experience is a plus.' },
    { id: 'd9', company: 'Apple', position: 'UI Developer', location: 'Cupertino, CA', salary: '$180k - $260k', type: 'Full-time', notes: 'Focus on pixel-perfect UI and animations.' },
    { id: 'd10', company: 'Microsoft', position: 'Software Engineer', location: 'Redmond, WA', salary: '$150k - $210k', type: 'Full-time', notes: 'TypeScript and Azure experience.' },
    { id: 'd11', company: 'Discord', position: 'Product Engineer', location: 'Remote', salary: '$160k - $200k', type: 'Full-time', notes: 'Real-time communication systems.' },
    { id: 'd12', company: 'Figma', position: 'Software Engineer, Editor', location: 'San Francisco, CA', salary: '$170k - $230k', type: 'Full-time', notes: 'Canvas and WebGL experience.' },
  ];

  const handleSaveFromDiscover = async (job: typeof MOCK_DISCOVER_JOBS[0]) => {
    if (!isAdmin) return setIsLoginOpen(true);
    const newJobData: NewJob = {
      company: job.company,
      position: job.position,
      status: 'Wishlist',
      date_applied: new Date().toISOString().split('T')[0],
      location: job.location,
      salary: job.salary,
      notes: `Found via Discover tab.\nType: ${job.type}\n${job.notes}`,
      link: ''
    };
    try {
      await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJobData),
      });
      fetchJobs();
      alert(`Saved ${job.position} at ${job.company} to your Wishlist!`);
    } catch (err) {
      console.error('Failed to save job', err);
    }
  };

  const [newJob, setNewJob] = useState<NewJob>({
    company: '',
    position: '',
    status: 'Applied',
    date_applied: new Date().toISOString().split('T')[0],
    link: '',
    location: '',
    salary: '',
    notes: ''
  });

  const [editPortfolioData, setEditPortfolioData] = useState<Portfolio | null>(null);

  useEffect(() => {
    fetchJobs();
    fetchPortfolio();
    fetchTemplates();
    checkAuth();
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setDbStatus({ connected: data.dbConnected, hasUrl: data.env.hasMongoUrl });
    } catch (err) {
      console.error('Health check failed', err);
    }
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();
      setIsAdmin(data.authenticated);
    } catch (err) {
      console.error('Auth check failed', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAdmin(true);
        setIsLoginOpen(false);
        setPassword('');
      } else {
        alert('Invalid password');
      }
    } catch (err) {
      console.error('Login failed', err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAdmin(false);
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      setPortfolio(data);
    } catch (err) {
      console.error('Failed to fetch portfolio', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to fetch templates', err);
    }
  };

  const handleSaveTemplate = async (template: CoverLetterTemplate) => {
    if (!isAdmin) return setIsLoginOpen(true);
    try {
      const method = template.id.startsWith('template_') ? 'POST' : 'PUT';
      const url = method === 'POST' ? '/api/templates' : `/api/templates/${template.id}`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (res.ok) {
        fetchTemplates();
      }
    } catch (err) {
      console.error('Failed to save template', err);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!isAdmin) return;
    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      fetchTemplates();
    } catch (err) {
      console.error('Failed to delete template', err);
    }
  };

  const handleUpdatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPortfolioData) return;
    try {
      const res = await fetch('/api/portfolio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPortfolioData)
      });
      if (res.ok) {
        setIsEditingPortfolio(false);
        fetchPortfolio();
      }
    } catch (err) {
      console.error('Failed to update portfolio', err);
    }
  };

  const handleDownloadCv = (lang: 'en' | 'de') => {
    window.open(`/api/portfolio/cv/download/${lang}`, '_blank');
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>, lang: 'en' | 'de') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const res = await fetch('/api/portfolio/cv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64,
            filename: file.name,
            contentType: file.type,
            lang
          })
        });
        if (res.ok) {
          alert(`CV (${lang.toUpperCase()}) uploaded successfully`);
          fetchPortfolio();
        } else {
          alert('Failed to upload CV');
        }
      } catch (err) {
        console.error('CV upload error', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return setIsLoginOpen(true);
    try {
      await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob),
      });
      setIsAdding(false);
      setNewJob({
        company: '',
        position: '',
        status: 'Applied',
        date_applied: new Date().toISOString().split('T')[0],
        link: '',
        location: '',
        salary: '',
        notes: ''
      });
      fetchJobs();
    } catch (err) {
      console.error('Failed to add job', err);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!isAdmin) return setIsLoginOpen(true);
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
      fetchJobs();
    } catch (err) {
      console.error('Failed to delete job', err);
    }
  };

  const handleUpdateStatus = async (id: string, status: JobStatus) => {
    if (!isAdmin) return setIsLoginOpen(true);
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    try {
      await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...job, status }),
      });
      fetchJobs();
      if (selectedJob && selectedJob.id === id) {
        setSelectedJob({ ...selectedJob, status });
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleAiOptimize = async (type: 'cover-letter' | 'resume-tips', jobDescription: string) => {
    setAiLoading(true);
    setAiResult('');
    setAiResultType(type);
    try {
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type, 
          jobDescription, 
          resume: portfolio?.about || "Experienced software engineer with expertise in React, Node.js, and TypeScript."
        }),
      });
      const data = await res.json();
      setAiResult(data.result);
    } catch (err) {
      console.error('AI Error', err);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'All' || job.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: jobs.length,
    applied: jobs.filter(j => j.status === 'Applied').length,
    interviewing: jobs.filter(j => j.status === 'Interviewing').length,
    offers: jobs.filter(j => j.status === 'Offer').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200/50">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex justify-between h-24 items-center">
            <div className="flex items-center gap-16">
              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setView('tracker')}>
                <div className="w-12 h-12 bg-slate-900 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-slate-200 group-hover:rotate-12 transition-all duration-500 group-hover:bg-indigo-600">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">JOBFLOW</span>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mt-1">Studio</span>
                </div>
              </div>
              
              <div className="hidden md:flex items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
                <button 
                  onClick={() => setView('discover')}
                  className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'discover' ? 'text-indigo-600 bg-white shadow-xl shadow-indigo-500/5' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  <Compass className="w-4 h-4" />
                  Discover
                </button>
                <button 
                  onClick={() => setView('tracker')}
                  className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'tracker' ? 'text-indigo-600 bg-white shadow-xl shadow-indigo-500/5' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Tracker
                </button>
                <button 
                  onClick={() => setView('portfolio')}
                  className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'portfolio' ? 'text-indigo-600 bg-white shadow-xl shadow-indigo-500/5' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  <User className="w-4 h-4" />
                  Portfolio
                </button>
                <button 
                  onClick={() => setView('analytics')}
                  className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'analytics' ? 'text-indigo-600 bg-white shadow-xl shadow-indigo-500/5' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Analytics
                </button>
                <button 
                  onClick={() => setView('interview-prep')}
                  className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'interview-prep' ? 'text-indigo-600 bg-white shadow-xl shadow-indigo-500/5' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  <Lightbulb className="w-4 h-4" />
                  Interview Prep
                </button>
                <button 
                  onClick={() => setView('templates')}
                  className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'templates' ? 'text-indigo-600 bg-white shadow-xl shadow-indigo-500/5' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  <FileText className="w-4 h-4" />
                  Templates
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="relative hidden lg:block group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search anything..."
                  className="pl-14 pr-8 py-4 bg-slate-100/50 border-none rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 w-80 transition-all outline-none placeholder:text-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {isAdmin ? (
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-slate-900 hover:bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-2xl shadow-slate-200 active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    New Entry
                  </button>
                  <div className="w-px h-10 bg-slate-200" />
                  <button 
                    onClick={handleLogout}
                    className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-[1.25rem] transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsLoginOpen(true)}
                  className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-[1.25rem] transition-all"
                  title="Admin Login"
                >
                  <Lock className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-6 lg:px-12 py-12">
        <AnimatePresence mode="wait">
          {view === 'discover' ? (
            <motion.div
              key="discover-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto pb-20"
            >
              <div className="mb-12">
                <h2 className="text-5xl font-black tracking-tighter text-slate-900 mb-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-[1.5rem] flex items-center justify-center">
                    <Compass className="w-8 h-8" />
                  </div>
                  Discover Opportunities
                </h2>
                <p className="text-lg text-slate-400 font-bold uppercase tracking-widest">Find and save jobs to your tracker.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_DISCOVER_JOBS.filter(job => {
                  const query = searchQuery.toLowerCase();
                  return (
                    job.company.toLowerCase().includes(query) || 
                    job.position.toLowerCase().includes(query) ||
                    job.location.toLowerCase().includes(query) ||
                    job.type.toLowerCase().includes(query) ||
                    job.notes.toLowerCase().includes(query)
                  );
                }).map((job) => (
                  <motion.div 
                    key={job.id}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group relative overflow-hidden flex flex-col h-full cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                          <HighlightText text={job.company} highlight={searchQuery} />
                        </h3>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                          <HighlightText text={job.type} highlight={searchQuery} />
                        </span>
                      </div>
                      <div className="text-lg text-indigo-600 font-bold mb-6">
                        <HighlightText text={job.position} highlight={searchQuery} />
                      </div>
                      
                      <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-slate-400" />
                          </div>
                          <HighlightText text={job.location} highlight={searchQuery} />
                        </div>
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                          </div>
                          {job.salary}
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 mb-8 line-clamp-3">
                        <HighlightText text={job.notes} highlight={searchQuery} />
                      </div>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveFromDiscover(job);
                      }}
                      className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-indigo-200"
                    >
                      <BookmarkPlus className="w-5 h-5" />
                      Save to Tracker
                    </button>
                  </motion.div>
                ))}
                {MOCK_DISCOVER_JOBS.filter(job => {
                  const query = searchQuery.toLowerCase();
                  return (
                    job.company.toLowerCase().includes(query) || 
                    job.position.toLowerCase().includes(query) ||
                    job.location.toLowerCase().includes(query) ||
                    job.type.toLowerCase().includes(query) ||
                    job.notes.toLowerCase().includes(query)
                  );
                }).length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">No jobs found</h3>
                    <p className="text-slate-500 font-bold">Try adjusting your search query.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : view === 'tracker' ? (
            <motion.div
              key="tracker-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Hero Section */}
              <div className="mb-16">
                <h2 className="text-5xl font-black tracking-tighter text-slate-900 mb-4">
                  Welcome back, <span className="text-indigo-600">{portfolio?.name.split(' ')[0] || 'User'}</span>.
                </h2>
                <p className="text-lg text-slate-400 font-bold uppercase tracking-widest">You have {jobs.length} active applications.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                <StatCard label="Total" value={stats.total} icon={<LayoutGrid className="w-6 h-6" />} color="indigo" />
                <StatCard label="Applied" value={stats.applied} icon={<Clock className="w-6 h-6" />} color="blue" />
                <StatCard label="Interviews" value={stats.interviewing} icon={<TrendingUp className="w-6 h-6" />} color="amber" />
                <StatCard label="Offers" value={stats.offers} icon={<CheckCircle2 className="w-6 h-6" />} color="emerald" />
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 mb-12">
                <div className="flex items-center bg-slate-100/50 p-2 rounded-[1.5rem] border border-slate-200/50">
                  <button 
                    onClick={() => setTrackerLayout('board')}
                    className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${trackerLayout === 'board' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/5' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Board
                  </button>
                  <button 
                    onClick={() => setTrackerLayout('list')}
                    className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${trackerLayout === 'list' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/5' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <List className="w-4 h-4" />
                    List
                  </button>
                </div>

                <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-[1.5rem] border border-slate-100 shadow-sm">
                  <Filter className="w-4 h-4 text-slate-300" />
                  <select 
                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest px-2 py-1 focus:ring-0 outline-none text-slate-600 cursor-pointer"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Wishlist">Wishlist</option>
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Tracker Content */}
              <AnimatePresence mode="wait">
                {trackerLayout === 'board' ? (
                  <motion.div 
                    key="board"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 overflow-x-auto pb-4"
                  >
                    {(['Wishlist', 'Applied', 'Interviewing', 'Offer', 'Rejected'] as JobStatus[]).map(status => (
                      <BoardColumn 
                        key={status} 
                        status={status} 
                        jobs={filteredJobs.filter(j => j.status === status)} 
                        searchQuery={searchQuery}
                        onDelete={handleDeleteJob}
                        onStatusChange={handleUpdateStatus}
                        onAiOptimize={handleAiOptimize}
                        onSelectJob={setSelectedJob}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="list"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Company & Role</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Applied</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredJobs.map(job => (
                          <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedJob(job)}>
                            <td className="px-8 py-5">
                              <div className="font-black text-slate-900">
                                <HighlightText text={job.company} highlight={searchQuery} />
                              </div>
                              <div className="text-xs text-indigo-600 font-bold">
                                <HighlightText text={job.position} highlight={searchQuery} />
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_COLORS[job.status]}`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-sm font-bold text-slate-500">{job.date_applied}</td>
                            <td className="px-8 py-5 text-sm font-bold text-slate-500">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-slate-300" />
                                {job.location || 'Remote'}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                <button 
                                  onClick={() => handleAiOptimize('cover-letter', `${job.position} at ${job.company}. ${job.notes || ''}`)}
                                  className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                  title="AI Cover Letter"
                                >
                                  <Sparkles className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteJob(job.id)} 
                                  className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : view === 'portfolio' ? (
            <motion.div
              key="portfolio-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto pb-20"
            >
              {portfolio ? (
                <div className="space-y-24">
                  {/* Hero Section - Editorial Style */}
                  <div className="relative pt-12 text-center">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="relative inline-block mb-12"
                    >
                      <div className="w-48 h-48 bg-slate-900 rounded-[3rem] mx-auto flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden group">
                        <User className="w-24 h-24 text-white group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center -rotate-12">
                        <Sparkles className="w-8 h-8 text-indigo-600" />
                      </div>
                    </motion.div>

                    <div className="space-y-6">
                      <h1 className="text-7xl font-black tracking-tighter text-slate-900 leading-[0.9] uppercase">
                        {portfolio.name.split(' ').map((word, i) => (
                          <span key={i} className={i % 2 === 1 ? 'text-indigo-600' : ''}>{word} </span>
                        ))}
                      </h1>
                      <p className="text-2xl text-slate-400 font-black uppercase tracking-[0.2em]">{portfolio.title}</p>
                      
                      {isAdmin && (
                        <button 
                          onClick={() => {
                            setEditPortfolioData(portfolio);
                            setIsEditingPortfolio(true);
                          }}
                          className="px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2 mx-auto"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit Profile
                        </button>
                      )}
                    </div>

                    <div className="flex justify-center gap-6 pt-12">
                      {portfolio.github && (
                        <a href={portfolio.github} target="_blank" className="w-14 h-14 bg-white rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center text-slate-400 hover:text-slate-900 border border-slate-100">
                          <Github className="w-6 h-6" />
                        </a>
                      )}
                      {portfolio.linkedin && (
                        <a href={portfolio.linkedin} target="_blank" className="w-14 h-14 bg-white rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center text-slate-400 hover:text-blue-600 border border-slate-100">
                          <Linkedin className="w-6 h-6" />
                        </a>
                      )}
                      {portfolio.email && (
                        <a href={`mailto:${portfolio.email}`} className="w-14 h-14 bg-white rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center text-slate-400 hover:text-indigo-600 border border-slate-100">
                          <Mail className="w-6 h-6" />
                        </a>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-8 pt-16">
                      <div className="flex flex-wrap justify-center gap-6">
                        {/* English CV */}
                        <div className="group">
                          {portfolio.cvs?.en ? (
                            <button 
                              onClick={() => handleDownloadCv('en')}
                              className="px-8 py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"
                            >
                              <FileText className="w-5 h-5" />
                              Resume (EN)
                            </button>
                          ) : (
                            <div className="px-8 py-4 bg-slate-100 text-slate-400 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 italic opacity-50">
                              <FileText className="w-5 h-5" />
                              EN N/A
                            </div>
                          )}
                          {isAdmin && (
                            <label className="mt-3 block text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 cursor-pointer text-center transition-colors">
                              <Upload className="w-3 h-3 inline mr-1" />
                              {portfolio.cvs?.en ? 'Update' : 'Upload'}
                              <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => handleCvUpload(e, 'en')} />
                            </label>
                          )}
                        </div>

                        {/* German CV */}
                        <div className="group">
                          {portfolio.cvs?.de ? (
                            <button 
                              onClick={() => handleDownloadCv('de')}
                              className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                            >
                              <FileText className="w-5 h-5" />
                              Resume (DE)
                            </button>
                          ) : (
                            <div className="px-8 py-4 bg-slate-100 text-slate-400 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 italic opacity-50">
                              <FileText className="w-5 h-5" />
                              DE N/A
                            </div>
                          )}
                          {isAdmin && (
                            <label className="mt-3 block text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 cursor-pointer text-center transition-colors">
                              <Upload className="w-3 h-3 inline mr-1" />
                              {portfolio.cvs?.de ? 'Update' : 'Upload'}
                              <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => handleCvUpload(e, 'de')} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* About Section */}
                    <div className="lg:col-span-7 space-y-8">
                      <section className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />
                        <h2 className="text-3xl font-black mb-8 flex items-center gap-3 uppercase tracking-tight">
                          <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                          </div>
                          About
                        </h2>
                        <p className="text-slate-600 leading-relaxed text-xl font-medium">
                          {portfolio.about}
                        </p>
                      </section>

                      <section className="bg-slate-900 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full -ml-24 -mb-24" />
                        <h2 className="text-3xl font-black mb-8 flex items-center gap-3 text-white uppercase tracking-tight">
                          <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                            <Globe className="w-5 h-5 text-white" />
                          </div>
                          Languages
                        </h2>
                        <div className="grid grid-cols-2 gap-6">
                          {portfolio.languages?.map(lang => (
                            <div key={lang.name} className="p-6 bg-white/5 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-colors">
                              <div className="font-black text-white text-lg">{lang.name}</div>
                              <div className="text-[10px] text-indigo-400 uppercase font-black tracking-widest mt-1">{lang.level}</div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    {/* Skills & Certs Column */}
                    <div className="lg:col-span-5 space-y-8">
                      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                        <h2 className="text-2xl font-black mb-8 flex items-center gap-3 uppercase tracking-tight">
                          <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
                            <Award className="w-5 h-5 text-indigo-600" />
                          </div>
                          Expertise
                        </h2>
                        <div className="flex flex-wrap gap-3">
                          {portfolio.skills?.map((skill, index) => (
                            <motion.span 
                              key={skill} 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ 
                                scale: 1.1, 
                                backgroundColor: '#4f46e5', 
                                color: '#ffffff',
                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                              }}
                              className="px-5 py-3 bg-white text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider border border-slate-200 shadow-sm transition-all cursor-default"
                            >
                              {skill}
                            </motion.span>
                          ))}
                        </div>
                      </section>

                      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                        <h2 className="text-2xl font-black mb-8 flex items-center gap-3 uppercase tracking-tight">
                          <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                          </div>
                          Certs
                        </h2>
                        <ul className="space-y-6">
                          {portfolio.certifications?.map(cert => (
                            <li key={cert} className="flex items-start gap-4 group">
                              <div className="mt-1 w-6 h-6 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              </div>
                              <span className="text-slate-600 font-bold text-sm leading-tight">{cert}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-40">
                  <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Loading Portfolio</p>
                </div>
              )}
            </motion.div>
          ) : view === 'analytics' ? (
            <Analytics jobs={jobs} />
          ) : view === 'interview-prep' ? (
            <InterviewPrep />
          ) : view === 'templates' ? (
            <CoverLetterTemplates 
              templates={templates}
              onSave={handleSaveTemplate}
              onDelete={handleDeleteTemplate}
              isAdmin={isAdmin}
              onLoginRequired={() => setIsLoginOpen(true)}
            />
          ) : (
            <div className="text-center py-20">
              <p className="text-slate-400">View not found</p>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Portfolio Edit Modal */}
      <AnimatePresence>
        {isEditingPortfolio && editPortfolioData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-bold text-slate-900">Edit Portfolio</h2>
                <button onClick={() => setIsEditingPortfolio(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleUpdatePortfolio} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={editPortfolioData.name}
                      onChange={(e) => setEditPortfolioData({...editPortfolioData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Title</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={editPortfolioData.title}
                      onChange={(e) => setEditPortfolioData({...editPortfolioData, title: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">About Me</label>
                  <textarea 
                    rows={4}
                    required
                    className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    value={editPortfolioData.about}
                    onChange={(e) => setEditPortfolioData({...editPortfolioData, about: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={editPortfolioData.email || ''}
                      onChange={(e) => setEditPortfolioData({...editPortfolioData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">LinkedIn URL</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={editPortfolioData.linkedin || ''}
                      onChange={(e) => setEditPortfolioData({...editPortfolioData, linkedin: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">GitHub URL</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={editPortfolioData.github || ''}
                      onChange={(e) => setEditPortfolioData({...editPortfolioData, github: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Skills</label>
                  <div className="modern-tag-input">
                    <TagsInput
                      value={editPortfolioData.skills || []}
                      onChange={(tags) => setEditPortfolioData({...editPortfolioData, skills: tags})}
                      name="skills"
                      placeHolder="Add skill..."
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Certifications</label>
                  <div className="modern-tag-input">
                    <TagsInput
                      value={editPortfolioData.certifications || []}
                      onChange={(tags) => setEditPortfolioData({...editPortfolioData, certifications: tags})}
                      name="certifications"
                      placeHolder="Add certification..."
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsEditingPortfolio(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-8"
            >
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Admin Login</h2>
                <p className="text-slate-500 text-sm mt-1">Enter password to manage applications</p>
                {dbStatus && !dbStatus.connected && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs">
                    ⚠️ Database not connected. Please check your MONGO_URL in Secrets.
                  </div>
                )}
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <input 
                  type="password" 
                  placeholder="Password"
                  className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                >
                  Sign In
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Job Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">Add New Application</h2>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddJob} className="p-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Company</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={newJob.company}
                      onChange={e => setNewJob({...newJob, company: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Position</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={newJob.position}
                      onChange={e => setNewJob({...newJob, position: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
                    <select 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={newJob.status}
                      onChange={e => setNewJob({...newJob, status: e.target.value as JobStatus})}
                    >
                      <option value="Wishlist">Wishlist</option>
                      <option value="Applied">Applied</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Date Applied</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={newJob.date_applied}
                      onChange={e => setNewJob({...newJob, date_applied: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Job Link</label>
                  <input 
                    type="url" 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={newJob.link}
                    onChange={e => setNewJob({...newJob, link: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Location</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={newJob.location}
                      onChange={e => setNewJob({...newJob, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Salary Range</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={newJob.salary}
                      onChange={e => setNewJob({...newJob, salary: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                >
                  Create Application
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Job Details Modal */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setSelectedJob(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              >
                <XCircle className="w-6 h-6" />
              </button>

              <div className="mb-8 pr-12">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedJob.company}</h2>
                  {selectedJob.link && (
                    <a href={selectedJob.link} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600 transition-colors">
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </div>
                <div className="text-xl text-indigo-600 font-bold">{selectedJob.position}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                  {isAdmin ? (
                    <select 
                      className="bg-transparent border-none font-bold text-slate-900 p-0 focus:ring-0 outline-none w-full cursor-pointer"
                      value={selectedJob.status}
                      onChange={(e) => handleUpdateStatus(selectedJob.id, e.target.value as JobStatus)}
                    >
                      <option value="Wishlist">Wishlist</option>
                      <option value="Applied">Applied</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  ) : (
                    <div className="font-bold text-slate-900">{selectedJob.status}</div>
                  )}
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Applied</div>
                  <div className="font-bold text-slate-900">{selectedJob.date_applied || 'N/A'}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</div>
                  <div className="font-bold text-slate-900">{selectedJob.location || 'Remote'}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Salary</div>
                  <div className="font-bold text-slate-900">{selectedJob.salary || 'N/A'}</div>
                </div>
              </div>

              {selectedJob.notes && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Notes</div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedJob.notes}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    handleAiOptimize('cover-letter', `${selectedJob.position} at ${selectedJob.company}. ${selectedJob.notes || ''}`);
                    setSelectedJob(null);
                  }}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Cover Letter
                </button>
                <button 
                  onClick={() => {
                    handleAiOptimize('resume-tips', `${selectedJob.position} at ${selectedJob.company}. ${selectedJob.notes || ''}`);
                    setSelectedJob(null);
                  }}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  Get Resume Tips
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Result Modal */}
      <AnimatePresence>
        {aiResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setAiResult(''); setAiResultType(null); }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
                    {aiResultType === 'cover-letter' ? <FileText className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {aiResultType === 'cover-letter' ? 'Generated Cover Letter' : 'Resume Optimization Tips'}
                    </h2>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Powered by Gemini AI</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(aiResult);
                      alert('Copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-white text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"
                  >
                    Copy Text
                  </button>
                  <button onClick={() => { setAiResult(''); setAiResultType(null); }} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl hover:bg-slate-100 transition-all shadow-sm border border-slate-100">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-8 overflow-y-auto bg-slate-50/50 flex-1">
                <div className="prose prose-slate prose-indigo max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-indigo-600 prose-a:font-bold hover:prose-a:text-indigo-500 prose-strong:font-black prose-strong:text-slate-900">
                  <Markdown>{aiResult}</Markdown>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {aiLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-indigo-600 font-bold animate-pulse">Gemini is thinking...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    blue: 'bg-blue-50 text-blue-600 ring-blue-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  };

  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.02 }}
      className="glass-card p-8 rounded-[2.5rem] transition-all duration-500 group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center justify-between mb-6">
        <div className={`p-4 rounded-2xl ring-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${colors[color]}`}>
          {icon}
        </div>
        <div className="flex gap-1">
          {[1, 2].map(i => (
            <div key={i} className="w-1 h-1 rounded-full bg-slate-200" />
          ))}
        </div>
      </div>
      
      <div className="relative">
        <div className="text-5xl font-black text-slate-900 tracking-tighter mb-1 group-hover:text-indigo-600 transition-colors">
          {value}
        </div>
        <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

const BoardColumn: React.FC<{ 
  status: JobStatus, 
  jobs: Job[], 
  searchQuery: string,
  onDelete: (id: string) => void,
  onStatusChange: (id: string, status: JobStatus) => void,
  onAiOptimize: (type: 'cover-letter' | 'resume-tips', desc: string) => void,
  onSelectJob: (job: Job) => void
}> = ({ status, jobs, searchQuery, onDelete, onStatusChange, onAiOptimize, onSelectJob }) => {
  const statusColors: Record<JobStatus, string> = {
    'Wishlist': 'bg-slate-400',
    'Applied': 'bg-blue-500',
    'Interviewing': 'bg-amber-500',
    'Offer': 'bg-emerald-500',
    'Rejected': 'bg-rose-500',
  };

  return (
    <div className="kanban-column modern-scrollbar overflow-y-auto max-h-[calc(100vh-280px)]">
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${statusColors[status]} shadow-lg shadow-current/20`} />
          <h3 className="font-black text-slate-800 tracking-tight text-sm uppercase">{status}</h3>
        </div>
        <span className="bg-white/80 backdrop-blur-sm text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-black border border-slate-200/50 shadow-sm">
          {jobs.length}
        </span>
      </div>
      
      <div className="flex flex-col gap-4 min-h-[200px]">
        {jobs.map(job => (
          <JobCard 
            key={job.id} 
            job={job} 
            searchQuery={searchQuery}
            onDelete={onDelete} 
            onStatusChange={onStatusChange}
            onAiOptimize={onAiOptimize}
            onSelectJob={onSelectJob}
          />
        ))}
        {jobs.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-200/50 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 text-xs gap-2 bg-white/20">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <Plus className="w-4 h-4 opacity-50" />
            </div>
            <span className="font-bold opacity-50">Empty</span>
          </div>
        )}
      </div>
    </div>
  );
}

const JobCard: React.FC<{ 
  job: Job, 
  searchQuery: string,
  onDelete: (id: string) => void, 
  onStatusChange: (id: string, status: JobStatus) => void,
  onAiOptimize: (type: 'cover-letter' | 'resume-tips', desc: string) => void,
  onSelectJob: (job: Job) => void
}> = ({ job, searchQuery, onDelete, onStatusChange, onAiOptimize, onSelectJob }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group relative overflow-hidden"
    >
      {/* Status Accent */}
      <div className={`absolute top-0 left-0 w-1 h-full ${
        job.status === 'Offer' ? 'bg-emerald-500' : 
        job.status === 'Rejected' ? 'bg-rose-500' : 
        job.status === 'Interviewing' ? 'bg-amber-500' : 
        job.status === 'Applied' ? 'bg-blue-500' : 'bg-slate-300'
      }`} />

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectJob(job)}>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-black text-slate-900 leading-tight text-base truncate">
              <HighlightText text={job.company} highlight={searchQuery} />
            </h4>
            {job.link && (
              <a href={job.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-slate-300 hover:text-indigo-600 transition-colors shrink-0">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <p className="text-xs text-indigo-600 font-black uppercase tracking-wider">
            <HighlightText text={job.position} highlight={searchQuery} />
          </p>
        </div>
        <div className="relative shrink-0">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 z-20 py-2 overflow-hidden"
                >
                  <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Move to</div>
                  {(['Wishlist', 'Applied', 'Interviewing', 'Offer', 'Rejected'] as JobStatus[]).map(s => (
                    <button 
                      key={s}
                      onClick={(e) => { e.stopPropagation(); onStatusChange(job.id, s); setShowMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-indigo-50 transition-colors ${job.status === s ? 'text-indigo-600 font-black bg-indigo-50/50' : 'text-slate-600 font-bold'}`}
                    >
                      {s}
                    </button>
                  ))}
                  <div className="h-px bg-slate-100 my-2 mx-2" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(job.id); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 font-black uppercase tracking-wider"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-100">
          <MapPin className="w-3 h-3 text-slate-400" />
          <span className="truncate">{job.location || 'Remote'}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-100">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{job.date_applied}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
        <button 
          onClick={() => onAiOptimize('cover-letter', `${job.position} at ${job.company}. ${job.notes || ''}`)}
          className="flex-1 bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
        >
          <Sparkles className="w-3 h-3" />
          Optimize
        </button>
        <button 
          onClick={() => onAiOptimize('resume-tips', `${job.position} at ${job.company}. ${job.notes || ''}`)}
          className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
          title="Resume Tips"
        >
          <TrendingUp className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
