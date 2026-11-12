import "./WelcomeSection.css";

interface WelcomeSectionProps {
    userName: string;
}

export default function WelcomeSection({
    userName,
}: WelcomeSectionProps) {
    return (
        <section className="welcome-section">
            <div>
                <h1>Welcome back, {userName}!</h1>

                <p>
                    Here's an overview of your job application journey.
                    Keep track of your progress and stay organized.
                </p>
            </div>
        </section>
    );
}