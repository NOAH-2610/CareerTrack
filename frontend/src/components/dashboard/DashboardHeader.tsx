import { Link, NavLink } from "react-router-dom";
import "./DashboardHeader.css";

interface DashboardHeaderProps {
    userName: string;
    onLogout: () => void;
}

export default function DashboardHeader({
    userName,
    onLogout,
}: DashboardHeaderProps) {
    return (
        <header className="dashboard-header">
            <div className="dashboard-header-inner">
                <Link to="/dashboard" className="dashboard-brand">
                    CareerTrack
                </Link>

                <nav
                    className="dashboard-navigation"
                    aria-label="Main navigation"
                >
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            isActive ? "nav-link active" : "nav-link"
                        }
                        end
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/applications"
                        className={({ isActive }) =>
                            isActive ? "nav-link active" : "nav-link"
                        }
                    >
                        Applications
                    </NavLink>
                </nav>

                <div className="dashboard-header-actions">
                    <span className="dashboard-user-name">
                        {userName}
                    </span>

                    <button
                        type="button"
                        className="dashboard-logout-button"
                        onClick={onLogout}
                    >
                        Log out
                    </button>
                </div>
            </div>
        </header>
    );
}
