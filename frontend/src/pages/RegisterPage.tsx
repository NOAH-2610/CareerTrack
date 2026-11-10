import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../api/auth";
import { ApiError } from "../api/client";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setErrorMessage(null);
        setSuccessMessage(null);

        const normalizedName = name.trim();
        const normalizedEmail = email.trim();

        if (!normalizedName || !normalizedEmail || !password) {
            setErrorMessage("Please complete all required fields.");
            return;
        }

        if (password.length < 8) {
            setErrorMessage("Your password must contain at least 8 characters.");
            return;
        }

        if (new TextEncoder().encode(password).length > 72) {
            setErrorMessage(
                "Your password must not exceed 72 UTF-8 bytes.",
            );
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage("Your passwords do not match.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await registerUser({
                name: normalizedName,
                email: normalizedEmail,
                password,
            });

            setSuccessMessage(
                response.message || "Your account was created successfully.",
            );

            setName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
        } catch (error) {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage(
                    "Something went wrong. Please try again.",
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card" aria-labelledby="register-heading">
                <header className="auth-header">
                    <Link to="/login" className="brand">
                        CareerTrack
                    </Link>

                    <h1 id="register-heading">Create your account</h1>

                    <p>
                        Start organizing your job applications in one place.
                    </p>
                </header>

                {successMessage ? (
                    <div className="registration-success" role="status">
                        <h2>Registration successful!</h2>

                        <p>{successMessage}</p>

                        <Link
                            to="/login"
                            className="auth-submit registration-login-link"
                        >
                            Continue to sign in
                        </Link>
                    </div>
                ) : (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-field">
                            <label htmlFor="name">Full name</label>

                            <input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

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
                                autoComplete="new-password"
                                placeholder="At least 8 characters"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                minLength={8}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="confirmPassword">
                                Confirm password
                            </label>

                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(event.target.value)
                                }
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
                            {isSubmitting
                                ? "Creating account..."
                                : "Create account"}
                        </button>
                    </form>
                )}

                <p className="auth-footer">
                    Already have an account?{" "}
                    <Link to="/login">Sign in</Link>
                </p>
            </section>
        </main>
    );
}