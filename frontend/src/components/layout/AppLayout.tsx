import { useState, type ReactNode } from "react";

import ApplicationsSidebar from "../applications/ApplicationsSidebar";
import type { User } from "../../types";
import "./AppLayout.css";

interface AppLayoutProps {
    user: User | null;
    onLogout: () => void;
    mainId?: string;
    children: ReactNode;
}

export default function AppLayout({
    user,
    onLogout,
    mainId = "main-content",
    children,
}: AppLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="app-layout">
            <a className="app-skip-link" href={`#${mainId}`}>
                Skip to main content
            </a>

            <ApplicationsSidebar
                user={user}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapsed={() =>
                    setIsSidebarCollapsed((current) => !current)
                }
                onLogout={onLogout}
            />

            <main
                id={mainId}
                className="app-layout-main"
                aria-label="Main content"
                tabIndex={-1}
            >
                {children}
            </main>
        </div>
    );
}
