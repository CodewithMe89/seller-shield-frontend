import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "../css/Insights.css";

const categories = [
    { value: "all", label: "All Insights" },
    { value: "inventory", label: "Inventory" },
    { value: "profit", label: "Profit" },
    { value: "returns", label: "Returns" },
    { value: "expense", label: "Expenses" },
];

const categoryIcons = {
    inventory: "📦",
    profit: "💰",
    returns: "↩️",
    expense: "💳",
};

function Insights() {
    const [insights, setInsights] = useState([]);
    const [activeCategory, setActiveCategory] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchInsights = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/api/insights");
            setInsights(response.data.insights || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load business insights. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    const filteredInsights = useMemo(() => {
        if (activeCategory === "all") return insights;

        return insights.filter(
            (insight) => insight.type === activeCategory
        );
    }, [insights, activeCategory]);

    const highPriority = insights.filter(
        (item) => item.severity === "high"
    ).length;

    const mediumPriority = insights.filter(
        (item) => item.severity === "medium"
    ).length;

    const lowPriority = insights.filter(
        (item) => item.severity === "low"
    ).length;

    if (loading) {
        return (
            <div className="insights-page">
                <div className="insights-loading">
                    <div className="insights-spinner" />
                    <p>Analyzing your business data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="insights-page">
            <header className="insights-header">
                <div>
                    <span className="insights-eyebrow">
                        BUSINESS INTELLIGENCE
                    </span>
                    <h1>Business Insights</h1>
                    <p>
                        Identify problems, understand performance, and
                        discover opportunities in your business.
                    </p>
                </div>

                <button
                    className="insights-refresh"
                    onClick={fetchInsights}
                    type="button"
                >
                    ↻ Refresh Insights
                </button>
            </header>

            {error && (
                <div className="insights-error" role="alert">
                    <span>{error}</span>
                    <button onClick={fetchInsights} type="button">
                        Retry
                    </button>
                </div>
            )}

            {!error && (
                <>
                    <section className="insights-stats">
                        <div className="insight-stat">
                            <div className="stat-icon total-icon">✦</div>
                            <div>
                                <span>Total Insights</span>
                                <h2>{insights.length}</h2>
                            </div>
                        </div>

                        <div className="insight-stat">
                            <div className="stat-icon high-icon">!</div>
                            <div>
                                <span>High Priority</span>
                                <h2>{highPriority}</h2>
                            </div>
                        </div>

                        <div className="insight-stat">
                            <div className="stat-icon medium-icon">◉</div>
                            <div>
                                <span>Medium Priority</span>
                                <h2>{mediumPriority}</h2>
                            </div>
                        </div>

                        <div className="insight-stat">
                            <div className="stat-icon low-icon">✓</div>
                            <div>
                                <span>Low Priority</span>
                                <h2>{lowPriority}</h2>
                            </div>
                        </div>
                    </section>

                    <section className="insights-content">
                        <div className="insights-section-header">
                            <div>
                                <h2>Recommendations & Alerts</h2>
                                <p>
                                    Actionable findings based on your current
                                    business data.
                                </p>
                            </div>
                            <span className="insights-count">
                                {filteredInsights.length} found
                            </span>
                        </div>

                        <div className="insights-filters">
                            {categories.map((category) => (
                                <button
                                    key={category.value}
                                    type="button"
                                    className={
                                        activeCategory === category.value
                                            ? "insight-filter active"
                                            : "insight-filter"
                                    }
                                    onClick={() =>
                                        setActiveCategory(category.value)
                                    }
                                >
                                    {category.label}
                                    {category.value === "all" && (
                                        <span>{insights.length}</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {filteredInsights.length === 0 ? (
                            <div className="insights-empty">
                                <div className="empty-icon">
                                    {insights.length === 0 ? "✓" : "⌕"}
                                </div>
                                <h3>
                                    {insights.length === 0
                                        ? "No issues detected"
                                        : "No insights in this category"}
                                </h3>
                                <p>
                                    {insights.length === 0
                                        ? "There are no alerts to display based on the current business data."
                                        : "Try selecting another category to view its insights."}
                                </p>
                            </div>
                        ) : (
                            <div className="insights-list">
                                {filteredInsights.map((insight, index) => (
                                    <article
                                        className={`insight-card severity-${insight.severity}`}
                                        key={`${insight.type}-${insight.title}-${index}`}
                                    >
                                        <div className="insight-category-icon">
                                            {categoryIcons[insight.type] || "📊"}
                                        </div>

                                        <div className="insight-details">
                                            <div className="insight-title-row">
                                                <h3>{insight.title}</h3>
                                                <span
                                                    className={`severity-badge ${insight.severity}`}
                                                >
                                                    {insight.severity || "info"}
                                                </span>
                                            </div>

                                            <p>{insight.message}</p>

                                            <span className="insight-category-label">
                                                {insight.type}
                                            </span>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="insights-note">
                        <span>ⓘ</span>
                        <p>
                            Insights are generated from your products, orders,
                            returns, and expenses. Review important alerts before
                            making business decisions.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}

export default Insights;