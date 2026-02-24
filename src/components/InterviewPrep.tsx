import React, { useState } from 'react';
import { Sparkles, Send, Copy, Volume2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Job, InterviewQuestion } from '../types';

interface InterviewPrepProps {
  selectedJob: Job | null;
  onClose: () => void;
}

export function InterviewPrep({ selectedJob, onClose }: InterviewPrepProps) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'technical' | 'behavioral' | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateInterviewQuestions = async () => {
    if (!selectedJob) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: selectedJob.company,
          position: selectedJob.position,
          description: selectedJob.notes || '',
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Interview Preparation</h2>
          </div>
          {selectedJob && (
            <p className="text-indigo-100">{selectedJob.company} - {selectedJob.position}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-indigo-300 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Questions Generated Yet</h3>
              <p className="text-slate-600 mb-6">Generate AI-powered interview questions based on the job description</p>
              <button
                onClick={generateInterviewQuestions}
                disabled={loading || !selectedJob}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-5 h-5" />
                {loading ? 'Generating...' : 'Generate Questions'}
              </button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-2 border-b border-slate-200">
                {['all', 'technical', 'behavioral'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 font-medium capitalize border-b-2 transition-colors ${
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
              <div className="space-y-3">
                {filteredQuestions.map((q, idx) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-300 transition-colors"
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
                className="w-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-900 py-3 rounded-xl font-medium transition-colors"
              >
                {loading ? 'Regenerating...' : 'Regenerate Questions'}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
