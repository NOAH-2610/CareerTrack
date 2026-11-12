import type { Application } from "../../types";
import "./StatusOverview.css";

interface StatusOverviewProps {
    applications: Application[];
}

const statusOptions: {
    status: Application["status"];
    label: string;
}[] = [
    { status: "WISHLIST", label: "Wishlist" },
    { status: "APPLIED", label: "Applied" },
    { status: "ASSESSMENT", label: "Assessment" },
    { status: "INTERVIEW", label: "Interview" },
    { status: "OFFER", label: "Offer" },
    { status: "REJECTED", label: "Rejected" },
    { status: "WITHDRAWN", label: "Withdrawn" },
];

export default function StatusOverview({
    applications,
}: StatusOverviewProps) {
    const totalApplications = applications.length;

    return (
        <section className="status-overview">
            <h2>Application Status Overview</h2>

            <div className="status-list">
                {statusOptions.map(({ status, label }) => {
                    const count = applications.filter(
                        (application) => application.status === status,
                    ).length;

                    const percentage =
                        totalApplications > 0
                            ? (count / totalApplications) * 100
                            : 0;

                    return (
                        <div className="status-item" key={status}>
                            <div className="status-item-header">
                                <span>{label}</span>
                                <span>
                                    {count} ({percentage.toFixed(0)}%)
                                </span>
                            </div>

                            <div
                                className="status-progress-track"
                                role="progressbar"
                                aria-label={`${label} applications`}
                                aria-valuenow={percentage}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            >
                                <div
                                    className={`status-progress-fill status-${status.toLowerCase()}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}