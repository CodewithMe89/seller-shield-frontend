
import { useCallback, useEffect, useState } from "react";
import {
  RotateCcw,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import api from "../services/api";
import "../css/Return.css";

const REASONS = [
  "Wrong Product",
  "Damaged Product",
  "Defective Product",
  "Size Issue",
  "Quality Issue",
  "Other",
];

const STATUSES = [
  "Requested",
  "Approved",
  "Pending",
  "Rejected",
  "Completed",
];

const initialForm = {
  order: "",
  product: "",
  quantity: "1",
  reason: "Wrong Product",
  returnStatus: "Requested",
  returnCost: "0",
  returnDate: new Date().toISOString().slice(0, 10),
};

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getId(value) {
  if (!value) return "";
  return typeof value === "object" ? value._id || value.id || "" : value;
}

function getOrderNumber(item) {
  const order = item.order;

  if (order && typeof order === "object") {
    return order.orderNumber || getId(order) || "Unknown order";
  }

  return order || "Unknown order";
}

function getProductName(item) {
  const product = item.product;

  if (product && typeof product === "object") {
    return product.name || product.sku || getId(product) || "Unknown product";
  }

  return product || "Unknown product";
}

function getStatusClass(status) {
  return String(status || "Pending").toLowerCase();
}

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(initialForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        api.get("/api/returns"),
        api.get("/api/orders"),
        api.get("/api/products"),
        api.get("/api/profit/returns"),
      ]);

      const [returnsResult, ordersResult, productsResult, analyticsResult] =
        results;

      if (returnsResult.status !== "fulfilled") {
        throw returnsResult.reason;
      }

      const returnsData = returnsResult.value.data;
      const ordersData =
        ordersResult.status === "fulfilled"
          ? ordersResult.value.data
          : [];
      const productsData =
        productsResult.status === "fulfilled"
          ? productsResult.value.data
          : [];
      const analyticsData =
        analyticsResult.status === "fulfilled"
          ? analyticsResult.value.data
          : null;

      setReturns(
        Array.isArray(returnsData)
          ? returnsData
          : returnsData?.returns || []
      );

      setOrders(
        Array.isArray(ordersData)
          ? ordersData
          : ordersData?.orders || []
      );

      setProducts(
        Array.isArray(productsData)
          ? productsData
          : productsData?.products || []
      );

      setAnalytics(
        analyticsData?.returns || analyticsData || null
      );

      if (
        ordersResult.status === "rejected" ||
        productsResult.status === "rejected"
      ) {
        setNotice(
          "Returns loaded, but orders or products could not be loaded. Check your API responses."
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const eligibleOrders = orders.filter((order) =>
    ["Delivered", "Returned"].includes(order.orderStatus)
  );

  const selectedOrder = eligibleOrders.find(
    (order) => getId(order) === form.order
  );

  const selectedProductId = selectedOrder
    ? getId(selectedOrder.productId)
    : "";

  const selectedProduct = products.find(
    (product) => getId(product) === selectedProductId
  );

  const orderReturns = returns.filter(
    (item) => getId(item.order) === form.order
  );

  const alreadyReturnedQuantity = orderReturns
    .filter((item) => item.returnStatus !== "Rejected")
    .reduce((total, item) => total + Number(item.quantity || 0), 0);

  const remainingReturnQuantity = selectedOrder
    ? Math.max(0, Number(selectedOrder.quantity) - alreadyReturnedQuantity)
    : 0;

  const completedCount = returns.filter(
    (item) => item.returnStatus === "Completed"
  ).length;

  const pendingCount = returns.filter((item) =>
    ["Requested", "Pending", "Approved"].includes(item.returnStatus)
  ).length;

  const filteredReturns = returns.filter((item) => {
    const searchableText = [
      getOrderNumber(item),
      getProductName(item),
      item.reason,
      item.returnStatus,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(
      searchTerm.trim().toLowerCase()
    );

    const matchesStatus =
      statusFilter === "All" || item.returnStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setNotice("");
  }

  function handleOrderChange(event) {
    const orderId = event.target.value;
    const order = eligibleOrders.find(
      (item) => getId(item) === orderId
    );

    setForm((previous) => ({
      ...previous,
      order: orderId,
      product: order ? getId(order.productId) : "",
      quantity: "1",
    }));

    setError("");
  }

  async function handleCreateReturn(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.order || !selectedOrder) {
      setError("Please select an eligible delivered order.");
      return;
    }

    if (!selectedProductId) {
      setError("The selected order has no valid product.");
      return;
    }

    const quantity = Number(form.quantity);
    const returnCost = Number(form.returnCost);

    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    if (quantity > remainingReturnQuantity) {
      setError(
        `You can return at most ${remainingReturnQuantity} more unit(s) for this order.`
      );
      return;
    }

    if (!Number.isFinite(returnCost) || returnCost < 0) {
      setError("Return cost cannot be negative.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        order: form.order,
        product: selectedProductId,
        quantity,
        reason: form.reason,
        returnStatus: form.returnStatus,
        returnCost,
        returnDate: form.returnDate,
      };

      await api.post("/api/returns", payload);

      setForm(initialForm);
      setShowForm(false);
      setNotice("Return created successfully.");

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(returnId, newStatus) {
    const currentReturn = returns.find(
      (item) => getId(item) === returnId
    );

    if (!currentReturn || currentReturn.returnStatus === newStatus) {
      return;
    }

    if (
      currentReturn.stockRestored &&
      newStatus !== "Completed"
    ) {
      setError(
        "This return has already restored stock. Its status cannot be changed."
      );
      return;
    }

    setUpdatingId(returnId);
    setError("");
    setNotice("");

    try {
      await api.put(`/api/returns/${returnId}`, {
        returnStatus: newStatus,
      });

      setNotice(
        newStatus === "Completed"
          ? "Return completed. The backend handles stock restoration."
          : "Return status updated."
      );

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId("");
    }
  }

  async function handleDeleteReturn(item) {
    const returnId = getId(item);

    if (item.stockRestored) {
      setError(
        "This return has restored stock and cannot be deleted."
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete the return for order ${getOrderNumber(item)}?`
    );

    if (!confirmed) return;

    setDeletingId(returnId);
    setError("");
    setNotice("");

    try {
      await api.delete(`/api/returns/${returnId}`);
      setNotice("Return deleted successfully.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="returns-page">
      <header className="returns-header">
        <div>
          <div className="returns-eyebrow">
            SELLER SHIELD / OPERATIONS
          </div>

          <h1>Returns Management</h1>

          <p>
            Manage returned orders, track return costs and monitor
            return performance.
          </p>
        </div>

        <div className="returns-header-actions">
          <button
            type="button"
            className="returns-btn returns-btn-secondary"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? "spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            className="returns-btn returns-btn-primary"
            onClick={() => {
              setShowForm((previous) => !previous);
              setError("");
              setNotice("");
            }}
          >
            {showForm ? <X size={17} /> : <Plus size={17} />}
            {showForm ? "Close Form" : "Create Return"}
          </button>
        </div>
      </header>

      {error && (
        <div className="returns-alert returns-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className="returns-alert returns-alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="returns-stats">
        <article className="returns-stat-card">
          <div className="returns-stat-icon purple">
            <Package size={21} />
          </div>
          <div>
            <span>Total Returns</span>
            <strong>{returns.length}</strong>
            <small>All recorded returns</small>
          </div>
        </article>

        <article className="returns-stat-card">
          <div className="returns-stat-icon green">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Completed</span>
            <strong>{completedCount}</strong>
            <small>Completed return records</small>
          </div>
        </article>

        <article className="returns-stat-card">
          <div className="returns-stat-icon orange">
            <Clock size={21} />
          </div>
          <div>
            <span>Awaiting Resolution</span>
            <strong>{pendingCount}</strong>
            <small>Requested, pending or approved</small>
          </div>
        </article>

        <article className="returns-stat-card">
          <div className="returns-stat-icon blue">
            <RotateCcw size={21} />
          </div>
          <div>
            <span>Return Rate</span>
            <strong>
              {Number(analytics?.returnRate || 0).toFixed(2)}%
            </strong>
            <small>
              {Number(analytics?.returnedQuantity || 0)} units returned
            </small>
          </div>
        </article>
      </section>

      {showForm && (
        <section className="returns-panel returns-form-panel">
          <div className="returns-panel-heading">
            <div>
              <h2>Create a Return</h2>
              <p>
                Select a delivered order and enter the return details.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateReturn}>
            <div className="returns-form-grid">
              <label className="returns-field">
                <span>Order <b>*</b></span>
                <select
                  name="order"
                  value={form.order}
                  onChange={handleOrderChange}
                  required
                >
                  <option value="">Select an order</option>
                  {eligibleOrders.map((order) => (
                    <option
                      key={getId(order)}
                      value={getId(order)}
                    >
                      {order.orderNumber || getId(order)} —{" "}
                      {order.orderStatus} — Qty {order.quantity}
                    </option>
                  ))}
                </select>
                {eligibleOrders.length === 0 && (
                  <small>
                    No eligible orders found. An order must be Delivered
                    or Returned.
                  </small>
                )}
              </label>

              <label className="returns-field">
                <span>Product</span>
                <input
                  value={
                    selectedProduct?.name ||
                    selectedProduct?.sku ||
                    selectedProductId
                      ? selectedProduct?.name ||
                        selectedProduct?.sku ||
                        selectedProductId
                      : ""
                  }
                  placeholder="Choose an order first"
                  readOnly
                />
              </label>

              <label className="returns-field">
                <span>Return Quantity <b>*</b></span>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  max={Math.max(1, remainingReturnQuantity)}
                  step="1"
                  value={form.quantity}
                  onChange={handleFormChange}
                  disabled={!selectedOrder || remainingReturnQuantity === 0}
                  required
                />
                <small>
                  {selectedOrder
                    ? `${remainingReturnQuantity} unit(s) remaining for return`
                    : "Select an order to see available quantity"}
                </small>
              </label>

              <label className="returns-field">
                <span>Return Reason <b>*</b></span>
                <select
                  name="reason"
                  value={form.reason}
                  onChange={handleFormChange}
                  required
                >
                  {REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </label>

              <label className="returns-field">
                <span>Initial Status <b>*</b></span>
                <select
                  name="returnStatus"
                  value={form.returnStatus}
                  onChange={handleFormChange}
                  required
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <small>
                  Choosing Completed may restore stock immediately.
                </small>
              </label>

              <label className="returns-field">
                <span>Return Cost (₹) <b>*</b></span>
                <input
                  name="returnCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.returnCost}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <label className="returns-field">
                <span>Return Date <b>*</b></span>
                <input
                  name="returnDate"
                  type="date"
                  value={form.returnDate}
                  onChange={handleFormChange}
                  required
                />
              </label>
            </div>

            {selectedOrder && remainingReturnQuantity === 0 && (
              <div className="returns-inline-warning">
                All units in this order have already been recorded as
                returned or are otherwise allocated to existing returns.
              </div>
            )}

            <div className="returns-form-actions">
              <button
                type="button"
                className="returns-btn returns-btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setForm(initialForm);
                  setError("");
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="returns-btn returns-btn-primary"
                disabled={
                  submitting ||
                  !selectedOrder ||
                  remainingReturnQuantity === 0
                }
              >
                {submitting ? "Creating..." : "Create Return"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="returns-panel">
        <div className="returns-panel-heading returns-table-heading">
          <div>
            <h2>Return Records</h2>
            <p>Review return requests and manage their status.</p>
          </div>

          <div className="returns-filters">
            <label className="returns-search">
              <Search size={17} />
              <input
                type="search"
                placeholder="Search returns..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <select
              aria-label="Filter by return status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="returns-state">
            <RefreshCw size={25} className="spin" />
            <p>Loading return records...</p>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="returns-state">
            <div className="returns-empty-icon">
              <RotateCcw size={27} />
            </div>
            <h3>No returns found</h3>
            <p>
              {returns.length === 0
                ? "Create a return to start tracking returned orders."
                : "Try changing your search or status filter."}
            </p>
            {returns.length === 0 && (
              <button
                type="button"
                className="returns-btn returns-btn-primary"
                onClick={() => setShowForm(true)}
              >
                <Plus size={17} />
                Create First Return
              </button>
            )}
          </div>
        ) : (
          <div className="returns-table-wrapper">
            <table className="returns-table">
              <thead>
                <tr>
                  <th>Order / Product</th>
                  <th>Return Date</th>
                  <th>Qty</th>
                  <th>Reason</th>
                  <th>Return Cost</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredReturns.map((item) => {
                  const returnId = getId(item);
                  const isBusy =
                    updatingId === returnId || deletingId === returnId;

                  return (
                    <tr key={returnId}>
                      <td>
                        <div className="returns-order-cell">
                          <strong>{getOrderNumber(item)}</strong>
                          <span>{getProductName(item)}</span>
                        </div>
                      </td>

                      <td>{formatDate(item.returnDate)}</td>
                      <td>
                        <span className="returns-quantity">
                          {item.quantity}
                        </span>
                      </td>
                      <td>{item.reason || "—"}</td>
                      <td className="returns-money">
                        {formatCurrency(item.returnCost)}
                      </td>

                      <td>
                        <select
                          aria-label={`Update status for ${getOrderNumber(item)}`}
                          className={`returns-status-select status-${getStatusClass(
                            item.returnStatus
                          )}`}
                          value={item.returnStatus}
                          disabled={
                            isBusy ||
                            (item.stockRestored &&
                              item.returnStatus === "Completed")
                          }
                          onChange={(event) =>
                            handleStatusChange(
                              returnId,
                              event.target.value
                            )
                          }
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        {item.stockRestored && (
                          <small className="returns-stock-note">
                            Stock restored
                          </small>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="returns-delete-btn"
                          title={
                            item.stockRestored
                              ? "Cannot delete a stock-restored return"
                              : "Delete return"
                          }
                          aria-label={`Delete return for ${getOrderNumber(item)}`}
                          disabled={isBusy || item.stockRestored}
                          onClick={() => handleDeleteReturn(item)}
                        >
                          {deletingId === returnId ? (
                            <RefreshCw size={16} className="spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <footer className="returns-table-footer">
          Showing {filteredReturns.length} of {returns.length} return records
        </footer>
      </section>

      <section className="returns-panel returns-insights">
        <div className="returns-panel-heading">
          <div>
            <h2>Return Insights</h2>
            <p>Summary from your backend return analytics.</p>
          </div>
        </div>

        <div className="returns-insights-grid">
          <div>
            <span>Total units sold</span>
            <strong>{Number(analytics?.soldQuantity || 0)}</strong>
          </div>
          <div>
            <span>Units returned</span>
            <strong>{Number(analytics?.returnedQuantity || 0)}</strong>
          </div>
          <div>
            <span>Completed return costs</span>
            <strong>
              {formatCurrency(analytics?.completedReturnCost)}
            </strong>
          </div>
        </div>

        {analytics?.reasonBreakdown &&
          Object.keys(analytics.reasonBreakdown).length > 0 && (
            <div className="returns-reasons">
              <h3>Return Reasons</h3>
              {Object.entries(analytics.reasonBreakdown).map(
                ([reason, quantity]) => (
                  <div className="returns-reason-row" key={reason}>
                    <span>{reason}</span>
                    <strong>{quantity}</strong>
                  </div>
                )
              )}
            </div>
          )}
      </section>
    </main>
  );
}
