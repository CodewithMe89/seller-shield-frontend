
import { useEffect, useState } from "react";
import {
    Plus,
    Search,
    Package,
    Trash2,
    RefreshCw,
    X,
    AlertCircle,
    Pencil
} from "lucide-react";

import api from "../services/api";

const initialForm = {
    name: "",
    sku: "",
    category: "",
    sellingPrice: "",
    costPrice: "",
    stock: "",
    lowStockThreshold: "5",
    description: "",
};

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);
}

function Products() {
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const fetchProducts = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/api/products");

            // Supports either { products: [...] } or a direct array.
            const data = response.data;
            const productList = Array.isArray(data)
                ? data
                : data.products;

            if (!Array.isArray(productList)) {
                throw new Error("Unexpected products API response.");
            }

            setProducts(productList);
        } catch (err) {
            console.error("Fetch products failed:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to load products."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleChange = (e) => {
        setForm((previous) => ({
            ...previous,
            [e.target.name]: e.target.value,
        }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        const sellingPrice = Number(form.sellingPrice);
        const costPrice = Number(form.costPrice);
        const stock = Number(form.stock);
        const lowStockThreshold = Number(form.lowStockThreshold);

        if (
            !Number.isFinite(sellingPrice) ||
            !Number.isFinite(costPrice) ||
            !Number.isInteger(stock) ||
            !Number.isInteger(lowStockThreshold) ||
            sellingPrice < 0 ||
            costPrice < 0 ||
            stock < 0 ||
            lowStockThreshold < 0
        ) {
            setError(
                "Enter valid prices and non-negative whole numbers for stock."
            );
            return;
        }

        // Prepare the data to send to the backend
        const payload = {
            name: form.name.trim(),
            sku: form.sku.trim().toUpperCase(),
            category: form.category.trim(),
            sellingPrice,
            costPrice,
            stock,
            lowStockThreshold,
            description: form.description.trim(),
        };

        setSaving(true);

        try {
            if (editingId) {
                // Update existing product
                await api.put(`/api/products/${editingId}`, payload);
                setMessage("Product updated successfully.");
            } else {
                // Create new product
                await api.post("/api/products", payload);
                setMessage("Product added successfully.");
            }

            setForm(initialForm);
            setEditingId(null);
            setShowForm(false);

            // Fetch the latest product list
            await fetchProducts();
        } catch (err) {
            console.error("Save product failed:", err);

            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Unable to save product."
            );
        } finally {
            setSaving(false);
        }
    };


    const handleDelete = async (product) => {
        const productId = product._id || product.id;

        if (!productId) {
            setError("Cannot delete: product ID is missing.");
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete "${product.name}"?`
        );

        if (!confirmed) return;

        setError("");
        setMessage("");
        setDeletingId(productId);

        try {
            await api.delete(`/api/products/${productId}`);

            setProducts((previous) =>
                previous.filter(
                    (item) => (item._id || item.id) !== productId
                )
            );

            setMessage("Product deleted successfully.");
        } catch (err) {
            console.error("Delete product failed:", err);

            setError(
                err.response?.data?.message ||
                "Unable to delete product."
            );
        } finally {
            setDeletingId(null);
        }
    };

    const filteredProducts = products.filter((product) => {
        const query = search.trim().toLowerCase();

        return (
            product.name?.toLowerCase().includes(query) ||
            product.sku?.toLowerCase().includes(query) ||
            product.category?.toLowerCase().includes(query)
        );
    });

    const getStockStatus = (product) => {
        if (product.stock === 0) {
            return { label: "Out of stock", className: "stock-out" };
        }

        if (product.stock <= product.lowStockThreshold) {
            return { label: "Low stock", className: "stock-low" };
        }

        return { label: "In stock", className: "stock-good" };
    };

    const handleEdit = (product) => {
        setError("");
        setMessage("");

        setForm({
            name: product.name ?? "",
            sku: product.sku ?? "",
            category: product.category ?? "",
            sellingPrice: product.sellingPrice ?? "",
            costPrice: product.costPrice ?? "",
            stock: product.stock ?? "",
            lowStockThreshold: product.lowStockThreshold ?? "",
            description: product.description ?? "",
        });

        setEditingId(product._id || product.id);
        setShowForm(true);
    };
    return (
        <div className="products-page">
            <div className="products-heading">
                <div>
                    <h1>Products</h1>
                    <p>Manage your products, prices, and inventory.</p>
                </div>

                <button
                    className="primary-button"
                    onClick={() => {
                        setError("");
                        setMessage("");
                        setForm(initialForm);
                        setShowForm((previous) => !previous);
                    }}
                >
                    {showForm ? <X size={18} /> : <Plus size={18} />}
                    {showForm ? "Close Form" : "Add Product"}
                </button>
            </div>

            {error && (
                <div className="products-alert error-alert" role="alert">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {message && (
                <div className="products-alert success-alert" role="status">
                    {message}
                </div>
            )}

            {showForm && (
                <section className="product-form-panel">
                    <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>

                    <form onSubmit={handleSubmit}>
                        <div className="product-form-grid">
                            <label>
                                Product Name *
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    maxLength={100}
                                />
                            </label>

                            <label>
                                SKU *
                                <input
                                    name="sku"
                                    value={form.sku}
                                    onChange={handleChange}
                                    required
                                    maxLength={50}
                                />
                            </label>

                            <label>
                                Category *
                                <input
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    required
                                    maxLength={60}
                                />
                            </label>

                            <label>
                                Selling Price (₹) *
                                <input
                                    name="sellingPrice"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.sellingPrice}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <label>
                                Cost Price (₹) *
                                <input
                                    name="costPrice"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.costPrice}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <label>
                                Initial Stock *
                                <input
                                    name="stock"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.stock}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <label>
                                Low Stock Threshold *
                                <input
                                    name="lowStockThreshold"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.lowStockThreshold}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <label className="full-width">
                                Description
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={3}
                                    maxLength={1000}
                                />
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : editingId ? "Update Product" : "Save Product"}
                        </button>
                    </form>
                </section>
            )}

            <section className="products-list-panel">
                <div className="products-toolbar">
                    <div>
                        <h2>All Products</h2>
                        <p>{products.length} products in your inventory</p>
                    </div>

                    <div className="products-actions">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="search"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <button
                            className="secondary-button"
                            onClick={fetchProducts}
                            disabled={loading}
                            aria-label="Refresh products"
                        >
                            <RefreshCw size={17} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="products-empty">
                        <RefreshCw className="spin" size={22} />
                        <p>Loading products...</p>
                    </div>
                ) : error && products.length === 0 ? (
                    <div className="products-empty">
                        <AlertCircle size={24} />
                        <p>Could not load your products.</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="products-empty">
                        <Package size={32} />
                        <h3>
                            {search ? "No matching products" : "No products yet"}
                        </h3>
                        <p>
                            {search
                                ? "Try a different search."
                                : "Add your first product to start tracking inventory."}
                        </p>
                    </div>
                ) : (
                    <div className="products-table-wrapper">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th>Selling Price</th>
                                    <th>Cost Price</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredProducts.map((product) => {
                                    const status = getStockStatus(product);
                                    const id = product._id || product.id;

                                    return (
                                        <tr key={id}>
                                            <td>
                                                <strong>{product.name}</strong>
                                                <span className="product-category">
                                                    {product.category}
                                                </span>
                                            </td>

                                            <td>{product.sku}</td>

                                            <td>
                                                {formatCurrency(product.sellingPrice)}
                                            </td>

                                            <td>
                                                {formatCurrency(product.costPrice)}
                                            </td>

                                            <td>{product.stock}</td>

                                            <td>
                                                <span
                                                    className={`stock-badge ${status.className}`}
                                                >
                                                    {status.label}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    className="delete-button"
                                                    onClick={() => handleDelete(product)}
                                                    disabled={deletingId === id}
                                                    aria-label={`Delete ${product.name}`}
                                                    title="Delete product"
                                                >
                                                    {deletingId === id
                                                        ? "Deleting..."
                                                        : <Trash2 size={17} />}
                                                </button>
                                            </td>
                                            <td>
                                                <button
                                                    className="edit-button"
                                                    onClick={() => handleEdit(product)}
                                                    disabled={deletingId === id || saving}
                                                    aria-label={`Edit ${product.name}`}
                                                    title="Edit product"
                                                >
                                                    <Pencil size={17} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default Products;
