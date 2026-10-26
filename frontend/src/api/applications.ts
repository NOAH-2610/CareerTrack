import { apiRequest } from "./client";
import type {
    Application,
    ApplicationStatus,
    JobType,
} from "../types";

export interface ApplicationInput {
    companyId: number;
    position: string;
    jobType: JobType;
    jobUrl?: string | null;
    location?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    status?: ApplicationStatus;
    appliedAt?: string | null;
}

export interface ApplicationListResponse {
    message: string;
    count: number;
    applications: Application[];
}

export interface ApplicationResponse {
    message: string;
    application: Application;
}

export function getApplications(
    token: string,
): Promise<ApplicationListResponse> {
    return apiRequest<ApplicationListResponse>("/applications", {
        method: "GET",
        token,
    });
}

export function getApplication(
    token: string,
    applicationId: number,
): Promise<ApplicationResponse> {
    return apiRequest<ApplicationResponse>(
        `/applications/${applicationId}`,
        {
            method: "GET",
            token,
        },
    );
}

export function createApplication(
    token: string,
    input: ApplicationInput,
): Promise<ApplicationResponse> {
    return apiRequest<ApplicationResponse>("/applications", {
        method: "POST",
        token,
        body: input,
    });
}

export function updateApplication(
    token: string,
    applicationId: number,
    input: Partial<ApplicationInput>,
): Promise<ApplicationResponse> {
    return apiRequest<ApplicationResponse>(
        `/applications/${applicationId}`,
        {
            method: "PATCH",
            token,
            body: input,
        },
    );
}

export function deleteApplication(
    token: string,
    applicationId: number,
): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(
        `/applications/${applicationId}`,
        {
            method: "DELETE",
            token,
        },
    );
}