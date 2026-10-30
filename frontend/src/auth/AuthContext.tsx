import {
    useCallback,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import {
    getCurrentUser,
    loginUser,
    registerUser,
    type LoginInput,
    type RegisterInput,
} from "../api/auth";

import { ApiError } from "../api/client";
import type { RegisterResponse, User } from "../types";
import { AuthContext, type AuthContextValue } from "./authContext";

const TOKEN_STORAGE_KEY = "careertrack_token";
const USER_STORAGE_KEY = "careertrack_user";

interface AuthProviderProps {
    children: ReactNode;
}

interface SessionCheckResult {
    user: User | null;
    error: string | null;
}

function isUser(value: unknown): value is User {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const candidate = value as Record<string, unknown>;

    return (
        typeof candidate.id === "number" &&
        Number.isSafeInteger(candidate.id) &&
        candidate.id > 0 &&
        typeof candidate.name === "string" &&
        typeof candidate.email === "string"
    );
}

function clearStoredSession(): void {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
}

/**
 * Reads and verifies the saved session without updating React state.
 */
async function verifyStoredSession(): Promise<SessionCheckResult> {
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = sessionStorage.getItem(USER_STORAGE_KEY);

    if (!token || !storedUser) {
        clearStoredSession();

        return {
            user: null,
            error: null,
        };
    }

    let parsedUser: unknown;

    try {
        parsedUser = JSON.parse(storedUser);
    } catch {
        clearStoredSession();

        return {
            user: null,
            error: null,
        };
    }

    if (!isUser(parsedUser)) {
        clearStoredSession();

        return {
            user: null,
            error: null,
        };
    }

    try {
        const response = await getCurrentUser(token);

        if (response.userId !== parsedUser.id) {
            clearStoredSession();

            return {
                user: null,
                error: null,
            };
        }

        return {
            user: parsedUser,
            error: null,
        };
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            clearStoredSession();

            return {
                user: null,
                error: null,
            };
        }

        return {
            user: null,
            error:
                error instanceof Error
                    ? error.message
                    : "Unable to verify your session.",
        };
    }
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    /**
     * Restore the session when the application starts.
     * State updates happen after asynchronous verification.
     */
    useEffect(() => {
        let cancelled = false;

        async function initializeSession(): Promise<void> {
            const result = await verifyStoredSession();

            if (cancelled) {
                return;
            }

            setUser(result.user);
            setAuthError(result.error);
            setIsLoading(false);
        }

        void initializeSession();

        return () => {
            cancelled = true;
        };
    }, []);

    /**
     * Recheck the current session when requested.
     */
    const retrySession = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        setAuthError(null);

        try {
            const result = await verifyStoredSession();

            setUser(result.user);
            setAuthError(result.error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Authenticate an existing user.
     */
    const login = useCallback(
        async (input: LoginInput): Promise<void> => {
            setAuthError(null);

            const response = await loginUser(input);

            sessionStorage.setItem(TOKEN_STORAGE_KEY, response.token);
            sessionStorage.setItem(
                USER_STORAGE_KEY,
                JSON.stringify(response.user),
            );

            setUser(response.user);
        },
        [],
    );

    /**
     * Register a new user.
     * Registration does not automatically log the user in.
     */
    const register = useCallback(
        async (input: RegisterInput): Promise<RegisterResponse> => {
            return registerUser(input);
        },
        [],
    );

    /**
     * Clear the session and log the user out.
     */
    const logout = useCallback((): void => {
        clearStoredSession();
        setUser(null);
        setAuthError(null);
    }, []);

    const value: AuthContextValue = {
        user,
        isAuthenticated: user !== null,
        isLoading,
        authError,
        login,
        register,
        logout,
        retrySession,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}