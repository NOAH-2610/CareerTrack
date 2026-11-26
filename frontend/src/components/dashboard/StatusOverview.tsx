import { applicationStatusOptions } from "../applications/applicationUi";
import type { ApplicationStatusCounts } from "./applicationCounts";
import "./StatusOverview.css";

interface StatusOverviewProps {
    counts: ApplicationStatusCounts;
}

export default function StatusOverview({ counts }: StatusOverviewProps) {
    return (
        <section
            className="status-overview"
            aria-labelledby="status-overview-heading"
        >
            <h2 id="status-overview-heading">Application Status Overview</h2>

            {counts.total === 0 && (
                <p className="status-empty-message" role="status">
                    No applications tracked yet.
                </p>
            )}

            <ul className="status-list">
                {applicationStatusOptions.map(({ value: status, label }) => {
                    const count = counts[status];
                    const percentage =
                        counts.total > 0 ? (count / counts.total) * 100 : 0;
                    const roundedPercentage = Math.round(percentage);

                    return (
                        <li className="status-item" key={status}>
                            <div className="status-item-header">
                                <span>{label}</span>
                                <span>
                                    {count} ({roundedPercentage}%)
                                </span>
                            </div>

                            <div
                                className="status-progress-track"
                                role="progressbar"
                                aria-label={`${label} applications`}
                                aria-valuenow={roundedPercentage}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuetext={`${label}: ${count} of ${counts.total} applications (${roundedPercentage}%)`}
                            >
                                <div
                                    className={`status-progress-fill status-${status.toLowerCase()}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
