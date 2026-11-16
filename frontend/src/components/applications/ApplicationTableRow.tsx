import type { MouseEvent } from "react";

import type { Application, Company } from "../../types";
import ApplicationStatusBadge from "./ApplicationStatusBadge";
import {
    formatApplicationDate,
    formatCompensation,
    getJobTypeLabel,
} from "./applicationUi";
import "./ApplicationTableRow.css";

const EMPTY_VALUE = "—";

export interface ApplicationTableRowProps {
    application: Application;
    company?: Company;

    onRowClick?: (application: Application) => void;
    onEdit?: (application: Application) => void;
    onDelete?: (application: Application) => void;
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

export default function ApplicationTableRow({
    application,
    company,
    onRowClick,
    onEdit,
    onDelete,
}: ApplicationTableRowProps) {
    const companyName =
        company?.name?.trim() ||
        application.company?.name?.trim() ||
        "Unknown company";
    const companyLocation = company?.location?.trim() || EMPTY_VALUE;
    const position = application.position.trim() || EMPTY_VALUE;
    const accessiblePosition =
        application.position.trim() || "untitled position";

    function handleRowClick(): void {
        onRowClick?.(application);
    }

    function handleOpenClick(
        event: MouseEvent<HTMLButtonElement>,
    ): void {
        event.stopPropagation();
        onRowClick?.(application);
    }

    function handleEditClick(
        event: MouseEvent<HTMLButtonElement>,
    ): void {
        event.stopPropagation();
        onEdit?.(application);
    }

    function handleDeleteClick(
        event: MouseEvent<HTMLButtonElement>,
    ): void {
        event.stopPropagation();
        onDelete?.(application);
    }

    function handleJobLinkClick(
        event: MouseEvent<HTMLAnchorElement>,
    ): void {
        event.stopPropagation();
    }

    return (
        <tr
            className={
                onRowClick
                    ? "application-table-row application-table-row-clickable"
                    : "application-table-row"
            }
            onClick={onRowClick ? handleRowClick : undefined}
        >
            <td>
                <span className="application-table-primary">
                    {companyName}
                </span>
                <span className="application-table-secondary">
                    {companyLocation}
                </span>
            </td>

            <td>
                {onRowClick ? (
                    <button
                        type="button"
                        className="application-table-row-action"
                        aria-label={`Open details for ${accessiblePosition} at ${companyName}`}
                        onClick={handleOpenClick}
                    >
                        {position}
                    </button>
                ) : (
                    <span className="application-table-primary">
                        {position}
                    </span>
                )}
                <span className="application-table-secondary">
                    {getJobTypeLabel(application.jobType)}
                </span>
            </td>

            <td>
                <ApplicationStatusBadge status={application.status} />
            </td>

            <td className="application-table-date">
                {formatApplicationDate(application.appliedAt)}
            </td>

            <td className="application-table-compensation">
                {formatCompensation(
                    application.salaryMin,
                    application.salaryMax,
                )}
            </td>

            <td>
                {application.jobUrl ? (
                    <a
                        className="application-table-job-link"
                        href={application.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View job posting for ${accessiblePosition} at ${companyName} (opens in new tab)`}
                        onClick={handleJobLinkClick}
                    >
                        View job
                        <span
                            className="application-table-job-link-icon"
                            aria-hidden="true"
                        >
                            ↗
                        </span>
                    </a>
                ) : (
                    <span className="application-table-empty-value">
                        {EMPTY_VALUE}
                    </span>
                )}
            </td>

            <td className="application-table-actions">
                {(onEdit || onDelete) && (
                    <span className="application-table-action-group">
                        {onEdit && (
                            <button
                                type="button"
                                className="application-table-action application-table-action-edit"
                                aria-label={`Edit application for ${accessiblePosition} at ${companyName}`}
                                title="Edit application"
                                onClick={handleEditClick}
                            >
                                <EditIcon />
                            </button>
                        )}

                        {onDelete && (
                            <button
                                type="button"
                                className="application-table-action application-table-action-delete"
                                aria-label={`Delete application for ${accessiblePosition} at ${companyName}`}
                                title="Delete application"
                                onClick={handleDeleteClick}
                            >
                                <DeleteIcon />
                            </button>
                        )}
                    </span>
                )}
            </td>
        </tr>
    );
}
