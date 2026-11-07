import { useEffect, useState, type FormEvent, type FormEventHandler } from "react";

import {
    createApplication,
    type ApplicationInput
} from "../api/applications";
import {
    createCompany,
    getCompanies,
    type CompanyInput,
} from "../api/companies";
import { ApiError } from "../api/client";
import type {
    ApplicationStatus,
    Company,
    JobType,
} from "../types"

interface ApplicationFormProps {
    token: string;
    onCreated: () => void;
    onCancel: () => void;
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
    onCreated,
    onCancel,
}: ApplicationFormProps) {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyId, setCompanyId] = useState("");
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
    const [companyError, setCompanyError] = useState<string | null>(null);

    const [showCompanyForm, setShowCompanyForm] = useState(false);
    const [companyName, setCompanyName] = useState("");
    const [companyWebsite, setCompanyWebsite] = useState("");
    const [companyLocation, setCompanyLocation] = useState("");
    const [isCreatingCompany, setIsCreatingCompany] = useState(false);

    const [position, setPosition] = useState("");
    const [jobType, setJobType] = useState<JobType>("FULL_TIME");
    const [jobUrl, setJobUrl] = useState("");
    const [location, setLocation] = useState("");
    const [salaryMin, setSalaryMin] = useState("");
    const [salaryMax, setSalaryMax] = useState("");
    const [status, setStatus] = useState<ApplicationStatus>("WISHLIST");
    const [appliedAt, setAppliedAt] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [companyFormError, setCompanyFormError] = useState<string | null>(null);

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

    async function handleCreateCompany(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setCompanyFormError(null);

        if (!companyName.trim()) {
            setCompanyFormError("Company Error is required.");
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
                    throw new Error("invalid protocol.");
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

        try {
            await createApplication(token, input);
            onCreated();
        } catch (error) {
            setFormError(
                error instanceof ApiError
                    ? error.message
                    : "Unable to create the application.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoadingCompanies) {
        return (
            <section className="application-form-panel">
                <p>Loading companies...</p>
            </section>
        );
    }

    if (companyError) {
        return (
            <section className="application-form-panel">
                <p className="form-error">{companyError}</p>
                <button
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
        <section className="application-form-panel">
            <div className="application-form-heading">
                <div>
                    <h2>Add a job application</h2>
                    <p>Enter the details of the job opportunity.</p>
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
                                : "+Add company"}
                        </button>
                    )}
                </div>

                {!showCompanyForm && companies.length > 0 && (
                    <div className="form-field">
                        <label htmlFor="companyId">Select Company</label>
                        <select
                            id="companyId"
                            value={companyId}
                            onChange={(event) =>
                                setCompanyId(event.target.value)
                            }
                            required
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
                            <label htmlFor="companyName">Company Name *</label>
                            <input
                                id="companyName"
                                value={companyName}
                                onChange={(event) =>
                                    setCompanyName(event.target.value)
                                }
                                placeholder="e.g. Acme Techonologies"
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="companyWebsite">
                                Company Webiste
                            </label>
                            <input
                                id="companyWebsite"
                                type="url"
                                value={companyWebsite}
                                onChange={(event) =>
                                    setCompanyWebsite(event.target.value)
                                }
                                placeholder="https://example.com"
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="companyLocation">
                                Company Location
                            </label>
                            <input 
                                id="companyLocation"
                                value={companyLocation}
                                onChange={(event) => 
                                    setCompanyLocation(event.target.value)
                                }
                                placeholder="e.g. Mumbai, India"
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
                                ? "Creating Company..."
                                : "Save Company"}
                        </button>
                    </form>
                )}
            </div>

            
        </section>
    )
}