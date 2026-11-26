import { Link } from "react-router-dom";

import type { Application } from "../../types";
import ApplicationStatusBadge from "../applications/ApplicationStatusBadge";
import { formatApplicationDate } from "../applications/applicationUi";
import "./RecentApplications.css";

interface RecentApplicationsProps {
    applications: Application[];
}

interface RecentApplicationDate {
    label: "Applied" | "Added" | null;
    dateTime: string | null;
    display: string;
}

function isValidDateValue(value: string | null | undefined): value is string {
    if (!value) {
        return false;
    }

    return !Number.isNaN(new Date(value).getTime());
}

function getRecentApplicationDate(
    application: Application,
): RecentApplicationDate {
    if (isValidDateValue(application.appliedAt)) {
        return {
            label: "Applied",
            dateTime: application.appliedAt,
            display: formatApplicationDate(application.appliedAt),
        };
    }

    if (isValidDateValue(application.createdAt)) {
        return {
            label: "Added",
            dateTime: application.createdAt,
            display: formatApplicationDate(application.createdAt),
        };
    }

    return {
        label: null,
        dateTime: null,
        display: "—",
    };
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

    return (
        <section
            className="recent-applications"
            aria-labelledby="recent-applications-heading"
        >
            <div className="recent-applications-header">
                <h2 id="recent-applications-heading">Recent Applications</h2>

                <Link
                    className="recent-applications-view-all"
                    to="/applications"
                >
                    View all applications
                </Link>
            </div>

            {recentApplications.length === 0 ? (
                <p className="recent-empty-message">
                    Applications you add will appear here.
                </p>
            ) : (
                <ul className="recent-applications-list">
                    {recentApplications.map((application) => {
                        const date = getRecentApplicationDate(application);
                        const position =
                            application.position.trim() ||
                            "Untitled position";
                        const companyName =
                            application.company?.name?.trim() ||
                            "Unknown company";

                        return (
                            <li
                                className="recent-application-item"
                                key={application.id}
                            >
                                <div className="recent-application-details">
                                    <h3>{position}</h3>

                                    <p>{companyName}</p>
                                </div>

                                <div className="recent-application-meta">
                                    <ApplicationStatusBadge
                                        status={application.status}
                                    />

                                    {date.dateTime && date.label ? (
                                        <time
                                            className="recent-application-date"
                                            dateTime={date.dateTime}
                                        >
                                            {date.label} {date.display}
                                        </time>
                                    ) : (
                                        <span className="recent-application-date">
                                            {date.display}
                                        </span>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
