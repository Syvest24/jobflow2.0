import React, { useState } from 'react';
import { Sparkles, Send, Copy, Volume2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Job, InterviewQuestion } from '../types';

interface InterviewPrepProps {
  selectedJob?: Job | null;
  onClose?: () => void;
}

export function InterviewPrep({ selectedJob = null, onClose }: InterviewPrepProps) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'technical' | 'behavioral' | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [companyInput, setCompanyInput] = useState('');
  const [positionInput, setPositionInput] = useState('');

  const generateInterviewQuestions = async () => {
    const company = selectedJob?.company || companyInput;
    const position = selectedJob?.position || positionInput;
    
    if (!company || !position) {
      alert('Please enter company and position');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          position,
          description: selectedJob?.notes || '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Parse AI response into questions
        const parsedQuestions = parseInterviewQuestions(data.questions);
        setQuestions(parsedQuestions);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseInterviewQuestions = (text: string): InterviewQuestion[] => {
    // Parse the AI response into structured questions
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map((line, i) => ({
      id: `q${i}`,
      question: line.replace(/^\d+\.\s|^-\s/, ''),
      difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
      category: i % 2 === 0 ? 'technical' : 'behavioral',
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredQuestions = questions.filter(q => 
    activeTab === 'all' || q.category === activeTab
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto pb-20"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-12 text-white rounded-3xl mb-12 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-8 h-8" />
          <h2 className="text-4xl font-black">Interview Preparation</h2>
        </div>
        <p className="text-indigo-100 text-lg">Get AI-powered interview questions to prepare for your next opportunity</p>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {!selectedJob && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Enter Job Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Company</label>
                <input
                  type="text"
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  placeholder="e.g., Google, Microsoft"
                  className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Position</label>
                <input
                  type="text"
                  value={positionInput}
                  onChange={(e) => setPositionInput(e.target.value)}
                  placeholder="e.g., Software Engineer"
                  className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {selectedJob && (
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-200">
            <p className="text-indigo-900 font-semibold">{selectedJob.company} - {selectedJob.position}</p>
          </div>
        )}

        {questions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <Sparkles className="w-16 h-16 text-indigo-300 mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Questions Generated Yet</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">Generate AI-powered interview questions based on the job description to prepare for your interview</p>
            <button
              onClick={generateInterviewQuestions}
              disabled={loading || (!selectedJob && !companyInput && !positionInput)}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-bold transition-colors flex items-center gap-3 mx-auto text-lg"
            >
              <Sparkles className="w-5 h-5" />
              {loading ? 'Generating...' : 'Generate Questions'}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-8">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 mb-8">
              {['all', 'technical', 'behavioral'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-3 font-bold capitalize border-b-2 transition-colors text-sm uppercase tracking-widest ${
                    activeTab === tab
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.map((q, idx) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all"
                  >
                    <button
                      onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                      className="w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                        q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {q.difficulty}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{q.question}</p>
                        <p className="text-xs text-slate-500 mt-1 capitalize">{q.category}</p>
                      </div>
                      <div className="">
                        {expandedId === q.id ? '▼' : '▶'}
                      </div>
                    </button>

                    {expandedId === q.id && q.suggested_answer && (
                      <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">Suggested Answer:</h4>
                          <p className="text-slate-700 leading-relaxed">{q.suggested_answer}</p>
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-slate-200">
                          <button
                            onClick={() => copyToClipboard(q.suggested_answer || '', q.id)}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium"
                          >
                            {copiedId === q.id ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </button>
                          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium">
                            <Volume2 className="w-4 h-4" />
                            Listen
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Regenerate Button */}
              <button
                onClick={generateInterviewQuestions}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-4 rounded-xl font-bold transition-colors mt-8"
              >
                {loading ? 'Regenerating...' : 'Regenerate Questions'}
              </button>
            </div>
        )}
      </div>
    </motion.div>
  );
}
