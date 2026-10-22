import { useEffect, useState } from 'react';
import {
    Plus,
    RefreshCw,
    ShoppingBag,
    Pencil,
    Trash2,
} from 'lucide-react';
import api from '../services/api';
import '../css/Order.css';

const STATUSES = [
    "Pending",
    "Confirmed",
    "Shipped",
    "Delivered",
    "Cancelled",
    "Returned",
];

const initialForm = {
    productId: "",
    orderNumber: "",
    quantity: 1,
    orderStatus: "Pending",
    customerLocation: "",
    orderDate: new Date().toISOString().slice(0, 10),
};

function getErrorMessage(error) {
    return (
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong."
    );
}

function formatDate(date) {
    if (!date) return "—";

    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
        ? "—"
        : parsed.toLocaleString("en-IN");
}

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return "—";

    return Number(amount).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    });
}

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [editingId, setEditingId] = useState(null);

    async function fetchData() {
        setLoading(true);
        setError("");

        try {
            const [ordersResponse, productsResponse] = await Promise.all([
                api.get("/api/orders"),
                api.get("/api/products"),
            ]);

            const ordersData = ordersResponse.data;
            const productsData = productsResponse.data;

            setOrders(
                Array.isArray(ordersData)
                    ? ordersData
                    : ordersData.orders || []
            );

            setProducts(
                Array.isArray(productsData)
                    ? productsData
                    : productsData.products || []
            );
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData()
    }, []);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: name === "quantity" ? value : value,
        }));
    }


    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSuccess("");

        const quantity = Number(form.quantity);

        if (!form.productId || !form.orderNumber.trim()) {
            setError("Product and order number are required.");
            return;
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            setError("Quantity must be a positive whole number.");
            return;
        }

        const selectedProduct = products.find(
            (product) => product._id === form.productId
        );

        if (!selectedProduct) {
            setError("Selected product was not found. Refresh and try again.");
            return;
        }

        // Editing does not support changing the product in this version.
        if (
            !editingId &&
            form.orderStatus !== "Cancelled" &&
            quantity > Number(selectedProduct.stock)
        ) {
            setError(`Only ${selectedProduct.stock} units are available.`);
            return;
        }

        setSaving(true);

        try {
            if (editingId) {
                const payload = {
                    quantity,
                    orderStatus: form.orderStatus,
                    customerLocation: form.customerLocation.trim(),
                    orderDate: form.orderDate,
                };

                const response = await api.put(
                    `/api/orders/${editingId}`,
                    payload
                );

                setSuccess(response.data.message || "Order updated successfully.");
            } else {
                const payload = {
                    productId: form.productId,
                    orderNumber: form.orderNumber.trim(),
                    quantity,
                    orderStatus: form.orderStatus,
                    customerLocation: form.customerLocation.trim(),
                    orderDate: form.orderDate,
                };

                const response = await api.post("/api/orders", payload);

                setSuccess(response.data.message || "Order created successfully.");
            }

            setForm(initialForm);
            setEditingId(null);
            setShowForm(false);

            await fetchData();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    function handleEdit(order) {
        const productId =
            typeof order.productId === "object"
                ? order.productId?._id
                : order.productId;

        if (!productId) {
            setError("This order has no linked product. Its product cannot be edited.")
            return;
        }

        setError("")
        setSuccess("")
        setEditingId(order._id);
        setShowForm(true);

        setForm({
            productId,
            orderNumber: order.orderNumber || "",
            quantity: order.quantity ?? 1,
            orderStatus: order.orderStatus || "Pending",
            customerLocation: order.customerLocation || "",
            orderDate: order.orderDate
                ? new Date(order.orderDate).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10),
        })
    }

    async function handleDelete(order) {
        const confirmed = window.confirm(
            `Delete order "${order.orderNumber}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        setError("")
        setSuccess("")

        try {
            const response = await api.delete(`/api/orders/${order._id}`);

            setSuccess(response.data.message || "Order deleted successfully.")

            if (editingId === order._id) {
                setEditingId(null);
                setShowForm(false);
                setForm(initialForm);
            }

            await fetchData()
        } catch (err) {
            setError(getErrorMessage(err))
        }
    }

    function getProductName(order) {
        if (order.productId && typeof order.productId === "object") {
            return order.productId.name || "Unknown product";
        }

        return (
            products.find((product) => product._id === order.productId)?.name ||
            "Unknown product"
        );
    }
    function getStatusClass(status) {
        return (status || "Pending").toLowerCase();
    }

    const activeOrders = orders.filter(
        (order) => order.orderStatus !== "Cancelled"
    ).length;

    return (
        <main className="orders-page">
            <header className="orders-header">
                <div>
                    <h1>Orders</h1>
                    <p>Manage your sales and track order status.</p>
                </div>

                <div className="orders-actions">
                    <button
                        type="button"
                        className="orders-refresh"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <button
                        type="button"
                        className="orders-add"
                        onClick={() => {
                            setError("");
                            setSuccess("");
                            setShowForm((previous) => !previous);
                        }}
                    >
                        <Plus size={18} />
                        {showForm ? "Close Form" : "Create Order"}
                    </button>
                </div>
            </header>

            <section className="orders-stats">
                <article className="orders-stat-card">
                    <span>Total orders</span>
                    <strong>{orders.length}</strong>
                </article>

                <article className="orders-stat-card">
                    <span>Not cancelled</span>
                    <strong>{activeOrders}</strong>
                </article>

                <article className="orders-stat-card">
                    <span>Products available</span>
                    <strong>{products.length}</strong>
                </article>
            </section>

            {error && (
                <div className="orders-alert orders-alert-error" role="alert">
                    {error}
                </div>
            )}

            {success && (
                <div className="orders-alert orders-alert-success" role="status">
                    {success}
                </div>
            )}

            {showForm && (
                <section className="orders-form-card">
                    <div className="orders-section-heading">
                        <div>
                            <h2>{editingId ? "Edit order" : "Create a order"}</h2>
                            <p>Enter the order details below.</p>
                        </div>
                    </div>

                    {products.length === 0 ? (
                        <p className="orders-empty">
                            Add a product in the Products section before creating an order.
                        </p>
                    ) : (
                        <form onSubmit={handleSubmit} className="orders-form">
                            <label>
                                Order number *
                                <input
                                    name="orderNumber"
                                    value={form.orderNumber}
                                    onChange={handleChange}
                                    placeholder="e.g. ORD-1001"
                                    required
                                />
                            </label>

                            <label>
                                Product *
                                <select
                                    name="productId"
                                    value={form.productId}
                                    onChange={handleChange}
                                    disabled={Boolean(editingId)}
                                    required
                                >
                                    <option value="">Select a product</option>
                                    {products.map((product) => (
                                        <option key={product._id} value={product._id}>
                                            {product.name} — Stock: {product.stock}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Quantity *
                                <input
                                    type="number"
                                    name="quantity"
                                    value={form.quantity}
                                    onChange={handleChange}
                                    min="1"
                                    step="1"
                                    required
                                />
                            </label>

                            <label>
                                Order status
                                <select
                                    name="orderStatus"
                                    value={form.orderStatus}
                                    onChange={handleChange}
                                >
                                    {STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Customer location
                                <input
                                    name="customerLocation"
                                    value={form.customerLocation}
                                    onChange={handleChange}
                                    placeholder="e.g. Faridabad, Haryana"
                                />
                            </label>

                            <label>
                                Order date *
                                <input
                                    type="date"
                                    name="orderDate"
                                    value={form.orderDate}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <p className="orders-form-note">
                                Stock is reduced when you create an order unless its status
                                is Cancelled. Prices are recorded by the backend.
                            </p>

                            <div className="orders-form-actions">
                                <button
                                    type="button"
                                    className="orders-cancel"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingId(null);
                                        setForm(initialForm);
                                        setError("")
                                    }}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="orders-add"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : editingId ? "Update Order" : "Save Order"}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            )}

            <section className="orders-table-card">
                <div className="orders-section-heading">
                    <div>
                        <h2>All orders</h2>
                        <p>Your orders fetched from the backend.</p>
                    </div>
                    <span className="orders-count">{orders.length} orders</span>
                </div>

                {loading ? (
                    <div className="orders-state">Loading orders...</div>
                ) : orders.length === 0 ? (
                    <div className="orders-state">
                        <ShoppingBag size={36} />
                        <h3>No orders yet</h3>
                        <p>Create your first order to see it here.</p>
                    </div>
                ) : (
                    <div className="orders-table-wrap">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Selling price</th>
                                    <th>Status</th>
                                    <th>Order date</th>
                                    <th>Location</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order._id}>
                                        <td>
                                            <strong>{order.orderNumber || "—"}</strong>
                                        </td>
                                        <td>{getProductName(order)}</td>
                                        <td>{order.quantity ?? "—"}</td>
                                        <td>
                                            {formatCurrency(order.sellingPriceSnapshot)}
                                        </td>
                                        <td>
                                            <span
                                                className={`orders-status ${getStatusClass(
                                                    order.orderStatus
                                                )}`}
                                            >
                                                {order.orderStatus || "Pending"}
                                            </span>
                                        </td>
                                        <td>{formatDate(order.orderDate)}</td>
                                        <td>{order.customerLocation || "—"}</td>
                                        <td>
                                            <div className="orders-row-actions">
                                                <button
                                                    type="button"
                                                    className="orders-edit-btn"
                                                    onClick={() => handleEdit(order)}
                                                    title='Edit order'
                                                    aria-label='Edit order'
                                                >
                                                    <Pencil size={16} />
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="orders-delete-btn"
                                                    onClick={() => handleDelete(order)}
                                                    title='Delete order'
                                                    aria-label='Delete order'
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}