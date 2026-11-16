import { useId } from "react";

import type { Application, Company } from "../../types";
import ApplicationOverlay from "./ApplicationOverlay";
import ApplicationStatusBadge from "./ApplicationStatusBadge";
import {
    formatApplicationDate,
    formatCompensation,
    getJobTypeLabel,
} from "./applicationUi";
import "./ApplicationDetailDrawer.css";

const EMPTY_VALUE = "—";

function getSafeJobUrl(value: string | null | undefined): string | null {
    const trimmed = value?.trim();

    if (!trimmed) {
        return null;
    }

    try {
        const url = new URL(trimmed);

        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return null;
        }

        return trimmed;
    } catch {
        return null;
    }
}

export interface ApplicationDetailDrawerProps {
    isOpen: boolean;
    application: Application | null;
    company: Company | null;
    onClose: () => void;
    onEdit: (application: Application) => void;
    onDelete: (application: Application) => void;
}

function EditIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            <path d="M4 20h4.2L19 9.2a2.12 2.12 0 0 0-3-3L5.2 17 4 20Z" />
            <path d="m13.8 6.6 3 3" />
        </svg>
    );
}

function DeleteIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            <path d="M4 7h16" />
            <path d="M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
            <path d="m6.5 7 .9 12a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9l.9-12" />
            <path d="M10.2 11v6" />
            <path d="M13.8 11v6" />
        </svg>
    );
}

export default function ApplicationDetailDrawer({
    isOpen,
    application,
    company,
    onClose,
    onEdit,
    onDelete,
}: ApplicationDetailDrawerProps) {
    const sectionId = useId();

    if (!application) {
        return null;
    }

    const position = application.position.trim() || "Untitled position";
    const companyName =
        company?.name?.trim() ||
        application.company?.name?.trim() ||
        "Unknown company";
    const companyLocation = company?.location?.trim() || EMPTY_VALUE;
    const jobLocation = application.location?.trim() || EMPTY_VALUE;
    const jobUrl = getSafeJobUrl(application.jobUrl);

    return (
        <ApplicationOverlay
            isOpen={isOpen}
            onClose={onClose}
            variant="drawer"
            ariaLabel={`Application details for ${position} at ${companyName}`}
        >
            <div className="application-detail-drawer">
                <header className="application-detail-drawer-header">
                    <div className="application-detail-drawer-heading">
                        <p className="application-detail-drawer-eyebrow">
                            Application details
                        </p>
                        <h2 className="application-detail-drawer-title">
                            {position}
                        </h2>
                        <p className="application-detail-drawer-company">
                            {companyName}
                        </p>
                    </div>

                    <div className="application-detail-drawer-badge">
                        <ApplicationStatusBadge status={application.status} />
                    </div>
                </header>

                <div className="application-detail-drawer-body">
                    <section
                        className="application-detail-drawer-section"
                        aria-labelledby={`${sectionId}-job`}
                    >
                        <h3
                            id={`${sectionId}-job`}
                            className="application-detail-drawer-section-title"
                        >
                            Job information
                        </h3>

                        <dl className="application-detail-drawer-list">
                            <div className="application-detail-drawer-item">
                                <dt>Job type</dt>
                                <dd>{getJobTypeLabel(application.jobType)}</dd>
                            </div>

                            <div className="application-detail-drawer-item">
                                <dt>Job location</dt>
                                <dd>{jobLocation}</dd>
                            </div>

                            <div className="application-detail-drawer-item">
                                <dt>Job posting</dt>
                                <dd>
                                    {jobUrl ? (
                                        <a
                                            className="application-detail-drawer-link"
                                            href={jobUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={jobUrl}
                                            aria-label={`View job posting for ${position} at ${companyName} (opens in new tab)`}
                                        >
                                            {jobUrl}
                                            <span
                                                className="application-detail-drawer-link-icon"
                                                aria-hidden="true"
                                            >
                                                ↗
                                            </span>
                                        </a>
                                    ) : (
                                        EMPTY_VALUE
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section
                        className="application-detail-drawer-section"
                        aria-labelledby={`${sectionId}-company`}
                    >
                        <h3
                            id={`${sectionId}-company`}
                            className="application-detail-drawer-section-title"
                        >
                            Company information
                        </h3>

                        <dl className="application-detail-drawer-list">
                            <div className="application-detail-drawer-item">
                                <dt>Company name</dt>
                                <dd>{companyName}</dd>
                            </div>

                            <div className="application-detail-drawer-item">
                                <dt>Company location</dt>
                                <dd>{companyLocation}</dd>
                            </div>
                        </dl>
                    </section>

                    <section
                        className="application-detail-drawer-section"
                        aria-labelledby={`${sectionId}-compensation`}
                    >
                        <h3
                            id={`${sectionId}-compensation`}
                            className="application-detail-drawer-section-title"
                        >
                            Compensation
                        </h3>

                        <dl className="application-detail-drawer-list">
                            <div className="application-detail-drawer-item">
                                <dt>Salary range</dt>
                                <dd className="application-detail-drawer-compensation">
                                    {formatCompensation(
                                        application.salaryMin,
                                        application.salaryMax,
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section
                        className="application-detail-drawer-section"
                        aria-labelledby={`${sectionId}-timeline`}
                    >
                        <h3
                            id={`${sectionId}-timeline`}
                            className="application-detail-drawer-section-title"
                        >
                            Timeline
                        </h3>

                        <dl className="application-detail-drawer-list">
                            <div className="application-detail-drawer-item">
                                <dt>Applied</dt>
                                <dd>
                                    {formatApplicationDate(
                                        application.appliedAt,
                                    )}
                                </dd>
                            </div>

                            <div className="application-detail-drawer-item">
                                <dt>Created</dt>
                                <dd>
                                    {formatApplicationDate(
                                        application.createdAt,
                                    )}
                                </dd>
                            </div>

                            <div className="application-detail-drawer-item">
                                <dt>Last updated</dt>
                                <dd>
                                    {formatApplicationDate(
                                        application.updatedAt,
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </section>
                </div>

                <footer className="application-detail-drawer-actions">
                    <button
                        type="button"
                        className="application-detail-drawer-button application-detail-drawer-button-danger"
                        onClick={() => onDelete(application)}
                    >
                        <DeleteIcon />
                        <span>Delete application</span>
                    </button>

                    <button
                        type="button"
                        className="application-detail-drawer-button application-detail-drawer-button-primary"
                        onClick={() => onEdit(application)}
                    >
                        <EditIcon />
                        <span>Edit application</span>
                    </button>
                </footer>
            </div>
        </ApplicationOverlay>
    );
}
