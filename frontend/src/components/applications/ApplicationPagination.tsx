import type { ChangeEvent } from "react";

import type {
    ApplicationPagination as ApplicationPaginationMeta,
    ApplicationQueryParams,
} from "../../types";
import "./ApplicationPagination.css";

type PageSize = NonNullable<ApplicationQueryParams["limit"]>;

const PAGE_SIZE_OPTIONS: ReadonlyArray<PageSize> = [10, 25, 50];

export interface ApplicationPaginationProps {
    pagination: ApplicationPaginationMeta;
    pageSize: PageSize;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: PageSize) => void;
}

function PreviousIcon() {
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
            <path d="m14.5 6-6 6 6 6" />
        </svg>
    );
}

function NextIcon() {
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
            <path d="m9.5 6 6 6-6 6" />
        </svg>
    );
}

function isPageSize(value: number): value is PageSize {
    return PAGE_SIZE_OPTIONS.some((option) => option === value);
}

export default function ApplicationPagination({
    pagination,
    pageSize,
    onPageChange,
    onPageSizeChange,
}: ApplicationPaginationProps) {
    const {
        page,
        limit,
        totalItems,
        totalPages,
        hasPreviousPage,
        hasNextPage,
    } = pagination;

    const rangeStart = totalItems === 0 ? 0 : (page - 1) * limit + 1;
    const rangeEnd =
        totalItems === 0 ? 0 : Math.min(page * limit, totalItems);
    const resultsSummary =
        totalItems === 0
            ? "Showing 0 of 0"
            : `Showing ${rangeStart}–${rangeEnd} of ${totalItems}`;
    const pageStatus =
        totalPages === 0
            ? "Page 0 of 0"
            : `Page ${page} of ${totalPages}`;
    const hasNoPages = totalPages === 0;

    function handlePageSizeChange(
        event: ChangeEvent<HTMLSelectElement>,
    ): void {
        const nextPageSize = Number(event.target.value);

        if (isPageSize(nextPageSize)) {
            onPageSizeChange(nextPageSize);
        }
    }

    function handlePreviousClick(): void {
        onPageChange(page - 1);
    }

    function handleNextClick(): void {
        onPageChange(page + 1);
    }

    return (
        <nav
            className="application-pagination"
            aria-label="Application pagination"
        >
            <div className="application-pagination-summary-group">
                <p className="application-pagination-summary">
                    {resultsSummary}
                </p>

                <label className="application-pagination-page-size">
                    <span className="application-pagination-page-size-label">
                        Applications per page
                    </span>
                    <select
                        className="application-pagination-select"
                        value={pageSize}
                        onChange={handlePageSizeChange}
                    >
                        {PAGE_SIZE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="application-pagination-navigation">
                <button
                    type="button"
                    className="application-pagination-button"
                    onClick={handlePreviousClick}
                    disabled={hasNoPages || !hasPreviousPage}
                >
                    <PreviousIcon />
                    <span>Previous</span>
                </button>

                <p
                    className="application-pagination-page-status"
                    aria-live="polite"
                >
                    {pageStatus}
                </p>

                <button
                    type="button"
                    className="application-pagination-button"
                    onClick={handleNextClick}
                    disabled={hasNoPages || !hasNextPage}
                >
                    <span>Next</span>
                    <NextIcon />
                </button>
            </div>
        </nav>
    );
}
