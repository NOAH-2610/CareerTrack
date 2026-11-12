import type { Application } from "../../types";
import StatisticsCard from "./StatisticsCard";
import "./ApplicationStats.css";

interface ApplicationStatsProps {
    applications: Application[];
}

export default function ApplicationStats({
    applications,
}: ApplicationStatsProps) {
    const totalApplications = applications.length;

    const appliedCount = applications.filter(
        (application) => application.status === "APPLIED",
    ).length;

    const interviewCount = applications.filter(
        (application) => application.status === "INTERVIEW",
    ).length;

    const offerCount = applications.filter(
        (application) => application.status === "OFFER",
    ).length;

    const rejectedCount = applications.filter(
        (application) => application.status === "REJECTED",
    ).length;

    return (
        <section className="application-stats">
            <h2>Application Overview</h2>

            <div className="statistics-grid">
                <StatisticsCard
                    title="Total Applications"
                    value={totalApplications}
                    description="All tracked applications"
                />

                <StatisticsCard
                    title="Applied"
                    value={appliedCount}
                    description="Applications submitted"
                />

                <StatisticsCard
                    title="Interviews"
                    value={interviewCount}
                    description="Applications in interview stage"
                />

                <StatisticsCard
                    title="Offers"
                    value={offerCount}
                    description="Job offers received"
                />

                <StatisticsCard
                    title="Rejected"
                    value={rejectedCount}
                    description="Applications rejected"
                />
            </div>
        </section>
    );
}