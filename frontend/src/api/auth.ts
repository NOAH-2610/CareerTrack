import { apiRequest } from "./client";
import type {
    ApiMessageResponse,
    LoginResponse,
    RegisterResponse,
} from "../types";

export interface RegisterInput {
    name: string;
    email: string;
    password: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export function registerUser(
    input: RegisterInput,
): Promise<RegisterResponse> {
    return apiRequest<RegisterResponse>("/auth/register", {
        method: "POST",
        body: input,
    });
}

export function loginUser(input: LoginInput): Promise<LoginResponse> {
    return apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: input,
    });
}

export function getCurrentUser(token: string): Promise<ApiMessageResponse & {
    userId: number;
}> {
    return apiRequest("/auth/me", {
        method: "GET",
        token,
    });
}