import { apiRequest } from "./client";
import type {
    Application,
    ApplicationStatus,
    JobType,
    ApplicationPagination,
    ApplicationQueryParams,
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
    pagination?: ApplicationPagination;
}

export interface ApplicationResponse {
    message: string;
    application: Application;
}

export function getApplications(
    token: string,
    params?: ApplicationQueryParams,
): Promise<ApplicationListResponse> {
    const queryParams = new URLSearchParams();

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== "") {
                queryParams.append(key, String(value));
            }
    });
    }

    const queryString = queryParams.toString();

    const endpoint = queryString
        ? `/applications?${queryString}`
        : "/applications";

    return apiRequest<ApplicationListResponse>(endpoint, {
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