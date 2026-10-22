import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package,
  Boxes,
  AlertTriangle,
  CircleDollarSign,
  RefreshCw,
  Search,
  Plus,
  Minus,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import api from "../services/api";
import "../css/Inventory.css";

const EMPTY_SUMMARY = {
  totalProducts: 0,
  totalUnits: 0,
  stockValue: 0,
  lowStockThreshold: 0,
  outOfStockProducts: 0,
};

function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.err ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function statusClass(status) {
  if (status === "Healthy") return "healthy";
  if (status === "Low Stock") return "low";
  return "out";
}

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [quantity, setQuantity] = useState("1");
  const [action, setAction] = useState("increase");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        api.get("/api/inventory"),
        api.get("/api/inventory/summary"),
        api.get("/api/inventory/low-stock"),
      ]);

      const [inventoryResult, summaryResult, lowStockResult] = results;

      if (inventoryResult.status !== "fulfilled") {
        throw inventoryResult.reason;
      }

      const inventoryData = inventoryResult.value.data;
      setInventory(
        Array.isArray(inventoryData)
          ? inventoryData
          : inventoryData?.inventory || []
      );

      if (summaryResult.status === "fulfilled") {
        setSummary(
          summaryResult.value.data?.inventory || EMPTY_SUMMARY
        );
      }

      if (lowStockResult.status === "fulfilled") {
        const data = lowStockResult.value.data;
        setLowStockProducts(
          Array.isArray(data) ? data : data?.products || []
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const categories = useMemo(
    () => [
      ...new Set(
        inventory
          .map((product) => product.category)
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b)),
    [inventory]
  );

  const filteredInventory = useMemo(() => {
    return inventory.filter((product) => {
      const query = search.trim().toLowerCase();

      const matchesSearch = [
        product.name,
        product.sku,
        product.category,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

      const matchesCategory =
        categoryFilter === "All" ||
        product.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" ||
        product.stockStatus === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventory, search, categoryFilter, statusFilter]);

  function openAdjustment(product, selectedAction) {
    setSelectedProduct(product);
    setAction(selectedAction);
    setQuantity("1");
    setError("");
    setNotice("");
  }

  function closeAdjustment() {
    if (adjusting) return;

    setSelectedProduct(null);
    setQuantity("1");
  }

  async function handleAdjustStock(event) {
    event.preventDefault();

    if (!selectedProduct) return;

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    if (
      action === "decrease" &&
      parsedQuantity > Number(selectedProduct.stock)
    ) {
      setError("Stock cannot become negative.");
      return;
    }

    setAdjusting(true);
    setError("");
    setNotice("");

    try {
      const productId = selectedProduct.productId;

      const response = await api.put(
        `/api/inventory/${productId}/stock`,
        {
          quantity: parsedQuantity,
          action,
        }
      );

      const updated = response.data?.inventory;

      setNotice(
        updated
          ? `${updated.name}: stock updated from ${updated.previousStock} to ${updated.currentStock}.`
          : "Stock adjusted successfully."
      );

      setSelectedProduct(null);
      setQuantity("1");

      await loadInventory();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAdjusting(false);
    }
  }

  return (
    <main className="inventory-page">
      <header className="inventory-header">
        <div>
          <div className="inventory-eyebrow">
            SELLER SHIELD / OPERATIONS
          </div>
          <h1>Inventory Management</h1>
          <p>
            Monitor stock levels, inventory value and products that need
            attention.
          </p>
        </div>

        <button
          type="button"
          className="inventory-btn inventory-btn-secondary"
          onClick={loadInventory}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? "inventory-spin" : ""}
          />
          Refresh
        </button>
      </header>

      {error && (
        <div className="inventory-alert inventory-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className="inventory-alert inventory-alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="inventory-stats">
        <article className="inventory-stat-card">
          <div className="inventory-stat-icon purple">
            <Package size={21} />
          </div>
          <div>
            <span>Total Products</span>
            <strong>{summary.totalProducts}</strong>
            <small>Products in your catalog</small>
          </div>
        </article>

        <article className="inventory-stat-card">
          <div className="inventory-stat-icon blue">
            <Boxes size={21} />
          </div>
          <div>
            <span>Total Units</span>
            <strong>{summary.totalUnits}</strong>
            <small>Units currently in stock</small>
          </div>
        </article>

        <article className="inventory-stat-card">
          <div className="inventory-stat-icon green">
            <CircleDollarSign size={21} />
          </div>
          <div>
            <span>Inventory Cost Value</span>
            <strong>{currency(summary.stockValue)}</strong>
            <small>Stock × cost price</small>
          </div>
        </article>

        <article className="inventory-stat-card">
          <div className="inventory-stat-icon orange">
            <AlertTriangle size={21} />
          </div>
          <div>
            <span>Low Stock</span>
            <strong>{summary.lowStockThreshold}</strong>
            <small>
              {summary.outOfStockProducts} out of stock
            </small>
          </div>
        </article>
      </section>

      <section className="inventory-panel">
        <div className="inventory-panel-heading">
          <div>
            <h2>Stock Alerts</h2>
            <p>Products at or below their configured stock threshold.</p>
          </div>
          <span className="inventory-alert-count">
            {lowStockProducts.length} alerts
          </span>
        </div>

        {loading ? (
          <div className="inventory-compact-state">
            <RefreshCw size={19} className="inventory-spin" />
            Loading stock alerts...
          </div>
        ) : lowStockProducts.length === 0 ? (
          <div className="inventory-compact-state inventory-good-state">
            <CheckCircle2 size={20} />
            All products are above their low-stock threshold.
          </div>
        ) : (
          <div className="inventory-alert-list">
            {lowStockProducts.map((product) => (
              <div
                className="inventory-alert-item"
                key={product.productId}
              >
                <div className="inventory-alert-product">
                  <div className="inventory-alert-product-icon">
                    <Package size={18} />
                  </div>
                  <div>
                    <strong>{product.name}</strong>
                    <span>
                      {product.sku} · {product.category}
                    </span>
                  </div>
                </div>

                <div className="inventory-alert-stock">
                  <strong>{product.stock} units</strong>
                  <span>
                    Threshold: {product.lowStockThreshold}
                  </span>
                </div>

                <span
                  className={`inventory-status status-${statusClass(
                    product.status
                  )}`}
                >
                  {product.status}
                </span>

                <button
                  type="button"
                  className="inventory-btn inventory-btn-small"
                  onClick={() => {
                    const fullProduct = inventory.find(
                      (item) => item.productId === product.productId
                    );

                    if (fullProduct) openAdjustment(fullProduct, "increase");
                  }}
                  disabled={
                    !inventory.some(
                      (item) => item.productId === product.productId
                    )
                  }
                >
                  <Plus size={15} />
                  Add stock
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="inventory-panel">
        <div className="inventory-panel-heading inventory-list-heading">
          <div>
            <h2>Inventory Records</h2>
            <p>Search products and adjust available stock.</p>
          </div>

          <div className="inventory-filters">
            <label className="inventory-search">
              <Search size={17} />
              <input
                type="search"
                placeholder="Search name or SKU..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="All">All categories</option>
              {categories.map((category) => (
                <option value={category} key={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by stock status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All stock statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="inventory-state">
            <RefreshCw size={25} className="inventory-spin" />
            <p>Loading inventory...</p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="inventory-state">
            <div className="inventory-empty-icon">
              <Package size={27} />
            </div>
            <h3>No products found</h3>
            <p>
              {inventory.length === 0
                ? "Add products first to manage your inventory."
                : "Try changing your search or filters."}
            </p>
          </div>
        ) : (
          <div className="inventory-table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Threshold</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Stock Value</th>
                  <th>Status</th>
                  <th>Adjust Stock</th>
                </tr>
              </thead>

              <tbody>
                {filteredInventory.map((product) => (
                  <tr key={product.productId}>
                    <td>
                      <div className="inventory-product-cell">
                        <div className="inventory-product-icon">
                          <Package size={18} />
                        </div>
                        <div>
                          <strong>{product.name}</strong>
                          <span>{product.sku}</span>
                        </div>
                      </div>
                    </td>

                    <td>{product.category}</td>

                    <td>
                      <strong
                        className={
                          product.stock === 0
                            ? "inventory-stock-zero"
                            : "inventory-stock-number"
                        }
                      >
                        {product.stock}
                      </strong>
                    </td>

                    <td>{product.lowStockThreshold}</td>
                    <td>{currency(product.costPrice)}</td>
                    <td>{currency(product.sellingPrice)}</td>
                    <td className="inventory-value">
                      {currency(product.stockValue)}
                    </td>

                    <td>
                      <span
                        className={`inventory-status status-${statusClass(
                          product.stockStatus
                        )}`}
                      >
                        {product.stockStatus}
                      </span>
                    </td>

                    <td>
                      <div className="inventory-adjust-actions">
                        <button
                          type="button"
                          className="inventory-adjust-btn increase"
                          title="Increase stock"
                          aria-label={`Increase stock for ${product.name}`}
                          onClick={() =>
                            openAdjustment(product, "increase")
                          }
                        >
                          <Plus size={16} />
                        </button>

                        <button
                          type="button"
                          className="inventory-adjust-btn decrease"
                          title="Decrease stock"
                          aria-label={`Decrease stock for ${product.name}`}
                          onClick={() =>
                            openAdjustment(product, "decrease")
                          }
                          disabled={product.stock === 0}
                        >
                          <Minus size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="inventory-table-footer">
          Showing {filteredInventory.length} of {inventory.length} products
        </footer>
      </section>

      {selectedProduct && (
        <div
          className="inventory-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAdjustment();
          }}
        >
          <section
            className="inventory-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-modal-title"
          >
            <div className="inventory-modal-header">
              <div>
                <h2 id="inventory-modal-title">
                  Adjust Stock
                </h2>
                <p>
                  {selectedProduct.name} · {selectedProduct.sku}
                </p>
              </div>

              <button
                type="button"
                className="inventory-icon-btn"
                onClick={closeAdjustment}
                aria-label="Close modal"
                disabled={adjusting}
              >
                <X size={19} />
              </button>
            </div>

            <div className="inventory-current-stock">
              <span>Current stock</span>
              <strong>{selectedProduct.stock} units</strong>
            </div>

            <form onSubmit={handleAdjustStock}>
              <fieldset className="inventory-action-choice">
                <legend>Adjustment type</legend>

                <label
                  className={
                    action === "increase" ? "selected" : ""
                  }
                >
                  <input
                    type="radio"
                    name="action"
                    value="increase"
                    checked={action === "increase"}
                    onChange={() => setAction("increase")}
                  />
                  <ArrowDownToLine size={18} />
                  <span>Add stock</span>
                </label>

                <label
                  className={
                    action === "decrease" ? "selected" : ""
                  }
                >
                  <input
                    type="radio"
                    name="action"
                    value="decrease"
                    checked={action === "decrease"}
                    onChange={() => setAction("decrease")}
                  />
                  <ArrowUpFromLine size={18} />
                  <span>Remove stock</span>
                </label>
              </fieldset>

              <label className="inventory-modal-field">
                <span>Quantity</span>
                <input
                  type="number"
                  min="1"
                  max={
                    action === "decrease"
                      ? selectedProduct.stock
                      : undefined
                  }
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  required
                />
              </label>

              <div className="inventory-preview">
                <span>Expected stock after adjustment</span>
                <strong>
                  {Math.max(
                    0,
                    Number(selectedProduct.stock) +
                      (action === "increase" ? 1 : -1) *
                        (Number(quantity) || 0)
                  )}{" "}
                  units
                </strong>
              </div>

              <div className="inventory-modal-actions">
                <button
                  type="button"
                  className="inventory-btn inventory-btn-secondary"
                  onClick={closeAdjustment}
                  disabled={adjusting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inventory-btn inventory-btn-primary"
                  disabled={
                    adjusting ||
                    !Number.isInteger(Number(quantity)) ||
                    Number(quantity) <= 0 ||
                    (action === "decrease" &&
                      Number(quantity) > Number(selectedProduct.stock))
                  }
                >
                  {adjusting ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="inventory-spin"
                      />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Confirm Adjustment
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
