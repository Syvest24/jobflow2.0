import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Copy, Volume2, CheckCircle2, Bookmark, Star, AlertCircle, Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Job, InterviewQuestion, InterviewEvaluation } from '../types';

interface InterviewPrepProps {
  selectedJob?: Job | null;
  onClose?: () => void;
}

interface PracticeSession {
  questionId: string;
  userAnswer: string;
  evaluation?: InterviewEvaluation;
  timeSpent: number;
  confidenceLevel: number;
}

export function InterviewPrep({ selectedJob = null, onClose }: InterviewPrepProps) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'technical' | 'behavioral' | 'situational'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentPracticeId, setCurrentPracticeId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [companyInput, setCompanyInput] = useState('');
  const [positionInput, setPositionInput] = useState('');
  const [showInsights, setShowInsights] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [practiceSessions, setPracticeSessions] = useState<Map<string, PracticeSession>>(new Map());

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
        const parsedQuestions = parseInterviewQuestions(data.questions);
        setQuestions(parsedQuestions);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompanyInsights = async () => {
    const company = selectedJob?.company || companyInput;
    const position = selectedJob?.position || positionInput;
    
    if (!company || !position) {
      alert('Please enter company and position');
      return;
    }

    setInsightsLoading(true);
    try {
      const response = await fetch('/api/ai/company-interview-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, position }),
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data);
        setShowInsights(true);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  };

  const evaluateAnswer = async (questionId: string, userAnswer: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !userAnswer.trim()) return;

    const company = selectedJob?.company || companyInput;
    const position = selectedJob?.position || positionInput;

    try {
      const response = await fetch('/api/ai/interview-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          userAnswer,
          suggestedAnswer: question.suggested_answer,
          position,
          company,
        }),
      });

      if (response.ok) {
        const evaluation = await response.json();
        const session: PracticeSession = {
          questionId,
          userAnswer,
          evaluation,
          timeSpent: 0,
          confidenceLevel: 70,
        };
        const newSessions = new Map(practiceSessions);
        newSessions.set(questionId, session);
        setPracticeSessions(newSessions);
        
        // Update the question with evaluation
        setQuestions(questions.map(q => 
          q.id === questionId 
            ? { ...q, userAnswer, evaluationScore: evaluation.score }
            : q
        ));
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
    }
  };

  const parseInterviewQuestions = (data: any): InterviewQuestion[] => {
    if (Array.isArray(data)) {
      return data.map((q, i) => ({
        id: `q${i}`,
        question: q.question || q,
        suggested_answer: q.answerTip || q.suggestedAnswer || '',
        keyPoints: q.keyPoints,
        followUpQuestions: q.followUpQuestions,
        difficulty: ['easy', 'medium', 'hard'][i % 3] as any,
        type: q.type || (['technical', 'behavioral', 'situational'][i % 3] as any),
        category: q.type || (['technical', 'behavioral', 'situational'][i % 3] as any),
        bookmarked: false,
        confidenceLevel: 0,
        practiced: false,
      }));
    }

    const lines = (data.questions || String(data)).split('\n').filter((line: string) => line.trim());
    return lines.slice(0, 12).map((line: string, i) => ({
      id: `q${i}`,
      question: line.replace(/^\d+\.\s|^-\s/, ''),
      difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
      type: i % 3 === 0 ? 'technical' : i % 3 === 1 ? 'behavioral' : 'situational',
      category: i % 3 === 0 ? 'technical' : i % 3 === 1 ? 'behavioral' : 'situational',
      bookmarked: false,
      confidenceLevel: 0,
      practiced: false,
    }));
  };

  const toggleBookmark = (id: string) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, bookmarked: !q.bookmarked } : q
    ));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredQuestions = questions.filter(q => 
    activeTab === 'all' || q.type === activeTab || q.category === activeTab
  );

  const bookmarkedQuestions = questions.filter(q => q.bookmarked).length;
  const practicedQuestions = questions.filter(q => q.practiced).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto pb-20"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-12 text-white rounded-3xl mb-12 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-8 h-8" />
          <h2 className="text-4xl font-black">Interview Preparation</h2>
        </div>
        <p className="text-indigo-100 text-lg">Master interviews with AI-powered questions, evaluations, and company insights</p>
        
        {questions.length > 0 && (
          <div className="flex gap-6 mt-6 pt-6 border-t border-indigo-400">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5" />
              <span>{bookmarkedQuestions} bookmarked</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>{practicedQuestions} practiced</span>
            </div>
          </div>
        )}
      </div>

      {/* Company Insights Section */}
      {insights && showInsights && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-8 rounded-3xl mb-8 shadow-sm"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-emerald-600" />
              <h3 className="text-2xl font-bold text-emerald-900">Company Interview Insights</h3>
            </div>
            <button
              onClick={() => setShowInsights(false)}
              className="text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-emerald-900 mb-2">Interview Format</h4>
              <p className="text-emerald-800">{insights.format}</p>
            </div>
            <div>
              <h4 className="font-bold text-emerald-900 mb-2">Timeline</h4>
              <p className="text-emerald-800">{insights.timeline}</p>
            </div>
            <div>
              <h4 className="font-bold text-emerald-900 mb-2">Valued Skills</h4>
              <div className="flex flex-wrap gap-2">
                {(insights.valuedSkills || []).map((skill: string, i: number) => (
                  <span key={i} className="bg-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-emerald-900 mb-2">Salary Range</h4>
              <p className="text-emerald-800 text-lg font-semibold">{insights.salaryRange}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-emerald-200">
            <h4 className="font-bold text-emerald-900 mb-2">Interview Tips</h4>
            <p className="text-emerald-800">{insights.interviewTips}</p>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="space-y-8">
        {!selectedJob && !questions.length && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Enter Job Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
            <div className="flex gap-3">
              <button
                onClick={generateInterviewQuestions}
                disabled={loading || (!companyInput && !positionInput)}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {loading ? 'Generating...' : 'Generate Questions'}
              </button>
              <button
                onClick={getCompanyInsights}
                disabled={insightsLoading || (!companyInput && !positionInput)}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
              >
                <Zap className="w-5 h-5" />
                {insightsLoading ? 'Loading...' : 'Get Insights'}
              </button>
            </div>
          </div>
        )}

        {selectedJob && (
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-200 flex items-center justify-between">
            <div>
              <p className="text-indigo-900 font-semibold">{selectedJob.company} - {selectedJob.position}</p>
            </div>
            {!questions.length && (
              <button
                onClick={generateInterviewQuestions}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? 'Generating...' : 'Generate'}
              </button>
            )}
          </div>
        )}

        {questions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <Sparkles className="w-16 h-16 text-indigo-300 mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Questions Generated Yet</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">Generate AI-powered interview questions based on the job description</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-8">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 mb-8 overflow-x-auto">
              {['all', 'technical', 'behavioral', 'situational'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-3 font-bold capitalize border-b-2 transition-colors text-sm uppercase tracking-widest whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab} ({questions.filter(q => tab === 'all' || q.type === tab).length})
                </button>
              ))}
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.map((q, idx) => {
                const session = practiceSessions.get(q.id);
                const isExpanded = expandedId === q.id;
                const isPracticing = currentPracticeId === q.id;

                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all"
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left group"
                    >
                      <div className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                        q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                        q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {q.difficulty}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{q.question}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded capitalize">{q.type}</span>
                          {session?.evaluation && (
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              session.evaluation.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                              session.evaluation.score >= 60 ? 'bg-amber-100 text-amber-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              Score: {session.evaluation.score}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(q.id);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Bookmark 
                            className={`w-5 h-5 ${q.bookmarked ? 'fill-indigo-600 text-indigo-600' : 'text-slate-400'}`}
                          />
                        </button>
                        <span className={isExpanded ? "rotate-180 text-slate-600" : "text-slate-400"}>▼</span>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-slate-200 bg-slate-50 p-6 space-y-4"
                        >
                          {/* Suggested Answer */}
                          {q.suggested_answer && (
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-2">Suggested Answer:</h4>
                              <p className="text-slate-700 leading-relaxed">{q.suggested_answer}</p>
                              <div className="flex gap-2 mt-3">
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
                                <button
                                  onClick={() => speakText(q.suggested_answer || '')}
                                  className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium"
                                >
                                  <Volume2 className="w-4 h-4" />
                                  Listen
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Key Points */}
                          {q.keyPoints && (
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-2">Key Points:</h4>
                              <p className="text-slate-700">{q.keyPoints}</p>
                            </div>
                          )}

                          {/* Practice Mode */}
                          <div className="border-t border-slate-200 pt-4">
                            {isPracticing ? (
                              <div className="space-y-3">
                                <h4 className="font-semibold text-slate-900">Your Answer:</h4>
                                <textarea
                                  id={`answer-${q.id}`}
                                  placeholder="Type your answer here..."
                                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                  rows={4}
                                  defaultValue={session?.userAnswer || ''}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const textarea = document.getElementById(`answer-${q.id}`) as HTMLTextAreaElement;
                                      if (textarea?.value) {
                                        evaluateAnswer(q.id, textarea.value);
                                      }
                                    }}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Sparkles className="w-4 h-4" />
                                    Get Feedback
                                  </button>
                                  <button
                                    onClick={() => setCurrentPracticeId(null)}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-bold transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setCurrentPracticeId(q.id)}
                                className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-2 px-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                              >
                                <TrendingUp className="w-4 h-4" />
                                Practice This Question
                              </button>
                            )}
                          </div>

                          {/* Evaluation */}
                          {session?.evaluation && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="border-t border-slate-200 pt-4 bg-white p-4 rounded-lg"
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                <span className="font-bold text-lg">Score: {session.evaluation.score}%</span>
                              </div>

                              {session.evaluation.strengths && session.evaluation.strengths.length > 0 && (
                                <div className="mb-3">
                                  <h5 className="font-semibold text-emerald-700 mb-1">✓ Strengths:</h5>
                                  <ul className="list-disc list-inside space-y-1">
                                    {session.evaluation.strengths.map((s, i) => (
                                      <li key={i} className="text-sm text-emerald-700">{s}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {session.evaluation.improvements && session.evaluation.improvements.length > 0 && (
                                <div className="mb-3">
                                  <h5 className="font-semibold text-rose-700 mb-1">✎ Areas to Improve:</h5>
                                  <ul className="list-disc list-inside space-y-1">
                                    {session.evaluation.improvements.map((imp, i) => (
                                      <li key={i} className="text-sm text-rose-700">{imp}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {session.evaluation.detailedFeedback && (
                                <div>
                                  <h5 className="font-semibold text-slate-700 mb-1">Feedback:</h5>
                                  <p className="text-sm text-slate-700">{session.evaluation.detailedFeedback}</p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Regenerate */}
            {questions.length > 0 && (
              <button
                onClick={() => {
                  setQuestions([]);
                  setPracticeSessions(new Map());
                  generateInterviewQuestions();
                }}
                disabled={loading}
                className="w-full bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50 text-indigo-700 py-3 rounded-xl font-bold transition-colors mt-8"
              >
                {loading ? 'Regenerating...' : 'Regenerate Different Questions'}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
