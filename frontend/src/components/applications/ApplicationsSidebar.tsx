import { Link, NavLink } from "react-router-dom";

import type { User } from "../../types";
import "./ApplicationsSidebar.css";

interface ApplicationsSidebarProps {
    user: User | null;
    isCollapsed: boolean;
    onToggleCollapsed: () => void;
    onLogout: () => void;
}

function getInitials(name: string): string {
    const normalizedName = name.trim();

    if (!normalizedName) {
        return "U";
    }

    const parts = normalizedName.split(/\s+/);
    const firstPart = parts[0] ?? "";
    const lastPart = parts.length > 1 ? (parts[parts.length - 1] ?? "") : "";
    const initials =
        `${firstPart.charAt(0)}${lastPart.charAt(0)}`.toUpperCase();

    return initials || "U";
}

function BrandMark() {
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
            <path d="M4 8.75h16v9.5A1.75 1.75 0 0 1 18.25 20H5.75A1.75 1.75 0 0 1 4 18.25v-9.5Z" />
            <path d="M9 8.75V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5v2.25" />
            <path d="M4 12.5c2.55 1.35 5.22 2.03 8 2.03s5.45-.68 8-2.03" />
        </svg>
    );
}

function DashboardIcon() {
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
            <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </svg>
    );
}

function ApplicationsIcon() {
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
            <path d="M6 5.5h12A1.5 1.5 0 0 1 19.5 7v11.5A1.5 1.5 0 0 1 18 20H6a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 6 5.5Z" />
            <path d="M8.5 9h7" />
            <path d="M8.5 12.5h7" />
            <path d="M8.5 16h4.5" />
        </svg>
    );
}

function SidebarToggleIcon({ isCollapsed }: { isCollapsed: boolean }) {
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
            {isCollapsed ? (
                <path d="m9 6 6 6-6 6" />
            ) : (
                <path d="m15 6-6 6 6 6" />
            )}
        </svg>
    );
}

function LogoutIcon() {
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
            <path d="M10 5H6.75A1.75 1.75 0 0 0 5 6.75v10.5A1.75 1.75 0 0 0 6.75 19H10" />
            <path d="m14 8 4 4-4 4" />
            <path d="M18 12H9" />
        </svg>
    );
}

export default function ApplicationsSidebar({
    user,
    isCollapsed,
    onToggleCollapsed,
    onLogout,
}: ApplicationsSidebarProps) {
    const userName = user?.name ?? "User";
    const userEmail = user?.email;
    const userInitials = getInitials(userName);
    const sidebarClassName = [
        "applications-sidebar",
        isCollapsed ? "applications-sidebar-collapsed" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <aside
            id="applications-sidebar"
            className={sidebarClassName}
            aria-label="Application sidebar"
        >
            <div className="applications-sidebar-header">
                <Link
                    to="/dashboard"
                    className="applications-sidebar-brand"
                    aria-label="CareerTrack dashboard"
                    title="CareerTrack dashboard"
                >
                    <span className="applications-sidebar-brand-mark">
                        <BrandMark />
                    </span>
                    <span className="applications-sidebar-label applications-sidebar-brand-name">
                        CareerTrack
                    </span>
                </Link>

                <button
                    type="button"
                    className="applications-sidebar-toggle"
                    aria-label={
                        isCollapsed
                            ? "Expand sidebar"
                            : "Collapse sidebar"
                    }
                    aria-expanded={!isCollapsed}
                    aria-controls="applications-sidebar"
                    title={
                        isCollapsed
                            ? "Expand sidebar"
                            : "Collapse sidebar"
                    }
                    onClick={onToggleCollapsed}
                >
                    <SidebarToggleIcon isCollapsed={isCollapsed} />
                </button>
            </div>

            <nav
                className="applications-sidebar-nav"
                aria-label="Main navigation"
            >
                <ul className="applications-sidebar-nav-list">
                    <li>
                        <NavLink
                            to="/dashboard"
                            end
                            className={({ isActive }) =>
                                isActive
                                    ? "applications-sidebar-nav-link applications-sidebar-nav-link-active"
                                    : "applications-sidebar-nav-link"
                            }
                            title="Dashboard"
                            aria-label="Dashboard"
                        >
                            <span className="applications-sidebar-nav-icon">
                                <DashboardIcon />
                            </span>
                            <span className="applications-sidebar-label">
                                Dashboard
                            </span>
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            to="/applications"
                            className={({ isActive }) =>
                                isActive
                                    ? "applications-sidebar-nav-link applications-sidebar-nav-link-active"
                                    : "applications-sidebar-nav-link"
                            }
                            title="Applications"
                            aria-label="Applications"
                        >
                            <span className="applications-sidebar-nav-icon">
                                <ApplicationsIcon />
                            </span>
                            <span className="applications-sidebar-label">
                                Applications
                            </span>
                        </NavLink>
                    </li>
                </ul>
            </nav>

            <div className="applications-sidebar-footer">
                <div className="applications-sidebar-user">
                    <span
                        className="applications-sidebar-avatar"
                        aria-hidden="true"
                        title={
                            userEmail
                                ? `${userName} (${userEmail})`
                                : userName
                        }
                    >
                        {userInitials}
                    </span>

                    <span
                        className="applications-sidebar-user-details"
                        aria-hidden="true"
                    >
                        <span className="applications-sidebar-user-name">
                            {userName}
                        </span>
                        {userEmail && (
                            <span className="applications-sidebar-user-email">
                                {userEmail}
                            </span>
                        )}
                    </span>

                    <span className="applications-sidebar-sr-only">
                        {userEmail
                            ? `Signed in as ${userName}, ${userEmail}`
                            : `Signed in as ${userName}`}
                    </span>
                </div>

                <button
                    type="button"
                    className="applications-sidebar-logout"
                    aria-label="Log out"
                    title="Log out"
                    onClick={onLogout}
                >
                    <LogoutIcon />
                    <span className="applications-sidebar-label">
                        Log out
                    </span>
                </button>
            </div>
        </aside>
    );
}
