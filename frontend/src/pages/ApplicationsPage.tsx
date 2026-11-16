import { useEffect, useState } from "react";

import { useAuth } from "../auth/authContext";
import { getApplications } from "../api/applications";
import { ApiError } from "../api/client";
import { getCompanies } from "../api/companies";
import type {
    Application,
    ApplicationPagination as ApplicationPaginationMeta,
    ApplicationQueryParams,
    ApplicationSortField,
    ApplicationStatus,
    Company,
    JobType,
    SortOrder,
} from "../types";
import ApplicationForm from "../components/ApplicationForm";
import ApplicationDetailDrawer from "../components/applications/ApplicationDetailDrawer";
import ApplicationPagination from "../components/applications/ApplicationPagination";
import ApplicationTable from "../components/applications/ApplicationTable";
import ApplicationToolbar from "../components/applications/ApplicationToolbar";
import ApplicationsHeader from "../components/applications/ApplicationsHeader";
import ApplicationsSidebar from "../components/applications/ApplicationsSidebar";
import "./ApplicationsPage.css";

type PageSize = NonNullable<ApplicationQueryParams["limit"]>;

const INITIAL_PAGE = 1;
const INITIAL_PAGE_SIZE: PageSize = 10;
const INITIAL_SORT_BY = "createdAt";
const INITIAL_SORT_ORDER = "desc";
const SEARCH_DEBOUNCE_MS = 350;

