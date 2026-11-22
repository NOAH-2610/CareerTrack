import type { Ref } from "react";
import { Link } from "react-router-dom";

import "./ApplicationsHeader.css";

interface ApplicationsHeaderProps {
    applicationCount: number;
    onNewApplication: () => void;
    isFormOpen?: boolean;
    newApplicationButtonRef?: Ref<HTMLButtonElement>;
}

function PlusIcon() {
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
            <path d="M12 5v14" />
            <path d="M5 12h14" />
        </svg>
    );
}

export default function ApplicationsHeader({
    applicationCount,
    onNewApplication,
    isFormOpen = false,
    newApplicationButtonRef,
}: ApplicationsHeaderProps) {
    const countLabel = `${applicationCount} matching ${
        applicationCount === 1 ? "application" : "applications"
    }`;

    return (
        <header className="applications-page-header">
            <div className="applications-page-header-content">
                <nav
                    className="applications-breadcrumb"
                    aria-label="Breadcrumb"
                >
                    <ol>
                        <li>
                            <Link to="/dashboard">Dashboard</Link>
                        </li>
                        <li aria-current="page">Applications</li>
                    </ol>
                </nav>

                <h1>Applications</h1>

                <p
                    className="applications-page-count"
                    aria-live="polite"
                >
                    {countLabel}
                </p>
            </div>

            <button
                ref={newApplicationButtonRef}
                type="button"
                className="applications-new-button"
                onClick={onNewApplication}
                disabled={isFormOpen}
            >
                <PlusIcon />
                <span>New Application</span>
            </button>
        </header>
    );
}
