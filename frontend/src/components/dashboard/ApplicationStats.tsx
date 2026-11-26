import type { ApplicationStatusCounts } from "./applicationCounts";
import StatisticsCard from "./StatisticsCard";
import "./ApplicationStats.css";

interface ApplicationStatsProps {
    counts: ApplicationStatusCounts;
}

export default function ApplicationStats({ counts }: ApplicationStatsProps) {
    return (
        <section
            className="application-stats"
            aria-labelledby="application-stats-heading"
        >
            <h2 id="application-stats-heading">Application Overview</h2>

            <div className="statistics-grid">
                <StatisticsCard
                    title="Total Applications"
                    value={counts.total}
                    description="All tracked applications"
                />

                <StatisticsCard
                    title="Applied"
                    value={counts.APPLIED}
                    description="Applications submitted"
                />

                <StatisticsCard
                    title="Interview Stage"
                    value={counts.INTERVIEW}
                    description="Applications in interview stage"
                />

                <StatisticsCard
                    title="Offers"
                    value={counts.OFFER}
                    description="Job offers received"
                />
            </div>
        </section>
    );
}