export default function ApplicationsPage() {
    const { user, token, logout } = useAuth();

    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(INITIAL_PAGE);
    const [pageSize, setPageSize] = useState<PageSize>(INITIAL_PAGE_SIZE);
    const [pagination, setPagination] =
        useState<ApplicationPaginationMeta | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedApplicationId, setSelectedApplicationId] = useState<
        number | null
    >(null);

    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyError, setCompanyError] = useState<string | null>(null);
    const [companyRefreshKey, setCompanyRefreshKey] = useState(0);

    const selectedApplication =
        selectedApplicationId === null
            ? null
            : applications.find(
                  (application) => application.id === selectedApplicationId,
              ) ?? null;

    const selectedCompany =
        selectedApplication === null
            ? null
            : companies.find(
                  (company) => company.id === selectedApplication.companyId,
              ) ?? null;

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [status, setStatus] = useState<ApplicationStatus | "">("");
    const [jobType, setJobType] = useState<JobType | "">("");
    const [sortBy, setSortBy] =
        useState<ApplicationSortField>(INITIAL_SORT_BY);
    const [sortOrder, setSortOrder] = useState<SortOrder>(INITIAL_SORT_ORDER);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearch(search);
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [search]);

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

            setIsLoading(true);
            setError(null);

            let shouldFinishLoading = true;

            try {
                const response = await getApplications(token, {
                    page: currentPage,
                    limit: pageSize,
                    search: debouncedSearch || undefined,
                    status: status || undefined,
                    jobType: jobType || undefined,
                    sortBy,
                    sortOrder,
                });

                if (!isActive) {
                    return;
                }

                const nextPagination = response.pagination;

                function applyApplications(): void {
                    setApplications(response.applications);
                    setSelectedApplicationId((currentId) =>
                        currentId !== null &&
                        !response.applications.some(
                            (application) => application.id === currentId,
                        )
                            ? null
                            : currentId,
                    );
                }

                if (!nextPagination) {
                    applyApplications();
                    setPagination(null);
                    return;
                }

                // A page can become invalid after deletions, so fall back to the
                // last available page and let the effect fetch it again.
                if (
                    nextPagination.totalPages > 0 &&
                    currentPage > nextPagination.totalPages
                ) {
                    shouldFinishLoading = false;
                    setCurrentPage(nextPagination.totalPages);
                    return;
                }

                applyApplications();
                setPagination(nextPagination);
            } catch (err) {
                if (!isActive) {
                    return;
                }

                if (err instanceof ApiError && err.status === 401) {
                    logout();
                    return;
                }

                setError(
                    err instanceof ApiError
                        ? err.message
                        : "Unable to load your applications.",
                );
            } finally {
                if (isActive && shouldFinishLoading) {
                    setIsLoading(false);
                }
            }
        }

        void fetchApplications();

        return () => {
            isActive = false;
        };
    }, [
        token,
        currentPage,
        pageSize,
        debouncedSearch,
        status,
        jobType,
        sortBy,
        sortOrder,
        refreshKey,
        logout,
    ]);

    useEffect(() => {
        let isActive = true;

        async function fetchCompanies() {
            if (!token) {
                if (isActive) {
                    setCompanies([]);
                    setCompanyError(null);
                }
                return;
            }

            setCompanyError(null);

            try {
                const response = await getCompanies(token);

                if (!isActive) {
                    return;
                }

                setCompanies(response.companies);
            } catch (err) {
                if (!isActive) {
                    return;
                }

                if (err instanceof ApiError && err.status === 401) {
                    logout();
                    return;
                }

                setCompanyError(
                    err instanceof ApiError
                        ? `Company details could not be loaded. ${err.message}`
                        : "Company details could not be loaded.",
                );
            }
        }

        void fetchCompanies();

        return () => {
            isActive = false;
        };
    }, [token, companyRefreshKey, logout]);

    function handleSearchChange(value: string): void {
        setSearch(value);
        setCurrentPage(INITIAL_PAGE);
    }

    function handleStatusChange(value: ApplicationStatus | ""): void {
        setStatus(value);
        setCurrentPage(INITIAL_PAGE);
    }

    function handleJobTypeChange(value: JobType | ""): void {
        setJobType(value);
        setCurrentPage(INITIAL_PAGE);
    }

    function handleSortChange(
        nextSortBy: ApplicationSortField,
        nextSortOrder: SortOrder,
    ): void {
        setSortBy(nextSortBy);
        setSortOrder(nextSortOrder);
        setCurrentPage(INITIAL_PAGE);
    }

    function handleClearSearch(): void {
        setSearch("");
        setDebouncedSearch("");
        setCurrentPage(INITIAL_PAGE);
    }

    function handleClearStatus(): void {
        setStatus("");
        setCurrentPage(INITIAL_PAGE);
    }

    function handleClearJobType(): void {
        setJobType("");
        setCurrentPage(INITIAL_PAGE);
    }

    function handleClearAll(): void {
        handleClearSearch();
        handleClearStatus();
        handleClearJobType();
    }

    function handlePageChange(page: number): void {
        setCurrentPage(page);
    }

    function handlePageSizeChange(nextPageSize: PageSize): void {
        setPageSize(nextPageSize);
        setCurrentPage(INITIAL_PAGE);
    }

    function handleApplicationCreated() {
        setShowForm(false);
        setCurrentPage(INITIAL_PAGE);
        setRefreshKey((current) => current + 1);
        setCompanyRefreshKey((current) => current + 1);
    }

    function handleApplicationSelect(application: Application): void {
        setSelectedApplicationId(application.id);
    }

    function handleDrawerClose(): void {
        setSelectedApplicationId(null);
    }

    // Editing and deletion are connected in later milestones.
    function handleEditPlaceholder(): void {
        // Intentionally no-op.
    }

    function handleDeletePlaceholder(): void {
        // Intentionally no-op.
    }

    const totalApplicationCount = pagination?.totalItems ?? 0;

    return (
        <div className="applications-layout">
            <ApplicationsSidebar
                user={user}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapsed={() =>
                    setIsSidebarCollapsed((current) => !current)
                }
                onLogout={logout}
            />

            <main className="applications-page">
                <ApplicationsHeader
                    applicationCount={totalApplicationCount}
                    onNewApplication={() => setShowForm(true)}
                    isFormOpen={showForm}
                />

                {showForm && token ? (
                    <ApplicationForm
                        token={token}
                        onCreated={handleApplicationCreated}
                        onCancel={() => setShowForm(false)}
                    />
                ) : (
                    <>
                        <ApplicationToolbar
                            search={search}
                            status={status}
                            jobType={jobType}
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            onSearchChange={handleSearchChange}
                            onStatusChange={handleStatusChange}
                            onJobTypeChange={handleJobTypeChange}
                            onSortChange={handleSortChange}
                            onClearSearch={handleClearSearch}
                            onClearStatus={handleClearStatus}
                            onClearJobType={handleClearJobType}
                            onClearAll={handleClearAll}
                        />

                        {companyError && !error && (
                            <p className="applications-warning" role="status">
                                {companyError}
                            </p>
                        )}

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
                            <ApplicationTable
                                applications={applications}
                                companies={companies}
                                onRowClick={handleApplicationSelect}
                                onEdit={handleEditPlaceholder}
                                onDelete={handleDeletePlaceholder}
                            />
                        )}

                        {!isLoading && !error && pagination && (
                            <ApplicationPagination
                                pagination={pagination}
                                pageSize={pageSize}
                                onPageChange={handlePageChange}
                                onPageSizeChange={handlePageSizeChange}
                            />
                        )}
                    </>
                )}

                <ApplicationDetailDrawer
                    isOpen={selectedApplication !== null}
                    application={selectedApplication}
                    company={selectedCompany}
                    onClose={handleDrawerClose}
                    onEdit={handleEditPlaceholder}
                    onDelete={handleDeletePlaceholder}
                />
            </main>
        </div>
    );
}
