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

// Verified in index.html and main.tsx: React mounts the application here.
const APPLICATION_ROOT_SELECTOR = "#root";

const openOverlays: symbol[] = [];

let bodyScrollLockCount = 0;
let previousBodyOverflow: string | null = null;

interface PreservedAttributes {
    hadInert: boolean;
    inertValue: string | null;
    hadAriaHidden: boolean;
    ariaHiddenValue: string | null;
}

const overlayElements = new Map<symbol, HTMLElement>();
const isolatedElements = new Map<HTMLElement, PreservedAttributes>();

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

function captureAttributes(element: HTMLElement): PreservedAttributes {
    return {
        hadInert: element.hasAttribute("inert"),
        inertValue: element.getAttribute("inert"),
        hadAriaHidden: element.hasAttribute("aria-hidden"),
        ariaHiddenValue: element.getAttribute("aria-hidden"),
    };
}

function applyIsolation(element: HTMLElement): void {
    if (isolatedElements.has(element)) {
        return;
    }

    isolatedElements.set(element, captureAttributes(element));
    element.setAttribute("inert", "");
    element.setAttribute("aria-hidden", "true");
}

function restoreAttributes(element: HTMLElement): void {
    const original = isolatedElements.get(element);

    if (!original) {
        return;
    }

    isolatedElements.delete(element);

    if (original.hadInert) {
        element.setAttribute("inert", original.inertValue ?? "");
    } else {
        element.removeAttribute("inert");
    }

    if (original.hadAriaHidden) {
        element.setAttribute("aria-hidden", original.ariaHiddenValue ?? "");
    } else {
        element.removeAttribute("aria-hidden");
    }
}

function focusTopmostOverlay(): void {
    const topmostToken = openOverlays[openOverlays.length - 1];
    const topmostElement = topmostToken
        ? overlayElements.get(topmostToken)
        : undefined;

    if (!topmostElement) {
        return;
    }

    const panel = topmostElement.querySelector<HTMLElement>('[role="dialog"]');

    if (!panel) {
        return;
    }

    const focusableElements = getFocusableElements(panel);
    const target = focusableElements[0] ?? panel;

    target.focus({ preventScroll: true });
}

/**
 * Recomputes which subtrees must be hidden for the current overlay stack.
 * The application root is hidden whenever any overlay is open, and every
 * overlay except the topmost one is hidden from assistive technology.
 */
function updateAccessibilityIsolation(): void {
    const applicationRoot =
        document.querySelector<HTMLElement>(APPLICATION_ROOT_SELECTOR);
    const isolatedTargets = new Set<HTMLElement>();

    if (applicationRoot && openOverlays.length > 0) {
        isolatedTargets.add(applicationRoot);
    }

    openOverlays.forEach((token, index) => {
        if (index === openOverlays.length - 1) {
            return;
        }

        const element = overlayElements.get(token);

        if (element) {
            isolatedTargets.add(element);
        }
    });

    // Restore first so focus can safely return to a newly accessible subtree.
    for (const element of Array.from(isolatedElements.keys())) {
        if (!isolatedTargets.has(element)) {
            restoreAttributes(element);
        }
    }

    for (const element of isolatedTargets) {
        if (isolatedElements.has(element)) {
            continue;
        }

        // Never hide a subtree that currently owns focus.
        if (element.contains(document.activeElement)) {
            focusTopmostOverlay();
        }

        applyIsolation(element);
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
        const overlayElement = panel?.parentElement ?? null;
        const overlayToken = Symbol("application-overlay");
        const previouslyFocused =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        lockBodyScroll();
        registerOverlay(overlayToken);

        if (overlayElement) {
            overlayElements.set(overlayToken, overlayElement);
        }

        if (panel) {
            const focusableElements = getFocusableElements(panel);
            const initialFocusTarget =
                focusableElements[0] ?? panel;

            initialFocusTarget.focus({ preventScroll: true });
        }

        updateAccessibilityIsolation();

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

            overlayElements.delete(overlayToken);
            unlockBodyScroll();
            updateAccessibilityIsolation();

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
            data-application-overlay=""
            data-overlay-variant={variant}
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
