import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { ApiError } from "../api/client";
import { useAuth } from "../auth/authContext";

interface LoginLocationState {
    from?: {
        pathname?: string;
    };
}

export default function LoginPage() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const locationState = location.state as LoginLocationState | null;
    const requestedPath = locationState?.from?.pathname;

    const redirectPath =
        requestedPath &&
            requestedPath.startsWith("/") &&
            !requestedPath.startsWith("//") &&
            requestedPath !== "/login" &&
            requestedPath !== "/register"
            ? requestedPath
            : "/dashboard";

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);

        const normalizedEmail = email.trim();

        if (!normalizedEmail || !password) {
            setErrorMessage("Please enter both your email and password.");
            return;
        }

        setIsSubmitting(true);

        try {
            await login({
                email: normalizedEmail,
                password,
            });

            navigate(redirectPath, { replace: true });
        } catch (error) {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage("Something went wrong. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card" aria-labelledby="login-heading">
                <header className="auth-header">
                    <Link to="/login" className="brand">
                        CareerTrack
                    </Link>

                    <h1 id="login-heading">Welcome back</h1>

                    <p>
                        Sign in to continue managing your job applications.
                    </p>
                </header>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label htmlFor="email">Email address</label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="password">Password</label>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {errorMessage && (
                        <div className="form-error" role="alert">
                            {errorMessage}
                        </div>
                    )}

                    <button
                        className="auth-submit"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account?{" "}
                    <Link to="/register">Create one</Link>
                </p>
            </section>
        </main>
    );

}
