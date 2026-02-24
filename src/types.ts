export type JobStatus = 'Applied' | 'Interviewing' | 'Offer' | 'Rejected' | 'Wishlist';

export interface Job {
  id: string;
  company: string;
  position: string;
  status: JobStatus;
  date_applied?: string;
  link?: string;
  location?: string;
  salary?: string;
  notes?: string;
  created_at: string;
}

export interface NewJob {
  company: string;
  position: string;
  status: JobStatus;
  date_applied?: string;
  link?: string;
  location?: string;
  salary?: string;
  notes?: string;
}

export interface Portfolio {
  type: string;
  name: string;
  title: string;
  about: string;
  skills: string[];
  certifications: string[];
  languages: { name: string; level: string }[];
  email?: string;
  linkedin?: string;
  github?: string;
  location?: string;
  cvs?: {
    en?: { filename: string; updatedAt: string };
    de?: { filename: string; updatedAt: string };
  };
}

export interface CoverLetterTemplate {
  id: string;
  name: string;
  content: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Analytics {
  total_applications: number;
  applied: number;
  interviewing: number;
  offers: number;
  rejected: number;
  wishlist: number;
  conversion_rate: number;
  average_time_to_offer: number;
  applications_by_month: Record<string, number>;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  suggested_answer?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  job_id?: string;
  type?: 'technical' | 'behavioral' | 'situational';
  keyPoints?: string;
  answerTip?: string;
  followUpQuestions?: string[];
  bookmarked?: boolean;
  confidenceLevel?: number; // 0-100
  practiced?: boolean;
  userAnswer?: string;
}

export interface InterviewEvaluation {
  score: number; // 0-100
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
  suggestedAnswer?: string;
}

