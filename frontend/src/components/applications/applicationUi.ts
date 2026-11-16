import type { ApplicationStatus, JobType } from "../../types";

export interface SelectOption<TValue extends string> {
    value: TValue;
    label: string;
}

const applicationStatusLabels = {
    WISHLIST: "Wishlist",
    APPLIED: "Applied",
    ASSESSMENT: "Assessment",
    INTERVIEW: "Interview",
    OFFER: "Offer",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn",
} satisfies Record<ApplicationStatus, string>;

const jobTypeLabels = {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    CONTRACT: "Contract",
    INTERNSHIP: "Internship",
    FREELANCE: "Freelance",
} satisfies Record<JobType, string>;

export const applicationStatusOptions: ReadonlyArray<
    SelectOption<ApplicationStatus>
> = (
    Object.keys(applicationStatusLabels) as ApplicationStatus[]
).map((value) => ({
    value,
    label: applicationStatusLabels[value],
}));

export const jobTypeOptions: ReadonlyArray<SelectOption<JobType>> = (
    Object.keys(jobTypeLabels) as JobType[]
).map((value) => ({
    value,
    label: jobTypeLabels[value],
}));

const EMPTY_VALUE = "—";

const salaryFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
});

export function getApplicationStatusLabel(
    status: ApplicationStatus | null | undefined,
): string {
    if (!status) {
        return "Unknown";
    }

    return applicationStatusLabels[status] ?? "Unknown";
}

export function getJobTypeLabel(
    jobType: JobType | null | undefined,
): string {
    if (!jobType) {
        return "Unknown";
    }

    return jobTypeLabels[jobType] ?? "Unknown";
}

export function formatApplicationDate(
    value: string | null | undefined,
): string {
    if (!value) {
        return EMPTY_VALUE;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return EMPTY_VALUE;
    }

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function formatCompensation(
    salaryMin: number | null | undefined,
    salaryMax: number | null | undefined,
): string {
    const min = normalizeSalary(salaryMin);
    const max = normalizeSalary(salaryMax);

    if (min === null && max === null) {
        return EMPTY_VALUE;
    }

    if (min !== null && max !== null) {
        return `${salaryFormatter.format(min)} – ${salaryFormatter.format(max)}`;
    }

    if (min !== null) {
        return `${salaryFormatter.format(min)}+`;
    }

    if (max !== null) {
        return `Up to ${salaryFormatter.format(max)}`;
    }

    return EMPTY_VALUE;
}

function normalizeSalary(
    value: number | null | undefined,
): number | null {
    if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0
    ) {
        return null;
    }

    return value;
}
