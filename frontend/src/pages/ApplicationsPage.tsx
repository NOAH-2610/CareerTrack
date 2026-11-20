import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
} from "react";

import { useAuth } from "../auth/authContext";
import { deleteApplication, getApplications } from "../api/applications";
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
import DeleteApplicationDialog from "../components/applications/DeleteApplicationDialog";
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

// The delete dialog is portaled above the page, so its error needs to escape the
// page flow to remain visible next to the dialog without modifying the dialog.
const deletionErrorStyle: CSSProperties = {
    position: "fixed",
    top: "16px",
    left: "50%",
    zIndex: 1100,
    width: "min(480px, calc(100vw - 32px))",
    margin: 0,
    transform: "translateX(-50%)",
    boxShadow: "0 16px 40px rgb(15 23 42 / 18%)",
};

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
    const [editingApplicationId, setEditingApplicationId] = useState<
        number | null
    >(null);
    const [selectedApplicationId, setSelectedApplicationId] = useState<
        number | null
    >(null);
    const [deletionApplicationId, setDeletionApplicationId] = useState<
        number | null
    >(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletionError, setDeletionError] = useState<string | null>(null);

    const deletionInFlightRef = useRef(false);
    const isMountedRef = useRef(true);

    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyError, setCompanyError] = useState<string | null>(null);
    const [companyRefreshKey, setCompanyRefreshKey] = useState(0);

    const selectedApplication =
        selectedApplicationId === null
            ? null
            : applications.find(
                  (application) => application.id === selectedApplicationId,
              ) ?? null;

    const editingApplication =
        editingApplicationId === null
            ? null
            : applications.find(
                  (application) => application.id === editingApplicationId,
              ) ?? null;

    // A stale edit ID must not open the form or fall back to create mode.
    const isCreatingApplication =
        showForm && editingApplicationId === null;
    const isFormOpen =
        isCreatingApplication || editingApplication !== null;

    const selectedCompany =
        selectedApplication === null
            ? null
            : companies.find(
                  (company) => company.id === selectedApplication.companyId,
              ) ?? null;

    const deletionApplication =
        deletionApplicationId === null
            ? null
            : applications.find(
                  (application) => application.id === deletionApplicationId,
              ) ?? null;

    const deletionCompany =
        deletionApplication === null
            ? null
            : companies.find(
                  (company) => company.id === deletionApplication.companyId,
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
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

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

    function handleNewApplication(): void {
        setEditingApplicationId(null);
        setShowForm(true);
    }

    function handleFormCancel(): void {
        setShowForm(false);
        setEditingApplicationId(null);
    }

    function handleApplicationSaved(): void {
        const wasEditing = editingApplicationId !== null;

        setShowForm(false);
        setEditingApplicationId(null);

        if (!wasEditing) {
            setCurrentPage(INITIAL_PAGE);
        }

        setRefreshKey((current) => current + 1);
        setCompanyRefreshKey((current) => current + 1);
    }

    function handleApplicationSelect(application: Application): void {
        setSelectedApplicationId(application.id);
    }

    function handleDrawerClose(): void {
        setSelectedApplicationId(null);
    }

    function handleEditApplication(application: Application): void {
        setEditingApplicationId(application.id);
        setShowForm(false);
        setSelectedApplicationId(null);
    }

    function handleDeleteApplication(application: Application): void {
        if (deletionInFlightRef.current) {
            return;
        }

        setDeletionError(null);
        setDeletionApplicationId(application.id);
    }

    function handleDeleteCancel(): void {
        if (deletionInFlightRef.current) {
            return;
        }

        setDeletionApplicationId(null);
        setDeletionError(null);
    }

    async function handleDeleteConfirm(
        application: Application,
    ): Promise<void> {
        if (deletionInFlightRef.current) {
            return;
        }

        if (deletionApplicationId !== application.id) {
            return;
        }

        if (!token) {
            setDeletionError(
                "Your session is unavailable. Please log in again.",
            );
            return;
        }

        deletionInFlightRef.current = true;
        setIsDeleting(true);
        setDeletionError(null);

        try {
            await deleteApplication(token, application.id);

            if (!isMountedRef.current) {
                return;
            }

            setDeletionApplicationId(null);
            setRefreshKey((current) => current + 1);
        } catch (err) {
            if (!isMountedRef.current) {
                return;
            }

            if (err instanceof ApiError && err.status === 401) {
                logout();
                return;
            }

            setDeletionError(
                err instanceof ApiError
                    ? `Could not delete application. ${err.message}`
                    : "Could not delete application. Please try again.",
            );
        } finally {
            deletionInFlightRef.current = false;

            if (isMountedRef.current) {
                setIsDeleting(false);
            }
        }
    }

    const totalApplicationCount = pagination?.totalItems ?? 0;
    const hasActiveFilters =
        search.length > 0 ||
        debouncedSearch.length > 0 ||
        status !== "" ||
        jobType !== "";
    const hasNoVisibleResults =
        !isLoading && !error && applications.length === 0;
    const totalItems = pagination?.totalItems ?? null;
    const showFilteredEmptyState =
        hasNoVisibleResults && hasActiveFilters && totalItems === 0;
    // Keep the existing empty state when pagination metadata is unavailable so
    // the page never guesses about the size of the whole account.
    const showEmptyAccountState =
        hasNoVisibleResults &&
        !showFilteredEmptyState &&
        (totalItems === null || totalItems === 0);

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
                    onNewApplication={handleNewApplication}
                    isFormOpen={isFormOpen}
                />

                {isFormOpen && token ? (
                    editingApplication ? (
                        <ApplicationForm
                            key={`edit-${editingApplication.id}`}
                            token={token}
                            mode="edit"
                            initialApplication={editingApplication}
                            onSaved={handleApplicationSaved}
                            onCancel={handleFormCancel}
                        />
                    ) : (
                        <ApplicationForm
                            key="create"
                            token={token}
                            onSaved={handleApplicationSaved}
                            onCancel={handleFormCancel}
                        />
                    )
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

                        {showEmptyAccountState && (
                            <section className="applications-message applications-empty">
                                <h2>No applications yet</h2>
                                <p>
                                    Your job applications will appear here once
                                    you add your first one.
                                </p>
                            </section>
                        )}

                        {showFilteredEmptyState && (
                            <section className="applications-message applications-empty applications-no-matches">
                                <h2>No matching applications</h2>
                                <p>
                                    Try adjusting your search or filters to find
                                    what you're looking for.
                                </p>
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={handleClearAll}
                                >
                                    Clear all filters
                                </button>
                            </section>
                        )}

                        {!isLoading && !error && applications.length > 0 && (
                            <ApplicationTable
                                applications={applications}
                                companies={companies}
                                onRowClick={handleApplicationSelect}
                                onEdit={handleEditApplication}
                                onDelete={handleDeleteApplication}
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
                    onEdit={handleEditApplication}
                    onDelete={handleDeleteApplication}
                />

                <DeleteApplicationDialog
                    isOpen={deletionApplication !== null}
                    application={deletionApplication}
                    company={deletionCompany}
                    onCancel={handleDeleteCancel}
                    onConfirm={(application) => {
                        void handleDeleteConfirm(application);
                    }}
                    isDeleting={isDeleting}
                />
            </main>

            {deletionApplication !== null && deletionError && (
                <p
                    className="form-error"
                    role="alert"
                    style={deletionErrorStyle}
                >
                    {deletionError}
                </p>
            )}
        </div>
    );
}
