// Values used by the backend API.

export type ApplicationStatus =
    | "WISHLIST"
    | "APPLIED"
    | "ASSESSMENT"
    | "INTERVIEW"
    | "OFFER"
    | "REJECTED"
    | "WITHDRAWN";

export type JobType =
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "INTERNSHIP"
    | "FREELANCE";

export type InterviewType =
    | "PHONE"
    | "TECHNICAL"
    | "HR"
    | "MANAGERIAL"
    | "FINAL"
    | "OTHER";

// User information returned by the authentication API.

export interface User {
    id: number;
    name: string;
    email: string;
}

// Company data returned by the API.

export interface Company {
    id: number;
    userId: number;
    name: string;
    website: string | null;
    location: string | null;
    createdAt: string;
    updatedAt: string;
}

// Job application data returned by the API.

export interface Application {
    id: number;
    userId: number;
    companyId: number;
    position: string;
    jobUrl: string | null;
    location: string | null;
    jobType: JobType;
    salaryMin: number | null;
    salaryMax: number | null;
    status: ApplicationStatus;
    appliedAt: string | null;
    createdAt: string;
    updatedAt: string;
    company?: {
        id: number;
        name: string;
    };
}

// Notes attached to job applications.

export interface Note {
    id: number;
    applicationId: number;
    content: string;
    createdAt: string;
    updatedAt: string;
}

// Interviews attached to job applications.

export interface Interview {
    id: number;
    applicationId: number;
    type: InterviewType;
    scheduledAt: string;
    location: string | null;
    meetingUrl: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

// Common API response structures.

export interface ApiMessageResponse {
    message: string;
}

export interface ApiListResponse<T> {
    message: string;
    count: number;
    [key: string]: string | number | T[] | undefined;
}

// Authentication responses.

export interface LoginResponse {
    message: string;
    token: string;
    user: User;
}

export interface RegisterResponse {
    message: string;
    user: User & {
        createdAt: string;
    };
}