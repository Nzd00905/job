
export interface Job {
  id: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  type: 'Full Time' | 'Part Time' | 'Contract' | 'Remote';
  category: string;
  salary: { min: number; max: number } | string;
  description: string;
  postedDate: any;
  applicants: number;
  amount: number;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  telegramId?: string;
  walletBalance?: number;
  savedJobIds?: string[];
  status?: 'approved' | 'pending' | 'banned';
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  telegramId: string;
  coverLetter: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'completed';
  appliedAt: any;
  jobTitle: string;
  company: string;
  logo: string;
  jobAmount: number;
}
