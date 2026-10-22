
import { useEffect, useState } from "react";
import {
    Wallet,
    Receipt,
    TrendingUp,
    Package,
    AlertTriangle,
    Lightbulb,
    RefreshCw,
} from "lucide-react";

import api from "../services/api";

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);
}

function StatCard({ title, value, icon: Icon, color, description }) {
    return (
        <article className="stat-card">
            <div className="stat-card-top">
                <span>{title}</span>

                <span
                    className="stat-icon"
                    style={{ background: color }}
                >
                    <Icon size={21} />
                </span>
            </div>

            <h2>{value}</h2>
            <p>{description}</p>
        </article>
    );
}

function Dashboard() {
    const [profit, setProfit] = useState(null);
    const [inventory, setInventory] = useState(null);
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDashboard = async () => {
        setLoading(true);
        setError("");

        try {
            const [profitResponse, inventoryResponse, insightsResponse] =
                await Promise.all([
                    api.get("/api/profit/summary"),
                    api.get("/api/inventory/summary"),
                    api.get("/api/insights"),
                ]);

            const profitData = profitResponse.data;
            const inventoryData = inventoryResponse.data;
            const insightsData = insightsResponse.data;

            // Profit API returns summary.overview
            setProfit(profitData.summary?.overview ?? null);

            // Inventory API returns inventory
            setInventory(inventoryData.inventory ?? null);

            // Insights API returns an insights array
            setInsights(
                Array.isArray(insightsData.insights)
                    ? insightsData.insights
                    : []
            );
        } catch (err) {
            console.error("Dashboard fetch failed:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load dashboard data. Please retry."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="dashboard-message">
                <RefreshCw className="spin" size={22} />
                <p>Loading your business analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <AlertTriangle size={24} />
                <p>{error}</p>

                <button onClick={fetchDashboard}>
                    Try again
                </button>
            </div>
        );
    }

    const revenue = profit?.revenue ?? 0;
    const expenses = profit?.totalExpenses ?? 0;
    const netProfit = profit?.netProfit ?? 0;
    const margin = profit?.profitMargin ?? 0;

    return (
        <div className="dashboard">
            <div className="dashboard-heading">
                <div>
                    <h1>Business Overview</h1>
                    <p>Understand how your business is performing.</p>
                </div>

                <button
                    className="refresh-button"
                    onClick={fetchDashboard}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <section className="stats-grid">
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(revenue)}
                    icon={Wallet}
                    color="#dbeafe"
                    description="From delivered orders"
                />

                <StatCard
                    title="Total Expenses"
                    value={formatCurrency(expenses)}
                    icon={Receipt}
                    color="#fef3c7"
                    description="Recorded business expenses"
                />

                <StatCard
                    title="Net Profit"
                    value={formatCurrency(netProfit)}
                    icon={TrendingUp}
                    color="#d1fae5"
                    description="After recorded costs"
                />

                <StatCard
                    title="Profit Margin"
                    value={`${Number(margin).toFixed(2)}%`}
                    icon={Package}
                    color="#ede9fe"
                    description="Profit as a share of revenue"
                />
            </section>

            <section className="dashboard-lower-grid">
                <article className="panel">
                    <div className="panel-heading">
                        <Package size={21} />
                        <h2>Inventory Overview</h2>
                    </div>

                    {inventory ? (
                        <div className="inventory-stats">
                            <div>
                                <span>Total Products</span>
                                <strong>
                                    {inventory.totalProducts ?? 0}
                                </strong>
                            </div>

                            <div>
                                <span>Units in Stock</span>
                                <strong>
                                    {inventory.totalUnits ?? 0}
                                </strong>
                            </div>

                            <div>
                                <span>Stock Value</span>
                                <strong>
                                    {formatCurrency(inventory.stockValue)}
                                </strong>
                            </div>

                            <div>
                                <span>Out of Stock</span>
                                <strong>
                                    {inventory.outOfStockProducts ?? 0}
                                </strong>
                            </div>
                        </div>
                    ) : (
                        <p>Inventory summary is unavailable.</p>
                    )}
                </article>

                <article className="panel">
                    <div className="panel-heading">
                        <Lightbulb size={21} />
                        <h2>Business Insights</h2>
                    </div>

                    {insights.length === 0 ? (
                        <p>No insights available yet.</p>
                    ) : (
                        <div className="insights-list">
                            {insights.slice(0, 5).map((insight, index) => (
                                <div
                                    className="insight-item"
                                    key={`${insight.title}-${index}`}
                                >
                                    <span
                                        className="insight-dot"
                                        style={{
                                            background:
                                                insight.severity === "high"
                                                    ? "#ef4444"
                                                    : insight.severity === "medium"
                                                        ? "#f59e0b"
                                                        : "#2563eb",
                                        }}
                                    />

                                    <div>
                                        <strong>{insight.title}</strong>
                                        <p>
                                            {insight.message ||
                                                "Review this business insight."}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </article>
            </section>
        </div>
    );
}

export default Dashboard;
