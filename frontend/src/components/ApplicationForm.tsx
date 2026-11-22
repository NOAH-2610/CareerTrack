import {
    useEffect,
    useId,
    useRef,
    useState,
    type FormEvent,
} from "react";

import {
    createApplication,
    updateApplication,
    type ApplicationInput,
} from "../api/applications";
import {
    createCompany,
    getCompanies,
    type CompanyInput,
} from "../api/companies";
import { ApiError } from "../api/client";
import type {
    Application,
    ApplicationStatus,
    Company,
    JobType,
} from "../types";

type ApplicationFormMode = "create" | "edit";

// ApplicationsPage still passes onCreated; new callers should pass onSaved.
type ApplicationFormSaveProps =
    | {
          onSaved: (application: Application) => void;
          onCreated?: never;
      }
    | {
          /** @deprecated Use onSaved instead. */
          onCreated: () => void;
          onSaved?: never;
      };

type ApplicationFormProps = {
    token: string;
    mode?: ApplicationFormMode;
    initialApplication?: Application;
    focusOnOpen?: boolean;
    onCancel: () => void;
} & ApplicationFormSaveProps;

const DEFAULT_JOB_TYPE: JobType = "FULL_TIME";
const DEFAULT_STATUS: ApplicationStatus = "WISHLIST";

