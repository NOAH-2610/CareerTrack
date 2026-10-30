import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/authContext";

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({
    children,
}: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    
    if (isLoading) {
        return (
            <main className="loading-screen">
                <p>Checking your session...</p>
            </main>
        );
    }

    if (!isAuthenticated) {
        return (
            <Navigate 
                to="/login"
                replace
                state={{ from: location }}
                />
        );
    }

    return<>{children}</>;
}