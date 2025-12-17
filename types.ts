
export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  type: 'Full Time' | 'Part Time' | 'Contract' | 'Remote';
  category: string;
  salary: { min: number; max: number };
  description: string;
  postedDate: any;
  applicants: number;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  telegramId?: string;
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
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
  appliedAt: any;
}