function toDateInputValue(value: string | null): string {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    // Use local date parts so a date saved by this form round-trips unchanged.
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

const jobTypes: { value: JobType; label: string }[] = [
    { value: "FULL_TIME", label: "Full-time" },
    { value: "PART_TIME", label: "Part-time" },
    { value: "CONTRACT", label: "Contract" },
    { value: "INTERNSHIP", label: "Internship" },
    { value: "FREELANCE", label: "Freelance" },
];

const statuses: { value: ApplicationStatus; label: string }[] = [
    { value: "WISHLIST", label: "Wishlist" },
    { value: "APPLIED", label: "Applied" },
    { value: "ASSESSMENT", label: "Assessment" },
    { value: "INTERVIEW", label: "Interview" },
    { value: "OFFER", label: "Offer" },
    { value: "REJECTED", label: "Rejected" },
    { value: "WITHDRAWN", label: "Withdrawn" },
];

export default function ApplicationForm({
    token,
    mode = "create",
    initialApplication,
    focusOnOpen = false,
    onSaved,
    onCreated,
    onCancel,
}: ApplicationFormProps) {
    const isEditMode = mode === "edit";
    const applicationToEdit = isEditMode ? initialApplication : undefined;

    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyId, setCompanyId] = useState(
        applicationToEdit ? String(applicationToEdit.companyId) : "",
    );
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
    const [companyError, setCompanyError] = useState<string | null>(null);

    const [showCompanyForm, setShowCompanyForm] = useState(false);
    const [companyName, setCompanyName] = useState("");
    const [companyWebsite, setCompanyWebsite] = useState("");
    const [companyLocation, setCompanyLocation] = useState("");
    const [isCreatingCompany, setIsCreatingCompany] = useState(false);

    const [position, setPosition] = useState(
        applicationToEdit?.position ?? "",
    );
    const [jobType, setJobType] = useState<JobType>(
        applicationToEdit?.jobType ?? DEFAULT_JOB_TYPE,
    );
    const [jobUrl, setJobUrl] = useState(
        applicationToEdit?.jobUrl ?? "",
    );
    const [location, setLocation] = useState(
        applicationToEdit?.location ?? "",
    );
    const [salaryMin, setSalaryMin] = useState(
        applicationToEdit?.salaryMin !== null &&
            applicationToEdit?.salaryMin !== undefined
            ? String(applicationToEdit.salaryMin)
            : "",
    );
    const [salaryMax, setSalaryMax] = useState(
        applicationToEdit?.salaryMax !== null &&
            applicationToEdit?.salaryMax !== undefined
            ? String(applicationToEdit.salaryMax)
            : "",
    );
    const [status, setStatus] = useState<ApplicationStatus>(
        applicationToEdit?.status ?? DEFAULT_STATUS,
    );
    const [appliedAt, setAppliedAt] = useState(
        toDateInputValue(applicationToEdit?.appliedAt ?? null),
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [companyFormError, setCompanyFormError] = useState<string | null>(null);

    const headingId = useId();
    const panelRef = useRef<HTMLElement>(null);
    const companySelectRef = useRef<HTMLSelectElement>(null);
    const companyNameRef = useRef<HTMLInputElement>(null);
    const backButtonRef = useRef<HTMLButtonElement>(null);
    const hasFocusedOnOpenRef = useRef(false);

    useEffect(() => {
        let isActive = true;

        async function fetchCompanies() {
            try {
                const response = await getCompanies(token);

                if (isActive) {
                    setCompanies(response.companies);

                    if (response.companies.length === 0) {
                        setShowCompanyForm(true);
                    }
                }
            } catch (error) {
                if (isActive) {
                    setCompanyError(
                        error instanceof ApiError
                            ? error.message
                            : "Unable to load companies.",
                    );
                }
            } finally {
                if (isActive) {
                    setIsLoadingCompanies(false);
                }
            }
        }

        void fetchCompanies();

        return () => {
            isActive = false;
        };
    }, [token]);

    useEffect(() => {
        if (!focusOnOpen || hasFocusedOnOpenRef.current) {
            return;
        }

        if (isLoadingCompanies) {
            panelRef.current?.focus({ preventScroll: true });
            return;
        }

        if (companyError) {
            backButtonRef.current?.focus({ preventScroll: true });
            hasFocusedOnOpenRef.current = true;
            return;
        }

        let target: HTMLElement | null = null;

        if (showCompanyForm) {
            target = companyNameRef.current;
        } else if (companies.length > 0) {
            target = companySelectRef.current;
        }

        if (!target || target.hasAttribute("disabled")) {
            return;
        }

        target.focus({ preventScroll: true });
        hasFocusedOnOpenRef.current = true;
    }, [
        focusOnOpen,
        isLoadingCompanies,
        companyError,
        showCompanyForm,
        companies.length,
    ]);

    async function handleCreateCompany(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setCompanyFormError(null);

        if (!companyName.trim()) {
            setCompanyFormError("Company name is required.");
            return;
        }

        if (companyWebsite.trim()) {
            try {
                const website = new URL(companyWebsite.trim());

                if (
                    website.protocol !== "http:" &&
                    website.protocol !== "https:"
                ) {
                    throw new Error("Invalid protocol");
                }
            } catch {
                setCompanyFormError(
                    "Enter a valid company website beginning with http:// or https://.",
                );
                return;
            }
        }

        setIsCreatingCompany(true);

        const input: CompanyInput = {
            name: companyName.trim(),
            website: companyWebsite.trim() || null,
            location: companyLocation.trim() || null,
        };

        try {
            const response = await createCompany(token, input);

            setCompanies((current) => [
                response.company,
                ...current,
            ]);
            setCompanyId(String(response.company.id));
            setShowCompanyForm(false);
            setCompanyName("");
            setCompanyWebsite("");
            setCompanyLocation("");
        } catch (error) {
            setCompanyFormError(
                error instanceof ApiError
                    ? error.message
                    : "Unable to create company.",
            );
        } finally {
            setIsCreatingCompany(false);
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);

        if (isEditMode && !applicationToEdit) {
            setFormError("No application is available to edit.");
            return;
        }

        if (!companyId) {
            setFormError("Please select a company.");
            return;
        }

        if (!position.trim()) {
            setFormError("Job position is required.");
            return;
        }

        if (jobUrl.trim()) {
            try {
                const url = new URL(jobUrl.trim());

                if (url.protocol !== "http:" && url.protocol !== "https:") {
                    throw new Error("Invalid protocol");
                }
            } catch {
                setFormError(
                    "Enter a valid job URL beginning with http:// or https://.",
                );
                return;
            }
        }

        const minSalary = salaryMin.trim() ? Number(salaryMin) : null;
        const maxSalary = salaryMax.trim() ? Number(salaryMax) : null;

        for (const salary of [minSalary, maxSalary]) {
            if (
                salary !== null &&
                (!Number.isSafeInteger(salary) || salary < 0)
            ) {
                setFormError(
                    "Salary values must be non-negative whole numbers.",
                );
                return;
            }
        }

        if (
            minSalary !== null &&
            maxSalary !== null &&
            minSalary > maxSalary
        ) {
            setFormError(
                "Minimum salary cannot be greater than maximum salary.",
            );
            return;
        }

        const input: ApplicationInput = {
            companyId: Number(companyId),
            position: position.trim(),
            jobType,
            status,
            jobUrl: jobUrl.trim() || null,
            location: location.trim() || null,
            salaryMin: minSalary,
            salaryMax: maxSalary,
            appliedAt: appliedAt
                ? new Date(`${appliedAt}T00:00:00`).toISOString()
                : null,
        };

        setIsSubmitting(true);

        const failureMessage = isEditMode
            ? "Unable to update the application."
            : "Unable to create the application.";

        try {
            let savedApplication: Application;

            if (applicationToEdit) {
                const response = await updateApplication(
                    token,
                    applicationToEdit.id,
                    input,
                );

                savedApplication = response.application;
            } else {
                const response = await createApplication(token, input);

                savedApplication = response.application;
            }

            if (onSaved) {
                onSaved(savedApplication);
            } else {
                onCreated?.();
            }
        } catch (error) {
            setFormError(
                error instanceof ApiError ? error.message : failureMessage,
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoadingCompanies) {
        return (
            <section
                ref={panelRef}
                className="application-form-panel"
                aria-label="Application form"
                tabIndex={-1}
            >
                <p role="status">Loading companies...</p>
            </section>
        );
    }

    if (companyError) {
        return (
            <section
                ref={panelRef}
                className="application-form-panel"
                aria-label="Application form"
                tabIndex={-1}
            >
                <p className="form-error" role="alert">
                    {companyError}
                </p>
                <button
                    ref={backButtonRef}
                    type="button"
                    className="secondary-button"
                    onClick={onCancel}
                >
                    Back to applications
                </button>
            </section>
        );
    }

    return (
        <section
            ref={panelRef}
            className="application-form-panel"
            aria-labelledby={headingId}
            tabIndex={-1}
        >
            <div className="application-form-heading">
                <div>
                    <h2 id={headingId}>
                        {isEditMode
                            ? "Edit application"
                            : "Add a job application"}
                    </h2>
                    <p>
                        {isEditMode
                            ? "Update the details of this job application."
                            : "Enter the details of the job opportunity."}
                    </p>
                </div>
                <button
                    type="button"
                    className="secondary-button"
                    onClick={onCancel}
                    disabled={isSubmitting || isCreatingCompany}
                >
                    Cancel
                </button>
            </div>

            {formError && (
                <p className="form-error" role="alert">
                    {formError}
                </p>
            )}

            <div className="company-selection">
                <div className="application-form-section-heading">
                    <h3>Company</h3>
                    {companies.length > 0 && (
                        <button
                            type="button"
                            className="text-button"
                            onClick={() => {
                                setShowCompanyForm((current) => !current);
                                setCompanyFormError(null);
                            }}
                        >
                            {showCompanyForm
                                ? "Choose existing company"
                                : "+ Add company"}
                        </button>
                    )}
                </div>

                {!showCompanyForm && companies.length > 0 && (
                    <div className="form-field">
                        <label htmlFor="companyId">Select company</label>
                        <select
                            ref={companySelectRef}
                            id="companyId"
                            value={companyId}
                            onChange={(event) =>
                                setCompanyId(event.target.value)
                            }
                            required
                            disabled={isSubmitting}
                        >
                            <option value="">Choose a company</option>
                            {companies.map((company) => (
                                <option
                                    key={company.id}
                                    value={company.id}
                                >
                                    {company.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {showCompanyForm && (
                    <form
                        className="company-create-form"
                        onSubmit={handleCreateCompany}
                    >
                        <div className="form-field">
                            <label htmlFor="companyName">Company name *</label>
                            <input
                                ref={companyNameRef}
                                id="companyName"
                                value={companyName}
                                onChange={(event) =>
                                    setCompanyName(event.target.value)
                                }
                                placeholder="e.g. Acme Technologies"
                                required
                                disabled={isCreatingCompany}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="companyWebsite">
                                Company website
                            </label>
                            <input
                                id="companyWebsite"
                                type="url"
                                value={companyWebsite}
                                onChange={(event) =>
                                    setCompanyWebsite(event.target.value)
                                }
                                placeholder="https://example.com"
                                disabled={isCreatingCompany}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="companyLocation">
                                Company location
                            </label>
                            <input
                                id="companyLocation"
                                value={companyLocation}
                                onChange={(event) =>
                                    setCompanyLocation(event.target.value)
                                }
                                placeholder="e.g. Mumbai, India"
                                disabled={isCreatingCompany}
                            />
                        </div>

                        {companyFormError && (
                            <p className="form-error" role="alert">
                                {companyFormError}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="secondary-button"
                            disabled={isCreatingCompany}
                        >
                            {isCreatingCompany
                                ? "Creating company..."
                                : "Save company"}
                        </button>
                    </form>
                )}
            </div>

            <form className="application-form" onSubmit={handleSubmit}>
                <div className="application-form-section-heading">
                    <h3>Job details</h3>
                </div>

                <div className="form-field">
                    <label htmlFor="position">Job position *</label>
                    <input
                        id="position"
                        value={position}
                        onChange={(event) => setPosition(event.target.value)}
                        placeholder="e.g. Frontend Developer"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="jobType">Job type *</label>
                    <select
                        id="jobType"
                        value={jobType}
                        onChange={(event) =>
                            setJobType(event.target.value as JobType)
                        }
                        disabled={isSubmitting}
                    >
                        {jobTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-field">
                    <label htmlFor="jobUrl">Job posting URL</label>
                    <input
                        id="jobUrl"
                        type="url"
                        value={jobUrl}
                        onChange={(event) => setJobUrl(event.target.value)}
                        placeholder="https://example.com/jobs/123"
                        disabled={isSubmitting}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="location">Job location</label>
                    <input
                        id="location"
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                        placeholder="e.g. Remote or Mumbai"
                        disabled={isSubmitting}
                    />
                </div>

                <div className="application-form-grid">
                    <div className="form-field">
                        <label htmlFor="salaryMin">Minimum salary</label>
                        <input
                            id="salaryMin"
                            type="number"
                            min="0"
                            step="1"
                            value={salaryMin}
                            onChange={(event) =>
                                setSalaryMin(event.target.value)
                            }
                            placeholder="e.g. 500000"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="salaryMax">Maximum salary</label>
                        <input
                            id="salaryMax"
                            type="number"
                            min="0"
                            step="1"
                            value={salaryMax}
                            onChange={(event) =>
                                setSalaryMax(event.target.value)
                            }
                            placeholder="e.g. 800000"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className="form-field">
                    <label htmlFor="status">Application status *</label>
                    <select
                        id="status"
                        value={status}
                        onChange={(event) =>
                            setStatus(
                                event.target.value as ApplicationStatus,
                            )
                        }
                        disabled={isSubmitting}
                    >
                        {statuses.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-field">
                    <label htmlFor="appliedAt">Application date</label>
                    <input
                        id="appliedAt"
                        type="date"
                        value={appliedAt}
                        onChange={(event) => setAppliedAt(event.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="application-form-actions">
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={
                            isSubmitting ||
                            showCompanyForm ||
                            companies.length === 0 ||
                            !companyId
                        }
                    >
                        {isSubmitting
                            ? isEditMode
                                ? "Saving changes..."
                                : "Saving application..."
                            : isEditMode
                              ? "Save changes"
                              : "Save application"}
                    </button>
                </div>
            </form>
        </section>
    );
}
