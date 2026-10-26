import { apiRequest } from "./client";
import type { Company } from "../types";

export interface CompanyInput {
    name: string;
    website?: string | null;
    location?: string | null;
}

export interface CompanyListResponse {
    message: string;
    count: number;
    companies: Company[];
}

export interface CompanyResponse {
    message: string;
    company: Company;
}

export function getCompanies(token: string): Promise<CompanyListResponse> {
    return apiRequest<CompanyListResponse>("/companies", {
        method: "GET",
        token,
    });
}

export function getCompany(
    token: string,
    companyId: number,
): Promise<CompanyResponse> {
    return apiRequest<CompanyResponse>(`/companies/${companyId}`, {
        method: "GET",
        token,
    });
}

export function createCompany(
    token: string,
    input: CompanyInput,
): Promise<CompanyResponse> {
    return apiRequest<CompanyResponse>("/companies", {
        method: "POST",
        token,
        body: input,
    });
}

export function updateCompany(
    token: string,
    companyId: number,
    input: Partial<CompanyInput>,
): Promise<CompanyResponse> {
    return apiRequest<CompanyResponse>(`/companies/${companyId}`, {
        method: "PATCH",
        token,
        body: input,
    });
}

export function deleteCompany(
    token: string,
    companyId: number,
): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/companies/${companyId}`, {
        method: "DELETE",
        token,
    });
}