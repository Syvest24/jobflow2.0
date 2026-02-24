import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Sparkles, Mail, Github, Linkedin, FileText, Upload, Edit3, CheckCircle2, XCircle,
  Award, Globe, BookOpen, Briefcase, Code, ExternalLink, Trash2, Plus, X, Calendar
} from 'lucide-react';
import { Portfolio, Experience, Project, Certificate } from '../types';

interface EnhancedPortfolioProps {
  portfolio: Portfolio | null;
  isAdmin: boolean;
  isEditingPortfolio: boolean;
  setIsEditingPortfolio: (value: boolean) => void;
  editPortfolioData: Portfolio | null;
  setEditPortfolioData: (value: Portfolio | null) => void;
  onUpdatePortfolio: (data: Portfolio) => Promise<void>;
  onCvUpload: (file: File, lang: 'en' | 'de') => Promise<void>;
  onDownloadCv: (lang: 'en' | 'de') => void;
}

export function EnhancedPortfolio({
  portfolio,
  isAdmin,
  isEditingPortfolio,
  setIsEditingPortfolio,
  editPortfolioData,
  setEditPortfolioData,
  onUpdatePortfolio,
  onCvUpload,
  onDownloadCv
}: EnhancedPortfolioProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'experience' | 'projects' | 'certificates'>('overview');
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isAddingCertificate, setIsAddingCertificate] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);

  if (!portfolio) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Loading Portfolio</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto pb-20"
    >
      {isEditingPortfolio ? (
        // Edit Mode
        <div className="bg-white p-8 rounded-3xl border-2 border-indigo-300 shadow-lg ring-2 ring-indigo-200 space-y-6">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider mb-6">Editing Profile</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Full Name</label>
              <input 
                type="text" 
                value={editPortfolioData?.name || ''}
                onChange={(e) => setEditPortfolioData({...editPortfolioData!, name: e.target.value})}
                className="form-input"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Title</label>
              <input 
                type="text"
                value={editPortfolioData?.title || ''}
                onChange={(e) => setEditPortfolioData({...editPortfolioData!, title: e.target.value})}
                className="form-input"
                placeholder="Your title"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">About Me</label>
            <textarea 
              value={editPortfolioData?.about || ''}
              onChange={(e) => setEditPortfolioData({...editPortfolioData!, about: e.target.value})}
              className="form-textarea"
              placeholder="Tell us about yourself"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Email</label>
              <input 
                type="email"
                value={editPortfolioData?.email || ''}
                onChange={(e) => setEditPortfolioData({...editPortfolioData!, email: e.target.value})}
                className="form-input"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">LinkedIn</label>
              <input 
                type="url"
                value={editPortfolioData?.linkedin || ''}
                onChange={(e) => setEditPortfolioData({...editPortfolioData!, linkedin: e.target.value})}
                className="form-input"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">GitHub</label>
              <input 
                type="url"
                value={editPortfolioData?.github || ''}
                onChange={(e) => setEditPortfolioData({...editPortfolioData!, github: e.target.value})}
                className="form-input"
                placeholder="https://github.com/..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Skills (comma-separated)</label>
            <textarea 
              value={editPortfolioData?.skills?.join(', ') || ''}
              onChange={(e) => setEditPortfolioData({...editPortfolioData!, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
              className="form-textarea"
              placeholder="React, TypeScript, Node.js"
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={async () => {
                await onUpdatePortfolio(editPortfolioData!);
                setIsEditingPortfolio(false);
              }}
              className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
            >
              <CheckCircle2 className="w-4 h-4 inline mr-2" />
              Save Changes
            </button>
            <button 
              onClick={() => {
                setEditPortfolioData(portfolio);
                setIsEditingPortfolio(false);
              }}
              className="flex-1 bg-slate-200 text-slate-900 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
            >
              <XCircle className="w-4 h-4 inline mr-2" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <div className="relative pt-12 text-center mb-12">
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

            {/* Social Links */}
            <div className="flex justify-center gap-6 pt-12">
              {portfolio.github && (
                <a href={portfolio.github} target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-white rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center text-slate-400 hover:text-slate-900 border border-slate-100">
                  <Github className="w-6 h-6" />
                </a>
              )}
              {portfolio.linkedin && (
                <a href={portfolio.linkedin} target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-white rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center text-slate-400 hover:text-blue-600 border border-slate-100">
                  <Linkedin className="w-6 h-6" />
                </a>
              )}
              {portfolio.email && (
                <a href={`mailto:${portfolio.email}`} className="w-14 h-14 bg-white rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center text-slate-400 hover:text-indigo-600 border border-slate-100">
                  <Mail className="w-6 h-6" />
                </a>
              )}
            </div>

            {/* CV Download Section */}
            <div className="flex flex-col items-center gap-8 pt-16">
              <div className="flex flex-wrap justify-center gap-6">
                <div className="group">
                  {portfolio.cvs?.en ? (
                    <button 
                      onClick={() => onDownloadCv('en')}
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
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && onCvUpload(e.target.files[0], 'en')} />
                    </label>
                  )}
                </div>

                <div className="group">
                  {portfolio.cvs?.de ? (
                    <button 
                      onClick={() => onDownloadCv('de')}
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
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && onCvUpload(e.target.files[0], 'de')} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-2 border-b border-slate-200 mb-12 overflow-x-auto">
            {(['overview', 'experience', 'projects', 'certificates'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-bold capitalize border-b-2 transition-colors text-sm uppercase tracking-widest whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-12"
              >
                {/* About Section */}
                <div className="lg:col-span-7 space-y-8">
                  <section className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm">
                    <h2 className="text-3xl font-black mb-8 flex items-center gap-3 uppercase tracking-tight">
                      <Sparkles className="w-6 h-6 text-indigo-600" />
                      About
                    </h2>
                    <p className="text-slate-600 leading-relaxed text-lg font-medium">{portfolio.about}</p>
                  </section>

                  <section className="bg-slate-900 p-12 rounded-3xl shadow-2xl">
                    <h2 className="text-3xl font-black mb-8 flex items-center gap-3 text-white uppercase tracking-tight">
                      <Globe className="w-6 h-6" />
                      Languages
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                      {portfolio.languages?.map(lang => (
                        <div key={lang.name} className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                          <div className="font-black text-white text-lg">{lang.name}</div>
                          <div className="text-[10px] text-indigo-400 uppercase font-black tracking-widest mt-1">{lang.level}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Skills & Certs Column */}
                <div className="lg:col-span-5 space-y-8">
                  <section className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
                    <h2 className="text-2xl font-black mb-8 flex items-center gap-3 uppercase tracking-tight">
                      <Award className="w-5 h-5 text-indigo-600" />
                      Skills
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {portfolio.skills?.map((skill, index) => (
                        <motion.span 
                          key={skill} 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.1 }}
                          className="px-5 py-3 bg-indigo-50 text-indigo-700 rounded-2xl text-xs font-black uppercase tracking-wider border border-indigo-200"
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </section>

                  <section className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
                    <h2 className="text-2xl font-black mb-8 flex items-center gap-3 uppercase tracking-tight">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      Certifications
                    </h2>
                    <ul className="space-y-3">
                      {portfolio.certifications?.map(cert => (
                        <li key={cert} className="flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="text-slate-600 font-medium text-sm">{cert}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </motion.div>
            )}

            {activeTab === 'experience' && (
              <motion.div
                key="experience"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {portfolio.experience?.map(exp => (
                  <motion.div
                    key={exp.id}
                    className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-colors"
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900">{exp.role}</h3>
                        <p className="text-indigo-600 font-bold">{exp.company}</p>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-600 mb-4">{exp.description}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                      <Calendar className="w-4 h-4" />
                      {exp.startDate} - {exp.endDate || 'Present'}
                    </div>
                    {exp.technologies && exp.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {exp.technologies.map(tech => (
                          <span key={tech} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}

                {isAdmin && (
                  <button
                    onClick={() => setIsAddingExperience(true)}
                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:text-indigo-600 hover:border-indigo-600 transition-colors font-bold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Experience
                  </button>
                )}
              </motion.div>
            )}

            {activeTab === 'projects' && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {portfolio.projects?.map(project => (
                  <motion.div
                    key={project.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-indigo-300 transition-colors group"
                    whileHover={{ y: -5 }}
                  >
                    {project.image && (
                      <div className="h-40 bg-slate-200 overflow-hidden group-hover:opacity-90 transition-opacity">
                        <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-black text-slate-900 mb-2">{project.title}</h3>
                      <p className="text-slate-600 text-sm mb-4">{project.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.technologies.map(tech => (
                          <span key={tech} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                            {tech}
                          </span>
                        ))}
                      </div>
                      {project.link && (
                        <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 font-bold text-sm flex items-center gap-1">
                          View Project <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {isAdmin && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                          <button className="flex-1 py-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-sm font-bold flex items-center justify-center gap-1">
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>
                          <button className="flex-1 py-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-sm font-bold flex items-center justify-center gap-1">
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isAdmin && (
                  <button
                    onClick={() => setIsAddingProject(true)}
                    className="py-8 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:text-indigo-600 hover:border-indigo-600 transition-colors font-bold flex flex-col items-center justify-center gap-2"
                  >
                    <Plus className="w-6 h-6" />
                    Add Project
                  </button>
                )}
              </motion.div>
            )}

            {activeTab === 'certificates' && (
              <motion.div
                key="certificates"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {portfolio.certificates?.map(cert => (
                  <motion.div
                    key={cert.id}
                    className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-colors flex items-center justify-between"
                    whileHover={{ x: 5 }}
                  >
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{cert.name}</h3>
                      <p className="text-slate-600 text-sm">{cert.issuer} • {cert.date}</p>
                      {cert.credentialUrl && (
                        <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 font-bold text-sm mt-2 flex items-center gap-1">
                          View Credential <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}

                {isAdmin && (
                  <button
                    onClick={() => setIsAddingCertificate(true)}
                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:text-indigo-600 hover:border-indigo-600 transition-colors font-bold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Certificate
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
