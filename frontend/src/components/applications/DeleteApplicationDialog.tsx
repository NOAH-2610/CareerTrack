import { useId } from "react";

import type { Application, Company } from "../../types";
import ApplicationOverlay from "./ApplicationOverlay";
import "./DeleteApplicationDialog.css";

export interface DeleteApplicationDialogProps {
    isOpen: boolean;
    application: Application | null;
    company: Company | null;
    onCancel: () => void;
    onConfirm: (application: Application) => void;
    isDeleting?: boolean;
}

export default function DeleteApplicationDialog({
    isOpen,
    application,
    company,
    onCancel,
    onConfirm,
    isDeleting = false,
}: DeleteApplicationDialogProps) {
    const descriptionId = useId();

    if (!application) {
        return null;
    }

    const position = application.position.trim() || "Untitled position";
    const companyName =
        company?.name?.trim() ||
        application.company?.name?.trim() ||
        "Unknown company";

    return (
        <ApplicationOverlay
            isOpen={isOpen}
            onClose={onCancel}
            variant="dialog"
            ariaLabel={`Delete application for ${position} at ${companyName}`}
            ariaDescribedBy={descriptionId}
        >
            <div className="application-delete-dialog">
                <header className="application-delete-dialog-header">
                    <p className="application-delete-dialog-eyebrow">
                        Confirm deletion
                    </p>
                    <h2 className="application-delete-dialog-title">
                        Delete application?
                    </h2>
                    <p
                        id={descriptionId}
                        className="application-delete-dialog-warning"
                    >
                        This action is permanent and cannot be undone. The
                        application record will be removed from CareerTrack.
                    </p>
                </header>

                <div className="application-delete-dialog-summary">
                    <p className="application-delete-dialog-position">
                        {position}
                    </p>
                    <p className="application-delete-dialog-company">
                        {companyName}
                    </p>
                </div>

                <p
                    className="application-delete-dialog-status"
                    role="status"
                    aria-live="polite"
                >
                    {isDeleting ? "Deleting application…" : ""}
                </p>

                <footer className="application-delete-dialog-actions">
                    <button
                        type="button"
                        className="application-delete-dialog-button application-delete-dialog-button-secondary"
                        onClick={onCancel}
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="application-delete-dialog-button application-delete-dialog-button-danger"
                        onClick={() => onConfirm(application)}
                        disabled={isDeleting}
                        aria-busy={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete application"}
                    </button>
                </footer>
            </div>
        </ApplicationOverlay>
    );
}
