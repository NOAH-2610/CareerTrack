import type { Application, ApplicationStatus } from "../../types";

export type ApplicationStatusCounts = Record<ApplicationStatus, number> & {
    total: number;
};

export function countApplications(
    applications: readonly Application[],
): ApplicationStatusCounts {
    const counts: ApplicationStatusCounts = {
        total: 0,
        WISHLIST: 0,
        APPLIED: 0,
        ASSESSMENT: 0,
        INTERVIEW: 0,
        OFFER: 0,
        REJECTED: 0,
        WITHDRAWN: 0,
    };

    for (const application of applications) {
        counts.total += 1;
        counts[application.status] += 1;
    }

    return counts;
}
