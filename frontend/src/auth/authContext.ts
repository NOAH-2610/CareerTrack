import { createContext, useContext } from "react";
import type { LoginInput, RegisterInput } from "../api/auth";
import type { RegisterResponse, User } from "../types";

export interface AuthContextValue {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    authError: string | null;

    login: (input: LoginInput) => Promise<void>;
    register: (input: RegisterInput) => Promise<RegisterResponse>;
    logout: () => void;
    retrySession: () => Promise<void>;
}

export const AuthContext = createContext<
    AuthContextValue | undefined
>(undefined);

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error(
            "useAuth must be used within an AuthProvider.",
        );
    }

    return context;
}