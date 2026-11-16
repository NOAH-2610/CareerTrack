import type { ApplicationStatus } from "../../types";
import { getApplicationStatusLabel } from "./applicationUi";
import "./ApplicationStatusBadge.css";

interface ApplicationStatusBadgeProps {
    status: ApplicationStatus;
}

export default function ApplicationStatusBadge({
    status,
}: ApplicationStatusBadgeProps) {
    return (
        <span
            className={`application-status-badge application-status-${status.toLowerCase()}`}
        >
            {getApplicationStatusLabel(status)}
        </span>
    );
}
