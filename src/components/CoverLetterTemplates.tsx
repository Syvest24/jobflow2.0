import React, { useState } from 'react';
import { Save, Trash2, Eye, Plus, Check, X, Lock, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { CoverLetterTemplate } from '../types';

interface TemplatesProps {
  templates: CoverLetterTemplate[];
  onSave: (template: CoverLetterTemplate) => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
  onLoginRequired?: () => void;
}

export function CoverLetterTemplates({ templates, onSave, onDelete, isAdmin = false, onLoginRequired }: TemplatesProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<CoverLetterTemplate>>({
    name: '',
    content: '',
    description: '',
  });
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handleSave = () => {
    if (!isAdmin) {
      onLoginRequired?.();
      return;
    }

    if (!newTemplate.name || !newTemplate.content) {
      alert('Please fill in name and content');
      return;
    }

    const template: CoverLetterTemplate = {
      id: editingId || `template_${Date.now()}`,
      name: newTemplate.name!,
      content: newTemplate.content!,
      description: newTemplate.description,
      created_at: editingId ? templates.find(t => t.id === editingId)?.created_at || new Date().toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(template);
    setNewTemplate({ name: '', content: '', description: '' });
    setIsCreating(false);
    setEditingId(null);
  };

  const startEdit = (template: CoverLetterTemplate) => {
    if (!isAdmin) {
      onLoginRequired?.();
      return;
    }
    setNewTemplate(template);
    setEditingId(template.id);
    setIsCreating(true);
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      onLoginRequired?.();
      return;
    }
    if (confirm('Are you sure you want to delete this template?')) {
      onDelete(id);
    }
  };

  const handleCancel = () => {
    setNewTemplate({ name: '', content: '', description: '' });
    setIsCreating(false);
    setEditingId(null);
  };

  if (!isAdmin && templates.length === 0) {
    return (
      <div className="max-w-5xl mx-auto pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl border-2 border-dashed border-indigo-200 p-12 text-center"
        >
          <Lock className="w-16 h-16 text-indigo-600 mx-auto mb-4 opacity-50" />
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Admin Access Required</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Log in with your admin password to create and manage cover letter templates.
          </p>
          <p className="text-sm text-slate-500">Click the login icon in the top right corner to get started.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-6">
      <div>
        <h2 className="text-5xl font-black tracking-tighter text-slate-900 mb-4 flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-[1.5rem] flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          Cover Letter Templates
        </h2>
        <p className="text-lg text-slate-400 font-bold uppercase tracking-widest">Save and reuse your best cover letter formats</p>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200 space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Template Name</label>
            <input
              type="text"
              value={newTemplate.name || ''}
              onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
              placeholder="e.g., Tech Company Standard"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Description (Optional)</label>
            <input
              type="text"
              value={newTemplate.description || ''}
              onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
              placeholder="e.g., For startup positions, emphasizes growth"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Content</label>
            <textarea
              value={newTemplate.content || ''}
              onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })}
              placeholder="Dear [Company],

I am writing to express my strong interest in the [Position] role at [Company]..."
              rows={10}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update Template' : 'Save Template'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Templates List */}
      <div className="space-y-4">
        {templates.length === 0 && !isCreating && (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <Plus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">No templates yet. Create your first one!</p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Template
            </button>
          </div>
        )}

        {templates.map((template, idx) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
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
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Preview"
                >
                  <Eye className="w-5 h-5 text-slate-600" />
                </button>
                <button
                  onClick={() => startEdit(template)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Edit"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete"
                  disabled={!isAdmin}
                >
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </button>
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

            {/* Meta Info */}
            <div className="text-xs text-slate-500 mt-4 flex justify-between">
              <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
              <span>Updated: {new Date(template.updated_at).toLocaleDateString()}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-2xl font-medium hover:border-indigo-600 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Template
        </button>
      )}
    </div>
  );
}
