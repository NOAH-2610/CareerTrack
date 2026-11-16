import { useMemo } from "react";

import type { Application, Company } from "../../types";
import ApplicationTableRow from "./ApplicationTableRow";
import "./ApplicationTable.css";

export interface ApplicationTableProps {
    applications: Application[];
    companies: ReadonlyArray<Company>;

    onRowClick?: (application: Application) => void;
    onEdit?: (application: Application) => void;
    onDelete?: (application: Application) => void;
}

export default function ApplicationTable({
    applications,
    companies,
    onRowClick,
    onEdit,
    onDelete,
}: ApplicationTableProps) {
    const companiesById = useMemo(() => {
        const lookup = new Map<number, Company>();

        companies.forEach((company) => {
            lookup.set(company.id, company);
        });

        return lookup;
    }, [companies]);

    return (
        <div
            className="application-table-container"
            role="region"
            aria-label="Applications table"
            tabIndex={0}
        >
            <table className="application-table">
                <caption className="application-table-sr-only">
                    Job applications
                </caption>

                <thead>
                    <tr>
                        <th scope="col">Company</th>
                        <th scope="col">Position</th>
                        <th scope="col">Status</th>
                        <th scope="col">Applied Date</th>
                        <th scope="col">Compensation</th>
                        <th scope="col">Job Link</th>
                        <th
                            scope="col"
                            className="application-table-actions-heading"
                        >
                            Actions
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {applications.length === 0 ? (
                        <tr>
                            <td
                                className="application-table-empty"
                                colSpan={7}
                            >
                                No applications to display.
                            </td>
                        </tr>
                    ) : (
                        applications.map((application) => (
                            <ApplicationTableRow
                                key={application.id}
                                application={application}
                                company={companiesById.get(
                                    application.companyId,
                                )}
                                onRowClick={onRowClick}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
