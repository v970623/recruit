export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary: number | null;
  postedAt: Date;
  updatedAt: Date;
  publisherId: string;
  status: "OPEN" | "CLOSED";
  publisher?: User;
  applications?: Application[];
}

export interface Application {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  appliedAt: Date;
  updatedAt: Date;
  coverLetter: string;
  resumeUrl: string | null;
  applicantId: string;
  applicant: User;
  jobId: string;
  job: Job;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string | null;
  role: "ADMIN" | "APPLICANT" | "RECRUITER";
  createdAt: Date;
  updatedAt: Date;
  applications?: Application[];
  publishedJobs?: Job[];
}

export interface JobFormData {
  title: string;
  description: string;
  location: string;
  salary?: number;
}

export type JobActionData = {
  error?: string;
  fields?: Partial<JobFormData>;
};

/**
 * Loader data for edit route
 */
export interface EditJobLoaderData {
  job: Job;
}

/**
 * Action data for edit route
 */
export type EditJobActionData = {
  success?: boolean;
  error?: string;
  fields?: Partial<JobFormData>;
};

/**
 * Publisher info in job detail
 */
export interface JobPublisherInfo {
  id: string;
  name: string | null;
  email: string;
}

/**
 * Job detail loader data
 */
export interface JobDetailLoaderData {
  id: string;
  title: string;
  description: string;
  location: string;
  salary: number | null;
  publisherId: string;
  status: "OPEN" | "CLOSED";
  postedAt: string;
  updatedAt: string;
  publisher: JobPublisherInfo;
  isPublisher: boolean;
  isAdmin: boolean;
  isApplicant: boolean;
  hasApplied: boolean;
  currentUser: {
    id: string;
    role: string;
  };
}
