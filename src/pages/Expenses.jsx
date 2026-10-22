
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Receipt,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Wallet,
  CalendarDays,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import api from "../services/api";
import "../css/Expenses.css";

const EXPENSE_TYPES = [
  "Platform Fee",
  "Shipping",
  "Advertising",
  "Packaging",
  "Miscellaneous",
];

const emptyForm = {
  type: "Platform Fee",
  amount: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
};

function currency(value) {
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

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.err ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function getCurrentMonthTotal(expenses) {
  const now = new Date();

  return expenses
    .filter((expense) => {
      const date = new Date(expense.date);

      return (
        !Number.isNaN(date.getTime()) &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [periodFilter, setPeriodFilter] = useState("All");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/expenses");
      const data = response.data;

      setExpenses(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.expenses)
            ? data.expenses
            : []
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const totalExpense = useMemo(
    () =>
      expenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
      ),
    [expenses]
  );

  const monthlyExpense = useMemo(
    () => getCurrentMonthTotal(expenses),
    [expenses]
  );

  const categoryTotals = useMemo(() => {
    return EXPENSE_TYPES.map((type) => ({
      type,
      total: expenses
        .filter((expense) => expense.type === type)
        .reduce(
          (sum, expense) => sum + Number(expense.amount || 0),
          0
        ),
      count: expenses.filter((expense) => expense.type === type).length,
    })).sort((a, b) => b.total - a.total);
  }, [expenses]);

  const highestCategory = categoryTotals.reduce(
    (highest, item) => (item.total > highest.total ? item : highest),
    { type: "None", total: 0 }
  );

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const query = search.trim().toLowerCase();

      const matchesSearch = [
        expense.type,
        expense.description,
        expense.amount,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

      const matchesType =
        typeFilter === "All" || expense.type === typeFilter;

      const date = new Date(expense.date);
      const now = new Date();

      let matchesPeriod = true;

      if (periodFilter === "This month") {
        matchesPeriod =
          !Number.isNaN(date.getTime()) &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear();
      } else if (periodFilter === "This year") {
        matchesPeriod =
          !Number.isNaN(date.getTime()) &&
          date.getFullYear() === now.getFullYear();
      }

      return matchesSearch && matchesType && matchesPeriod;
    });
  }, [expenses, search, typeFilter, periodFilter]);

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function openEditForm(expense) {
    setEditingId(expense._id);

    setForm({
      type: expense.type || "Platform Fee",
      amount: String(expense.amount ?? ""),
      description: expense.description || "",
      date: expense.date
        ? new Date(expense.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    });

    setError("");
    setNotice("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      setError("Enter a valid expense amount of zero or more.");
      return;
    }

    if (!form.date) {
      setError("Please select an expense date.");
      return;
    }

    const payload = {
      type: form.type,
      amount,
      description: form.description.trim(),
      date: form.date,
    };

    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/api/expenses/${editingId}`, payload);
        setNotice("Expense updated successfully.");
      } else {
        await api.post("/api/expenses", payload);
        setNotice("Expense added successfully.");
      }

      closeForm();
      await loadExpenses();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expense) {
    const confirmed = window.confirm(
      `Delete this ${expense.type} expense of ${currency(expense.amount)}?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");
    setDeletingId(expense._id);

    try {
      await api.delete(`/api/expenses/${expense._id}`);
      setNotice("Expense deleted successfully.");
      await loadExpenses();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="expenses-page">
      <header className="expenses-header">
        <div>
          <div className="expenses-eyebrow">SELLER SHIELD / FINANCE</div>
          <h1>Expense Management</h1>
          <p>Track your business costs and understand where your money goes.</p>
        </div>

        <div className="expenses-header-actions">
          <button
            type="button"
            className="expenses-btn expenses-btn-secondary"
            onClick={loadExpenses}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "expenses-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            className="expenses-btn expenses-btn-primary"
            onClick={openCreateForm}
          >
            <Plus size={17} />
            Add Expense
          </button>
        </div>
      </header>

      {error && (
        <div className="expenses-alert expenses-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className="expenses-alert expenses-alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="expenses-stats">
        <article className="expenses-stat-card">
          <div className="expenses-stat-icon purple">
            <Wallet size={21} />
          </div>
          <div>
            <span>Total Expenses</span>
            <strong>{currency(totalExpense)}</strong>
            <small>All recorded expense entries</small>
          </div>
        </article>

        <article className="expenses-stat-card">
          <div className="expenses-stat-icon blue">
            <CalendarDays size={21} />
          </div>
          <div>
            <span>This Month</span>
            <strong>{currency(monthlyExpense)}</strong>
            <small>Based on expense date</small>
          </div>
        </article>

        <article className="expenses-stat-card">
          <div className="expenses-stat-icon orange">
            <Receipt size={21} />
          </div>
          <div>
            <span>Expense Records</span>
            <strong>{expenses.length}</strong>
            <small>All saved transactions</small>
          </div>
        </article>

        <article className="expenses-stat-card">
          <div className="expenses-stat-icon green">
            <TrendingDown size={21} />
          </div>
          <div>
            <span>Highest Category</span>
            <strong className="expenses-category-value">
              {highestCategory.type}
            </strong>
            <small>{currency(highestCategory.total)} recorded</small>
          </div>
        </article>
      </section>

      {showForm && (
        <section className="expenses-panel expenses-form-panel">
          <div className="expenses-panel-heading">
            <div>
              <h2>{editingId ? "Edit Expense" : "Add New Expense"}</h2>
              <p>
                {editingId
                  ? "Update the details of this expense."
                  : "Enter the expense details below."}
              </p>
            </div>

            <button
              type="button"
              className="expenses-icon-btn"
              onClick={closeForm}
              aria-label="Close expense form"
            >
              <X size={19} />
            </button>
          </div>

          <form className="expenses-form" onSubmit={handleSubmit}>
            <div className="expenses-form-grid">
              <label className="expenses-field">
                <span>Expense Category <b>*</b></span>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                >
                  {EXPENSE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="expenses-field">
                <span>Amount (₹) <b>*</b></span>
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 250"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="expenses-field">
                <span>Expense Date <b>*</b></span>
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="expenses-field">
                <span>Description</span>
                <input
                  name="description"
                  type="text"
                  maxLength="500"
                  placeholder="e.g. Marketplace shipping charge"
                  value={form.description}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div className="expenses-form-actions">
              <button
                type="button"
                className="expenses-btn expenses-btn-secondary"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="expenses-btn expenses-btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Save Expense"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="expenses-panel">
        <div className="expenses-panel-heading expenses-list-heading">
          <div>
            <h2>Expense Records</h2>
            <p>View and manage your recorded business expenses.</p>
          </div>

          <div className="expenses-filters">
            <label className="expenses-search">
              <Search size={17} />
              <input
                type="search"
                placeholder="Search expenses..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <select
              aria-label="Filter by expense category"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="All">All categories</option>
              {EXPENSE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by date period"
              value={periodFilter}
              onChange={(event) => setPeriodFilter(event.target.value)}
            >
              <option value="All">All time</option>
              <option value="This month">This month</option>
              <option value="This year">This year</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="expenses-state">
            <RefreshCw size={25} className="expenses-spin" />
            <p>Loading expenses...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="expenses-state">
            <div className="expenses-empty-icon">
              <Receipt size={28} />
            </div>
            <h3>No expenses found</h3>
            <p>
              {expenses.length === 0
                ? "Add your first expense to start tracking business costs."
                : "Try changing your search or filters."}
            </p>
            {expenses.length === 0 && (
              <button
                type="button"
                className="expenses-btn expenses-btn-primary"
                onClick={openCreateForm}
              >
                <Plus size={17} />
                Add First Expense
              </button>
            )}
          </div>
        ) : (
          <div className="expenses-table-wrapper">
            <table className="expenses-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense._id}>
                    <td>
                      <span className="expenses-category-pill">
                        {expense.type}
                      </span>
                    </td>
                    <td className="expenses-description">
                      {expense.description?.trim() || "No description"}
                    </td>
                    <td>{formatDate(expense.date)}</td>
                    <td className="expenses-amount">
                      {currency(expense.amount)}
                    </td>
                    <td>
                      <div className="expenses-row-actions">
                        <button
                          type="button"
                          className="expenses-icon-btn edit"
                          title="Edit expense"
                          aria-label="Edit expense"
                          onClick={() => openEditForm(expense)}
                          disabled={Boolean(deletingId)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="expenses-icon-btn delete"
                          title="Delete expense"
                          aria-label="Delete expense"
                          onClick={() => handleDelete(expense)}
                          disabled={Boolean(deletingId)}
                        >
                          {deletingId === expense._id ? (
                            <RefreshCw
                              size={16}
                              className="expenses-spin"
                            />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="expenses-table-footer">
          <span>
            Showing {filteredExpenses.length} of {expenses.length} records
          </span>
          <strong>
            Filtered total:{" "}
            {currency(
              filteredExpenses.reduce(
                (sum, expense) => sum + Number(expense.amount || 0),
                0
              )
            )}
          </strong>
        </footer>
      </section>

      <section className="expenses-panel expenses-breakdown-panel">
        <div className="expenses-panel-heading">
          <div>
            <h2>Category Breakdown</h2>
            <p>See how your recorded expenses are distributed.</p>
          </div>
        </div>

        <div className="expenses-breakdown">
          {categoryTotals.map((item) => {
            const percentage =
              totalExpense > 0 ? (item.total / totalExpense) * 100 : 0;

            return (
              <div className="expenses-breakdown-row" key={item.type}>
                <div className="expenses-breakdown-top">
                  <div>
                    <strong>{item.type}</strong>
                    <span>
                      {item.count} {item.count === 1 ? "record" : "records"}
                    </span>
                  </div>
                  <strong>{currency(item.total)}</strong>
                </div>

                <div
                  className="expenses-progress-track"
                  role="progressbar"
                  aria-label={`${item.type} share of total expenses`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Number(percentage.toFixed(1))}
                >
                  <div
                    className="expenses-progress-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <small>{percentage.toFixed(1)}% of recorded expenses</small>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
