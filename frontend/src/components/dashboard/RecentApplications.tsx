import { Link } from "react-router-dom";
import type { Application } from "../../types";
import "./RecentApplications.css";

interface RecentApplicationsProps {
    applications: Application[];
}

export default function RecentApplications({
    applications,
}: RecentApplicationsProps) {
    const recentApplications = [...applications]
        .sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
        )
        .slice(0, 5);

    function formatDate(date: string) {
        return new Date(date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    return (
        <section className="recent-applications">
            <div className="recent-applications-header">
                <h2>Recent Applications</h2>

                <Link to="/applications">View all</Link>
            </div>

            {recentApplications.length === 0 ? (
                <p className="recent-empty-message">
                    You haven't added any applications yet.
                </p>
            ) : (
                <div className="recent-applications-list">
                    {recentApplications.map((application) => (
                        <article
                            className="recent-application-item"
                            key={application.id}
                        >
                            <div className="recent-application-details">
                                <h3>{application.position}</h3>

                                <p>
                                    {application.company?.name ??
                                        "Unknown company"}
                                </p>
                            </div>

                            <div className="recent-application-meta">
                                <span
                                    className={`recent-status status-${application.status.toLowerCase()}`}
                                >
                                    {application.status}
                                </span>

                                <time dateTime={application.createdAt}>
                                    {formatDate(
                                        application.appliedAt ??
                                            application.createdAt,
                                    )}
                                </time>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}