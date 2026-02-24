import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, Plus, Eye, Trash2, Check, X, Copy, Download, Edit3, 
  Send, Clock, CheckCircle, Sparkles, BookOpen, Save
} from 'lucide-react';
import { CoverLetterTemplate, CoverLetterDraft, Job } from '../types';

interface ApplicationMaterialsProps {
  templates: CoverLetterTemplate[];
  jobs: Job[];
  isAdmin: boolean;
  onSaveTemplate: (template: CoverLetterTemplate) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
  onCreateDraft: (draft: CoverLetterDraft) => Promise<void>;
  onUpdateDraft: (id: string, data: Partial<CoverLetterDraft>) => Promise<void>;
  onDeleteDraft: (id: string) => Promise<void>;
  onLoginRequired: () => void;
}

export function ApplicationMaterials({
  templates,
  jobs,
  isAdmin,
  onSaveTemplate,
  onDeleteTemplate,
  onCreateDraft,
  onUpdateDraft,
  onDeleteDraft,
  onLoginRequired
}: ApplicationMaterialsProps) {
  const [activeTab, setActiveTab] = useState<'drafts' | 'templates'>('drafts');
  const [drafts, setDrafts] = useState<CoverLetterDraft[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Template form state
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<CoverLetterTemplate>>({
    name: '',
    content: '',
    description: ''
  });
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  
  // Draft form state
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [draftContent, setDraftContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  
  // Preview state
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const res = await fetch('/api/drafts');
      const data = await res.json();
      setDrafts(data);
    } catch (err) {
      console.error('Failed to fetch drafts', err);
    }
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !selectedJob) {
      alert('Please select a template and job');
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    try {
      setLoading(true);
      
      // Substitute variables in template
      let content = template.content;
      const variables: Record<string, string> = {
        '[COMPANY_NAME]': selectedJob.company || '',
        '[POSITION]': selectedJob.position || '',
        '[JOB_DESCRIPTION]': selectedJob.notes || '',
        '[YOUR_NAME]': 'Your Name',
        '[SALARY]': selectedJob.salary || '',
      };

      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(new RegExp(key, 'g'), value);
      });

      setDraftContent(content);
      setIsCreatingDraft(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedJob || !draftContent) {
      alert('Please select a job and add content');
      return;
    }

    const draft: CoverLetterDraft = {
      id: editingDraftId || `draft_${Date.now()}`,
      jobId: selectedJob.id,
      company: selectedJob.company,
      position: selectedJob.position,
      content: draftContent,
      templateUsed: selectedTemplate ? templates.find(t => t.id === selectedTemplate)?.name : undefined,
      createdFrom: selectedTemplate ? 'template' : 'manual',
      status: 'draft',
      versionNumber: 1,
      created_at: editingDraftId ? new Date().toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      setLoading(true);
      if (editingDraftId) {
        await onUpdateDraft(editingDraftId, draft);
      } else {
        await onCreateDraft(draft);
      }
      await fetchDrafts();
      resetDraftForm();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!isAdmin) {
      onLoginRequired();
      return;
    }

    if (!newTemplate.name || !newTemplate.content) {
      alert('Please fill in template name and content');
      return;
    }

    const template: CoverLetterTemplate = {
      id: editingTemplateId || `template_${Date.now()}`,
      name: newTemplate.name!,
      content: newTemplate.content!,
      description: newTemplate.description,
      created_at: editingTemplateId ? templates.find(t => t.id === editingTemplateId)?.created_at || new Date().toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      setLoading(true);
      await onSaveTemplate(template);
      setNewTemplate({ name: '', content: '', description: '' });
      setIsCreatingTemplate(false);
      setEditingTemplateId(null);
    } finally {
      setLoading(false);
    }
  };

  const resetDraftForm = () => {
    setDraftContent('');
    setSelectedJob(null);
    setSelectedTemplate(null);
    setEditingDraftId(null);
    setIsCreatingDraft(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const exportToPDF = async (draft: CoverLetterDraft) => {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8"/>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
              .header { margin-bottom: 30px; border-bottom: 2px solid #1e40af; padding-bottom: 20px; }
              .title { font-size: 28px; font-weight: bold; color: #1e40af; }
              .meta { color: #666; font-size: 12px; margin: 8px 0; }
              .content { white-space: pre-wrap; line-height: 1.8; font-family: 'Georgia', serif; }
              .footer { margin-top: 40px; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">${draft.position}</div>
              <div class="meta">${draft.company}</div>
              <div class="meta">Generated: ${new Date().toLocaleDateString()}</div>
              <div class="meta">Version: ${draft.versionNumber}</div>
            </div>
            <div class="content">${draft.content}</div>
            <div class="footer">This cover letter was generated using JobFlow.</div>
          </body>
        </html>
      `;

      const element = document.createElement('div');
      element.innerHTML = html;
      const opt = {
        margin: 10,
        filename: `${draft.position.replace(/\s+/g, '_')}_${draft.company.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Failed to export PDF', err);
      alert('Error exporting to PDF');
    }
  };

  const exportToWord = async (draft: CoverLetterDraft) => {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      
      const paragraphs = draft.content.split('\n').map((line: string) => 
        new Paragraph({
          text: line || ' ',
          spacing: { line: 360, lineRule: 'auto' }
        })
      );

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              text: draft.position,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 }
            }),
            new Paragraph({
              text: draft.company,
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 400 }
            }),
            new Paragraph({
              text: `Version ${draft.versionNumber} • ${new Date().toLocaleDateString()}`,
              spacing: { after: 400 },
              style: 'Heading3'
            }),
            ...paragraphs
          ]
        }]
      });

      Packer.toBlob(doc).then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${draft.position.replace(/\s+/g, '_')}_${draft.company.replace(/\s+/g, '_')}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      console.error('Failed to export Word', err);
      alert('Error exporting to Word');
    }
  };

  if (!isAdmin && drafts.length === 0 && templates.length === 0) {
    return (
      <div className="max-w-5xl mx-auto pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl border-2 border-dashed border-indigo-200 p-12 text-center"
        >
          <FileText className="w-16 h-16 text-indigo-600 mx-auto mb-4 opacity-50" />
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Application Materials</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Log in to create and manage cover letters, templates, and application drafts.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto pb-20"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900">Application Materials</h2>
            <p className="text-slate-600 font-bold">Manage cover letters, templates & drafts</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 mb-8">
        {(['drafts', 'templates'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-bold capitalize border-b-2 transition-colors text-sm uppercase tracking-widest ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab === 'drafts' ? '📝 Drafts' : '📋 Templates'}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'drafts' && (
          <motion.div
            key="drafts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Create/Edit Draft Form */}
            {isCreatingDraft && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200 space-y-4"
              >
                <h3 className="text-lg font-bold text-slate-900">
                  {editingDraftId ? 'Edit Draft' : 'Create New Draft'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Select Job</label>
                    <select
                      value={selectedJob?.id || ''}
                      onChange={(e) => setSelectedJob(jobs.find(j => j.id === e.target.value) || null)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Choose a job...</option>
                      {jobs.map(job => (
                        <option key={job.id} value={job.id}>
                          {job.position} @ {job.company}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Apply Template (Optional)</label>
                    <select
                      value={selectedTemplate || ''}
                      onChange={(e) => {
                        setSelectedTemplate(e.target.value || null);
                        if (e.target.value) handleApplyTemplate();
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Choose template...</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Cover Letter Content</label>
                  <textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    placeholder="Your cover letter content..."
                    rows={12}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    💡 Use [COMPANY_NAME], [POSITION], [YOUR_NAME] for auto-substitution
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={resetDraftForm}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Draft'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Drafts List */}
            <div className="space-y-4">
              {drafts.length === 0 && !isCreatingDraft && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">No drafts yet. Create your first one!</p>
                  {isAdmin && (
                    <button
                      onClick={() => setIsCreatingDraft(true)}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Create Draft
                    </button>
                  )}
                </div>
              )}

              {drafts.map((draft, idx) => (
                <motion.div
                  key={draft.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {draft.position} @ {draft.company}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          draft.status === 'sent' 
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {draft.status === 'sent' ? '✓ Sent' : '✎ Draft'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        Version {draft.versionNumber} • 
                        Created {new Date(draft.created_at).toLocaleDateString()}
                        {draft.templateUsed && ` • From: ${draft.templateUsed}`}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setPreviewId(previewId === draft.id ? null : draft.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                        title="Preview"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(draft.content)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                        title="Copy"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setDraftContent(draft.content);
                              setSelectedJob(jobs.find(j => j.id === draft.jobId) || null);
                              setEditingDraftId(draft.id);
                              setIsCreatingDraft(true);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                            title="Edit"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this draft?')) {
                                onDeleteDraft(draft.id);
                                setDrafts(drafts.filter(d => d.id !== draft.id));
                              }
                            }}
                            className="p-2 hover:bg-rose-50 rounded-lg transition-colors text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Preview */}
                  {previewId === draft.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 space-y-4"
                    >
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 max-h-64 overflow-y-auto">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                          {draft.content}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => exportToPDF(draft)}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                          title="Export as PDF"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </button>
                        <button
                          onClick={() => exportToWord(draft)}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-2"
                          title="Export as Word"
                        >
                          <Download className="w-4 h-4" />
                          Word
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            {isAdmin && !isCreatingDraft && (
              <button
                onClick={() => setIsCreatingDraft(true)}
                className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-2xl font-medium hover:border-indigo-600 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create New Draft
              </button>
            )}
          </motion.div>
        )}

        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Template Form */}
            {isCreatingTemplate && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200 space-y-4"
              >
                <h3 className="text-lg font-bold text-slate-900">
                  {editingTemplateId ? 'Edit Template' : 'Create New Template'}
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={newTemplate.name || ''}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="e.g., Tech Startup Standard"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description (Optional)</label>
                  <input
                    type="text"
                    value={newTemplate.description || ''}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="When to use this template..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Content</label>
                  <textarea
                    value={newTemplate.content || ''}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    placeholder="Dear [COMPANY_NAME],&#10;&#10;I am writing to express my strong interest in the [POSITION] position..."
                    rows={10}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    💡 Use variables: [COMPANY_NAME], [POSITION], [YOUR_NAME], [SALARY], [JOB_DESCRIPTION]
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setNewTemplate({ name: '', content: '', description: '' });
                      setIsCreatingTemplate(false);
                      setEditingTemplateId(null);
                    }}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Templates List */}
            <div className="space-y-4">
              {templates.length === 0 && !isCreatingTemplate && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">No templates yet. Create your first one!</p>
                  {isAdmin && (
                    <button
                      onClick={() => setIsCreatingTemplate(true)}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Create Template
                    </button>
                  )}
                </div>
              )}

              {templates.map((template, idx) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{template.name}</h3>
                      {template.description && (
                        <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPreviewId(previewId === template.id ? null : template.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                        title="Preview"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setNewTemplate(template);
                              setEditingTemplateId(template.id);
                              setIsCreatingTemplate(true);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                            title="Edit"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this template?')) {
                                onDeleteTemplate(template.id);
                              }
                            }}
                            className="p-2 hover:bg-rose-50 rounded-lg transition-colors text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Preview */}
                  {previewId === template.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 max-h-64 overflow-y-auto"
                    >
                      <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                        {template.content}
                      </p>
                    </motion.div>
                  )}

                  <div className="text-xs text-slate-500 mt-4 flex justify-between">
                    <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                    <span>Updated: {new Date(template.updated_at).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {isAdmin && !isCreatingTemplate && (
              <button
                onClick={() => setIsCreatingTemplate(true)}
                className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-2xl font-medium hover:border-indigo-600 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add New Template
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
