import { useEffect, useState } from "react";
import { useAuth } from "../auth/authContext";
import { getApplications } from "../api/applications";
import { ApiError } from "../api/client";
import type { Application } from "../types";

export default function DashboardPage() {
    const { user, token, logout } = useAuth();

    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let isActive = true;

        async function loadApplications() {
            if (!token) {
                setError("Your session is unavailable. Please log in again.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await getApplications(token);

                if (isActive) {
                    setApplications(response.applications);
                }
            } catch (err) {
                if (isActive) {
                    setError(
                        err instanceof ApiError
                            ? err.message
                            : "Something went wrong while loading applications.",
                    );
                }
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        }

        void loadApplications();

        return () => {
            isActive = false;
        };
    }, [token, refreshKey]);

    return (
        <main>
            <h1>CareerTrack Dashboard</h1>

            <p>Welcome, {user?.name}!</p>

            <p>Email: {user?.email}</p>

            {isLoading && <p>Loading your applications...</p>}

            {error && (
                <div role="alert">
                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={() => setRefreshKey((current) => current + 1)}
                    >
                        Try again
                    </button>
                </div>
            )}

            {!isLoading && !error && (
                <p>Total applications: {applications.length}</p>
            )}

            <button type="button" onClick={logout}>
                Log out
            </button>
        </main>
    );
}