import { useId, useRef } from "react";

import type {
    ApplicationSortField,
    ApplicationStatus,
    JobType,
    SortOrder,
} from "../../types";
import {
    applicationStatusOptions,
    getApplicationStatusLabel,
    getJobTypeLabel,
    jobTypeOptions,
} from "./applicationUi";
import "./ApplicationToolbar.css";

interface ApplicationSortOption {
    value: string;
    label: string;
    sortBy: ApplicationSortField;
    sortOrder: SortOrder;
}

const applicationSortOptions: ReadonlyArray<ApplicationSortOption> = [
    {
        value: "createdAt:desc",
        label: "Recently added",
        sortBy: "createdAt",
        sortOrder: "desc",
    },
    {
        value: "createdAt:asc",
        label: "Oldest added",
        sortBy: "createdAt",
        sortOrder: "asc",
    },
    {
        value: "appliedAt:desc",
        label: "Recently applied",
        sortBy: "appliedAt",
        sortOrder: "desc",
    },
    {
        value: "appliedAt:asc",
        label: "Earliest applied",
        sortBy: "appliedAt",
        sortOrder: "asc",
    },
    {
        value: "company:asc",
        label: "Company A–Z",
        sortBy: "company",
        sortOrder: "asc",
    },
    {
        value: "company:desc",
        label: "Company Z–A",
        sortBy: "company",
        sortOrder: "desc",
    },
    {
        value: "salaryMax:desc",
        label: "Highest compensation",
        sortBy: "salaryMax",
        sortOrder: "desc",
    },
    {
        value: "salaryMax:asc",
        label: "Lowest compensation",
        sortBy: "salaryMax",
        sortOrder: "asc",
    },
];

const DEFAULT_SORT_VALUE = "createdAt:desc";

export interface ApplicationToolbarProps {
    search: string;
    status: ApplicationStatus | "";
    jobType: JobType | "";
    sortBy: ApplicationSortField;
    sortOrder: SortOrder;

    onSearchChange: (value: string) => void;
    onStatusChange: (value: ApplicationStatus | "") => void;
    onJobTypeChange: (value: JobType | "") => void;
    onSortChange: (
        sortBy: ApplicationSortField,
        sortOrder: SortOrder,
    ) => void;

    onClearSearch: () => void;
    onClearStatus: () => void;
    onClearJobType: () => void;
    onClearAll: () => void;
}

function SearchIcon() {
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
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
        </svg>
    );
}

function CloseIcon() {
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
            <path d="m6 6 12 12" />
            <path d="m18 6-12 12" />
        </svg>
    );
}

