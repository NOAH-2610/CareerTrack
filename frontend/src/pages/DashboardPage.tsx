import { useEffect, useState } from "react";
import { useAuth } from "../auth/authContext";
import { getApplications } from "../api/applications";
import { ApiError } from "../api/client";
import type { Application } from "../types";
import "./DashboardPage.css";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import WelcomeSection from "../components/dashboard/WelcomeSection";
import ApplicationStats from "../components/dashboard/ApplicationStats";
import StatusOverview from "../components/dashboard/StatusOverview";
import RecentApplications from "../components/dashboard/RecentApplications";

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
        <>
            <DashboardHeader
                userName={user?.name ?? "User"}
                onLogout={logout}
            />

            <main className="dashboard-page">
                <WelcomeSection userName={user?.name ?? "User"} />

                <p className="dashboard-user-email">Email: {user?.email}</p>

                {isLoading && <p className="dashboard-loading">Loading your applications...</p>}

                {error && (
                    <div className="dashboard-error" role="alert">
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
                    <>
                        <ApplicationStats applications={applications} />

                        <StatusOverview applications={applications} />

                        <RecentApplications applications={applications} />
                    </>
                )}
            </main>
        </>
    );
}