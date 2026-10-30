import { useAuth } from "../auth/authContext";

export default function DashboardPage() {
    const { user, logout } = useAuth();

    return (
        <main>
            <h1>CareerTrack Dashboard</h1>

            <p>
                Welcome, {user?.name}!
            </p>

            <p>
                Email: {user?.email}
            </p>

            <button type="button" onClick={logout}>
                Log out
            </button>
        </main>
    );
}