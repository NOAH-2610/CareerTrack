import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/authContext";
import { getApplications } from "../api/applications";
import { ApiError } from "../api/client";
import type { Application } from "../types";
import "./DashboardPage.css";
import AppLayout from "../components/layout/AppLayout";
import WelcomeSection from "../components/dashboard/WelcomeSection";
import ApplicationStats from "../components/dashboard/ApplicationStats";
import StatusOverview from "../components/dashboard/StatusOverview";
import RecentApplications from "../components/dashboard/RecentApplications";
import { countApplications } from "../components/dashboard/applicationCounts";

export default function DashboardPage() {
    const { user, token, logout } = useAuth();

    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const applicationCounts = useMemo(
        () => countApplications(applications),
        [applications],
    );

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
                    if (err instanceof ApiError && err.status === 401) {
                        logout();
                        return;
                    }

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
    }, [token, refreshKey, logout]);

    return (
        <AppLayout user={user} onLogout={logout} mainId="dashboard-main">
            <div className="dashboard-page">
                <WelcomeSection userName={user?.name ?? "User"} />

                {isLoading && (
                    <p className="dashboard-loading" role="status">
                        Loading your applications...
                    </p>
                )}

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
                        <ApplicationStats counts={applicationCounts} />

                        <StatusOverview counts={applicationCounts} />

                        <RecentApplications applications={applications} />
                    </>
                )}
            </div>
        </AppLayout>
    );
}