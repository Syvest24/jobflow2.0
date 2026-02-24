import React from 'react';
import { BarChart3, TrendingUp, Target, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Job } from '../types';

interface AnalyticsProps {
  jobs: Job[];
}

export function Analytics({ jobs }: AnalyticsProps) {
  // Calculate metrics
  const stats = {
    total: jobs.length,
    applied: jobs.filter(j => j.status === 'Applied').length,
    interviewing: jobs.filter(j => j.status === 'Interviewing').length,
    offers: jobs.filter(j => j.status === 'Offer').length,
    rejected: jobs.filter(j => j.status === 'Rejected').length,
    wishlist: jobs.filter(j => j.status === 'Wishlist').length,
  };

  const conversionRate = stats.total > 0 ? ((stats.offers / stats.applied) * 100).toFixed(1) : 0;
  const responseRate = stats.applied > 0 
    ? (((stats.interviewing + stats.offers + stats.rejected) / stats.applied) * 100).toFixed(1) 
    : 0;

  // Group jobs by month
  const jobsByMonth: Record<string, number> = {};
  jobs.forEach(job => {
    if (job.created_at) {
      const month = new Date(job.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      jobsByMonth[month] = (jobsByMonth[month] || 0) + 1;
    }
  });

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`${color} p-6 rounded-2xl border border-white/20 backdrop-blur-xl`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <Icon className="w-12 h-12 opacity-30" />
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Job Search Analytics</h2>
        <p className="text-slate-600">Track your job application journey</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          icon={Target} 
          label="Total Applications" 
          value={stats.total}
          color="bg-gradient-to-br from-blue-50 to-blue-100"
        />
        <StatCard 
          icon={TrendingUp} 
          label="In Interviews" 
          value={stats.interviewing}
          color="bg-gradient-to-br from-amber-50 to-amber-100"
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Offers Received" 
          value={stats.offers}
          color="bg-gradient-to-br from-emerald-50 to-emerald-100"
        />
        <StatCard 
          icon={XCircle} 
          label="Rejections" 
          value={stats.rejected}
          color="bg-gradient-to-br from-rose-50 to-rose-100"
        />
        <StatCard 
          icon={Clock} 
          label="Response Rate" 
          value={`${responseRate}%`}
          color="bg-gradient-to-br from-purple-50 to-purple-100"
        />
        <StatCard 
          icon={BarChart3} 
          label="Offer Rate" 
          value={`${conversionRate}%`}
          color="bg-gradient-to-br from-indigo-50 to-indigo-100"
        />
      </div>

      {/* Status Distribution */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-2xl shadow-slate-200/40">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Status Distribution</h3>
        <div className="space-y-4">
          {[
            { label: 'Wishlist', count: stats.wishlist, color: 'bg-slate-300' },
            { label: 'Applied', count: stats.applied, color: 'bg-blue-400' },
            { label: 'Interviewing', count: stats.interviewing, color: 'bg-amber-400' },
            { label: 'Offers', count: stats.offers, color: 'bg-emerald-400' },
            { label: 'Rejected', count: stats.rejected, color: 'bg-rose-400' },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-slate-700">{item.label}</span>
                <span className="font-bold text-slate-900">{item.count}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%` }}
                  transition={{ duration: 0.8 }}
                  className={`h-full ${item.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {Object.keys(jobsByMonth).length > 0 && (
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-2xl shadow-slate-200/40">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Applications Over Time</h3>
          <div className="flex items-end justify-between gap-2 h-40">
            {Object.entries(jobsByMonth).map(([month, count]) => (
              <div key={month} className="flex-1 flex flex-col items-center group">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(count / Math.max(...Object.values(jobsByMonth))) * 100}%` }}
                  transition={{ duration: 0.8 }}
                  className="w-full bg-gradient-to-t from-indigo-500 to-indigo-300 rounded-t-lg group-hover:from-indigo-600 group-hover:to-indigo-400 transition-colors"
                />
                <p className="text-xs font-medium text-slate-600 mt-3 text-center">{month}</p>
                <p className="text-sm font-bold text-slate-900">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
