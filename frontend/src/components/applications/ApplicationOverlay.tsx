import {
    useEffect,
    useRef,
    type MouseEvent,
    type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import "./ApplicationOverlay.css";

export type ApplicationOverlayVariant = "drawer" | "dialog";

export interface ApplicationOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    variant: ApplicationOverlayVariant;
    ariaLabel: string;
    ariaDescribedBy?: string;
    children: ReactNode;
    closeOnBackdrop?: boolean;
    showCloseButton?: boolean;
}

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "summary",
    "[contenteditable='true']",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

const openOverlays: symbol[] = [];

let bodyScrollLockCount = 0;
let previousBodyOverflow: string | null = null;

function registerOverlay(overlayToken: symbol): void {
    openOverlays.push(overlayToken);
}

function unregisterOverlay(overlayToken: symbol): boolean {
    const index = openOverlays.indexOf(overlayToken);

    if (index === -1) {
        return false;
    }

    const wasTopmost = index === openOverlays.length - 1;

    openOverlays.splice(index, 1);

    return wasTopmost;
}

function isTopmostOverlay(overlayToken: symbol): boolean {
    return openOverlays[openOverlays.length - 1] === overlayToken;
}

function lockBodyScroll(): void {
    if (bodyScrollLockCount === 0) {
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
    }

    bodyScrollLockCount += 1;
}

function unlockBodyScroll(): void {
    bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);

    if (bodyScrollLockCount === 0 && previousBodyOverflow !== null) {
        document.body.style.overflow = previousBodyOverflow;
        previousBodyOverflow = null;
    }
}

function isVisible(element: HTMLElement): boolean {
    if (element.hidden) {
        return false;
    }

    if (element.closest("[inert]")) {
        return false;
    }

    if (element.closest("[aria-hidden='true']")) {
        return false;
    }

    const style = window.getComputedStyle(element);

    return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        element.getClientRects().length > 0
    );
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((element) => {
        if (element.matches(":disabled")) {
            return false;
        }

        if (element.getAttribute("aria-disabled") === "true") {
            return false;
        }

        if (element.tabIndex < 0) {
            return false;
        }

        return isVisible(element);
    });
}

function restoreFocus(element: HTMLElement | null): void {
    if (!element || !document.contains(element)) {
        return;
    }

    if (
        element.matches(":disabled") ||
        element.getAttribute("aria-disabled") === "true"
    ) {
        return;
    }

    try {
        element.focus({ preventScroll: true });
    } catch {
        // The previously focused element may no longer be focusable.
    }
}

export default function ApplicationOverlay({
    isOpen,
    onClose,
    variant,
    ariaLabel,
    ariaDescribedBy,
    children,
    closeOnBackdrop = true,
    showCloseButton = true,
}: ApplicationOverlayProps) {
    const panelRef = useRef<HTMLElement>(null);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const panel = panelRef.current;
        const overlayToken = Symbol("application-overlay");
        const previouslyFocused =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        lockBodyScroll();
        registerOverlay(overlayToken);

        if (panel) {
            const focusableElements = getFocusableElements(panel);
            const initialFocusTarget =
                focusableElements[0] ?? panel;

            initialFocusTarget.focus({ preventScroll: true });
        }

        function handleKeyDown(event: KeyboardEvent): void {
            if (!isTopmostOverlay(overlayToken)) {
                return;
            }

            if (event.key === "Escape") {
                event.preventDefault();
                onCloseRef.current();
                return;
            }

            if (event.key !== "Tab" || !panel) {
                return;
            }

            const focusableElements = getFocusableElements(panel);

            if (focusableElements.length === 0) {
                event.preventDefault();
                panel.focus({ preventScroll: true });
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement =
                focusableElements[focusableElements.length - 1];

            if (!firstElement || !lastElement) {
                return;
            }

            const activeElement = document.activeElement;
            const activeIndex =
                activeElement instanceof HTMLElement
                    ? focusableElements.indexOf(activeElement)
                    : -1;

            if (activeIndex === -1) {
                event.preventDefault();

                if (event.shiftKey) {
                    lastElement.focus();
                } else {
                    firstElement.focus();
                }

                return;
            }

            if (event.shiftKey && activeIndex === 0) {
                event.preventDefault();
                lastElement.focus();
                return;
            }

            if (
                !event.shiftKey &&
                activeIndex === focusableElements.length - 1
            ) {
                event.preventDefault();
                firstElement.focus();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);

            const wasTopmost = unregisterOverlay(overlayToken);

            unlockBodyScroll();

            if (wasTopmost) {
                restoreFocus(previouslyFocused);
            }
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    function handleBackdropClick(
        event: MouseEvent<HTMLDivElement>,
    ): void {
        if (
            closeOnBackdrop &&
            event.target === event.currentTarget
        ) {
            onClose();
        }
    }

    const panelClassName = [
        "application-overlay-panel",
        `application-overlay-panel-${variant}`,
        showCloseButton
            ? "application-overlay-panel-with-close"
            : "",
    ]
        .filter(Boolean)
        .join(" ");

    return createPortal(
        <div
            className="application-overlay-backdrop"
            onClick={handleBackdropClick}
        >
            <section
                ref={panelRef}
                className={panelClassName}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                aria-describedby={ariaDescribedBy}
                tabIndex={-1}
            >
                {showCloseButton && (
                    <div className="application-overlay-toolbar">
                        <button
                            type="button"
                            className="application-overlay-close-button"
                            aria-label={
                                variant === "drawer"
                                    ? "Close drawer"
                                    : "Close dialog"
                            }
                            onClick={onClose}
                        >
                            <span aria-hidden="true">×</span>
                        </button>
                    </div>
                )}

                <div className="application-overlay-content">
                    {children}
                </div>
            </section>
        </div>,
        document.body,
    );
}
