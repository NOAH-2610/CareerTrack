import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/authContext";
import { getApplications } from "../api/applications";
import { ApiError } from "../api/client";
import type { Application } from "../types";
import ApplicationForm from "../components/ApplicationForm";
import "./ApplicationsPage.css";

function formatStatus(status: Application["status"]): string {
    const labels: Record<Application["status"], string> = {
        WISHLIST: "Wishlist",
        APPLIED: "Applied",
        ASSESSMENT: "Assessment",
        INTERVIEW: "Interview",
        OFFER: "Offer",
        REJECTED: "Rejected",
        WITHDRAWN: "Withdrawn",
    };

    return labels[status];
}

function formatJobType(jobType: Application["jobType"]): string {
    const labels: Record<Application["jobType"], string> = {
        FULL_TIME: "Full-time",
        PART_TIME: "Part-time",
        CONTRACT: "Contract",
        INTERNSHIP: "Internship",
        FREELANCE: "Freelance",
    };

    return labels[jobType];
}

export default function ApplicationsPage() {
    const { token } = useAuth();

    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        let isActive = true;

        async function fetchApplications() {
            if (!token) {
                if (isActive) {
                    setError("Your session is unavailable. Please log in again.");
                    setIsLoading(false);
                }
                return;
            }

            try {
                const response = await getApplications(token);

                if (isActive) {
                    setApplications(response.applications);
                    setError(null);
                }
            } catch (err) {
                if (isActive) {
                    setError(
                        err instanceof ApiError
                            ? err.message
                            : "Unable to load your applications.",
                    );
                }
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        }

        void fetchApplications();

        return () => {
            isActive = false;
        };
    }, [token, refreshKey]);

    function handleApplicationCreated() {
        setShowForm(false);
        setIsLoading(true);
        setRefreshKey((current) => current + 1);
    }

    return (
        <main className="applications-page">
            <header className="applications-header">
                <div>
                    <Link to="/dashboard" className="back-link">
                        ← Dashboard
                    </Link>

                    <h1>My Applications</h1>
                    <p>Keep track of your job applications in one place.</p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="primary-button"
                        onClick={() => setShowForm(true)}
                    >
                        + Add Application
                    </button>
                )}
            </header>

            {showForm && token ? (
                <ApplicationForm
                    token={token}
                    onCreated={handleApplicationCreated}
                    onCancel={() => setShowForm(false)}
                />
            ) : (
                <>
                    {isLoading && (
                        <section className="applications-message">
                            <p>Loading your applications...</p>
                        </section>
                    )}

                    {!isLoading && error && (
                        <section className="applications-message applications-error">
                            <p>{error}</p>
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => {
                                    setIsLoading(true);
                                    setRefreshKey((current) => current + 1);
                                }}
                            >
                                Try again
                            </button>
                        </section>
                    )}

                    {!isLoading && !error && applications.length === 0 && (
                        <section className="applications-message applications-empty">
                            <h2>No applications yet</h2>
                            <p>
                                Your job applications will appear here once
                                you add your first one.
                            </p>
                        </section>
                    )}

                    {!isLoading && !error && applications.length > 0 && (
                        <>
                            <div className="applications-summary">
                                {applications.length}{" "}
                                {applications.length === 1
                                    ? "application"
                                    : "applications"}
                            </div>

                            <section className="applications-list">
                                {applications.map((application) => (
                                    <article
                                        className="application-card"
                                        key={application.id}
                                    >
                                        <div className="application-card-header">
                                            <div>
                                                <h2>{application.position}</h2>
                                                <p className="application-company">
                                                    {application.company?.name ??
                                                        "Unknown company"}
                                                </p>
                                            </div>

                                            <span
                                                className={`status-badge status-${application.status.toLowerCase()}`}
                                            >
                                                {formatStatus(application.status)}
                                            </span>
                                        </div>

                                        <div className="application-details">
                                            <span>
                                                {formatJobType(application.jobType)}
                                            </span>

                                            {application.location && (
                                                <span>{application.location}</span>
                                            )}

                                            {application.appliedAt && (
                                                <span>
                                                    Applied:{" "}
                                                    {new Date(
                                                        application.appliedAt,
                                                    ).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>

                                        {application.jobUrl && (
                                            <a
                                                href={application.jobUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="job-link"
                                            >
                                                View job posting ↗
                                            </a>
                                        )}
                                    </article>
                                ))}
                            </section>
                        </>
                    )}
                </>
            )}
        </main>
    );
}