export default function ApplicationToolbar({
    search,
    status,
    jobType,
    sortBy,
    sortOrder,
    onSearchChange,
    onStatusChange,
    onJobTypeChange,
    onSortChange,
    onClearSearch,
    onClearStatus,
    onClearJobType,
    onClearAll,
}: ApplicationToolbarProps) {
    const searchId = useId();
    const statusId = useId();
    const jobTypeId = useId();
    const sortId = useId();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const statusSelectRef = useRef<HTMLSelectElement>(null);
    const jobTypeSelectRef = useRef<HTMLSelectElement>(null);

    const hasActiveFilters =
        search.length > 0 || status !== "" || jobType !== "";
    const currentSortOption = applicationSortOptions.find(
        (option) =>
            option.sortBy === sortBy && option.sortOrder === sortOrder,
    );
    const currentSortValue = currentSortOption?.value ?? DEFAULT_SORT_VALUE;
    const currentSortLabel = currentSortOption?.label ?? "Recently added";

    function handleClearSearch(): void {
        onClearSearch();
        searchInputRef.current?.focus();
    }

    function handleClearStatus(): void {
        onClearStatus();
        statusSelectRef.current?.focus();
    }

    function handleClearJobType(): void {
        onClearJobType();
        jobTypeSelectRef.current?.focus();
    }

    function handleClearAll(): void {
        onClearAll();
        searchInputRef.current?.focus();
    }

    return (
        <section
            className="application-toolbar"
            aria-label="Application filters"
        >
            <div className="application-toolbar-controls">
                <div className="application-toolbar-field application-toolbar-search-field">
                    <label
                        className="application-toolbar-sr-only"
                        htmlFor={searchId}
                    >
                        Search
                    </label>

                    <div className="application-toolbar-search">
                        <span
                            className="application-toolbar-search-icon"
                            aria-hidden="true"
                        >
                            <SearchIcon />
                        </span>

                        <input
                            id={searchId}
                            ref={searchInputRef}
                            type="search"
                            className="application-toolbar-search-input"
                            placeholder="Search applications..."
                            value={search}
                            autoComplete="off"
                            onChange={(event) =>
                                onSearchChange(event.target.value)
                            }
                        />

                        {search.length > 0 && (
                            <button
                                type="button"
                                className="application-toolbar-search-clear"
                                aria-label="Clear search"
                                title="Clear search"
                                onClick={handleClearSearch}
                            >
                                <CloseIcon />
                            </button>
                        )}
                    </div>
                </div>

                <div className="application-toolbar-field">
                    <label
                        className="application-toolbar-sr-only"
                        htmlFor={statusId}
                    >
                        Status
                    </label>

                    <div className="application-toolbar-select-wrap">
                        <select
                            id={statusId}
                            ref={statusSelectRef}
                            className="application-toolbar-select"
                            value={status}
                            onChange={(event) =>
                                onStatusChange(
                                    event.target.value as
                                        | ApplicationStatus
                                        | "",
                                )
                            }
                        >
                            <option value="">All</option>
                            {applicationStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <span
                            className="application-toolbar-select-value"
                            aria-hidden="true"
                        >
                            <span className="application-toolbar-select-value-text">
                                {status === ""
                                    ? "Status: All"
                                    : `Status: ${getApplicationStatusLabel(
                                          status,
                                      )}`}
                            </span>
                        </span>
                    </div>
                </div>

                <div className="application-toolbar-field">
                    <label
                        className="application-toolbar-sr-only"
                        htmlFor={jobTypeId}
                    >
                        Job type
                    </label>

                    <div className="application-toolbar-select-wrap">
                        <select
                            id={jobTypeId}
                            ref={jobTypeSelectRef}
                            className="application-toolbar-select"
                            value={jobType}
                            onChange={(event) =>
                                onJobTypeChange(
                                    event.target.value as JobType | "",
                                )
                            }
                        >
                            <option value="">All Types</option>
                            {jobTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <span
                            className="application-toolbar-select-value"
                            aria-hidden="true"
                        >
                            <span className="application-toolbar-select-value-text">
                                {jobType === ""
                                    ? "Job Type: All Types"
                                    : `Job Type: ${getJobTypeLabel(jobType)}`}
                            </span>
                        </span>
                    </div>
                </div>

                <div className="application-toolbar-field application-toolbar-sort-field">
                    <label
                        className="application-toolbar-sr-only"
                        htmlFor={sortId}
                    >
                        Sort by
                    </label>

                    <div className="application-toolbar-select-wrap">
                        <select
                            id={sortId}
                            className="application-toolbar-select"
                            value={currentSortValue}
                            onChange={(event) => {
                                const selectedSort =
                                    applicationSortOptions.find(
                                        (option) =>
                                            option.value ===
                                            event.target.value,
                                    );

                                if (selectedSort) {
                                    onSortChange(
                                        selectedSort.sortBy,
                                        selectedSort.sortOrder,
                                    );
                                }
                            }}
                        >
                            {applicationSortOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <span
                            className="application-toolbar-select-value"
                            aria-hidden="true"
                        >
                            <span className="application-toolbar-select-value-text">
                                {`Sort by: ${currentSortLabel}`}
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            {hasActiveFilters && (
                <div className="application-toolbar-active-filters">
                    <ul
                        className="application-toolbar-chips"
                        aria-label="Active filters"
                    >
                        {search.length > 0 && (
                            <li className="application-toolbar-chip">
                                <span className="application-toolbar-chip-text">
                                    <span className="application-toolbar-chip-key">
                                        Search:
                                    </span>{" "}
                                    {search}
                                </span>

                                <button
                                    type="button"
                                    className="application-toolbar-chip-remove"
                                    aria-label={`Remove search filter: ${search}`}
                                    title="Remove search filter"
                                    onClick={handleClearSearch}
                                >
                                    <CloseIcon />
                                </button>
                            </li>
                        )}

                        {status !== "" && (
                            <li className="application-toolbar-chip">
                                <span className="application-toolbar-chip-text">
                                    <span className="application-toolbar-chip-key">
                                        Status:
                                    </span>{" "}
                                    {getApplicationStatusLabel(status)}
                                </span>

                                <button
                                    type="button"
                                    className="application-toolbar-chip-remove"
                                    aria-label={`Remove status filter: ${getApplicationStatusLabel(
                                        status,
                                    )}`}
                                    title="Remove status filter"
                                    onClick={handleClearStatus}
                                >
                                    <CloseIcon />
                                </button>
                            </li>
                        )}

                        {jobType !== "" && (
                            <li className="application-toolbar-chip">
                                <span className="application-toolbar-chip-text">
                                    <span className="application-toolbar-chip-key">
                                        Job type:
                                    </span>{" "}
                                    {getJobTypeLabel(jobType)}
                                </span>

                                <button
                                    type="button"
                                    className="application-toolbar-chip-remove"
                                    aria-label={`Remove job type filter: ${getJobTypeLabel(
                                        jobType,
                                    )}`}
                                    title="Remove job type filter"
                                    onClick={handleClearJobType}
                                >
                                    <CloseIcon />
                                </button>
                            </li>
                        )}
                    </ul>

                    <button
                        type="button"
                        className="application-toolbar-clear-all"
                        aria-label="Clear all filters"
                        onClick={handleClearAll}
                    >
                        Clear all
                    </button>
                </div>
            )}
        </section>
    );
}
