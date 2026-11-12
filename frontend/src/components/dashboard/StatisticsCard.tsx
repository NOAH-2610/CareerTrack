import "./StatisticsCard.css";

interface StatisticsCardProps {
    title: string;
    value: number;
    description: string;
}

export default function StatisticsCard({
    title,
    value,
    description,
}: StatisticsCardProps) {
    return (
        <article className="statistics-card">
            <h3>{title}</h3>

            <p className="statistics-value">{value}</p>

            <p className="statistics-description">{description}</p>
        </article>
    );
}