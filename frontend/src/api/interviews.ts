import { apiRequest } from "./client";
import type { Interview, InterviewType } from "../types";

export interface InterviewInput {
    type: InterviewType;
    scheduledAt: string;
    location?: string | null;
    meetingUrl?: string | null;
    notes?: string | null;
}

export interface InterviewListResponse {
    message: string;
    count: number;
    interviews: Interview[];
}

export interface InterviewResponse {
    message: string;
    interview: Interview;
}

export function getInterviews(
    token: string,
    applicationId: number,
): Promise<InterviewListResponse> {
    return apiRequest<InterviewListResponse>(
        `/applications/${applicationId}/interviews`,
        {
            method: "GET",
            token,
        },
    );
}

export function getInterview(
    token: string,
    applicationId: number,
    interviewId: number,
): Promise<InterviewResponse> {
    return apiRequest<InterviewResponse>(
        `/applications/${applicationId}/interviews/${interviewId}`,
        {
            method: "GET",
            token,
        },
    );
}

export function createInterview(
    token: string,
    applicationId: number,
    input: InterviewInput,
): Promise<InterviewResponse> {
    return apiRequest<InterviewResponse>(
        `/applications/${applicationId}/interviews`,
        {
            method: "POST",
            token,
            body: input,
        },
    );
}

export function updateInterview(
    token: string,
    applicationId: number,
    interviewId: number,
    input: Partial<InterviewInput>,
): Promise<InterviewResponse> {
    return apiRequest<InterviewResponse>(
        `/applications/${applicationId}/interviews/${interviewId}`,
        {
            method: "PATCH",
            token,
            body: input,
        },
    );
}

export function deleteInterview(
    token: string,
    applicationId: number,
    interviewId: number,
): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(
        `/applications/${applicationId}/interviews/${interviewId}`,
        {
            method: "DELETE",
            token,
        },
    );
}