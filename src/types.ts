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
