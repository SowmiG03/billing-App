import { useState, useEffect } from "react";

const STORAGE_KEY = "billingRecords";

const initialItem = () => ({ id: Date.now(), name: "", qty: 1, price: "" });

function Badge({ method }) {
  const styles =
    method === "cash"
      ? { background: "#EAF3DE", color: "#27500A" }
      : { background: "#E6F1FB", color: "#0C447C" };
  return (
    <span
      style={{
        ...styles,
        fontSize: 11,
        padding: "2px 10px",
        borderRadius: 20,
        fontWeight: 500,
      }}
    >
      {method === "cash" ? "💵 Cash" : "📱 GPay"}
    </span>
  );
}

function MetricCard({ label, value }) {
  return (
    <div
      style={{
        background: "#f5f5f4",
        borderRadius: 8,
        padding: "12px 14px",
        flex: 1,
      }}
    >
      <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function Toast({ message, visible }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#27500A",
        color: "#EAF3DE",
        padding: "9px 20px",
        borderRadius: 8,
        fontSize: 13,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s",
        pointerEvents: "none",
        zIndex: 999,
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  );
}

export default function BillingTracker() {
  const [tab, setTab] = useState("new");
  const [records, setRecords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [items, setItems] = useState([initialItem()]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  function showToast(msg) {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: "" }), 2500);
  }

  function calcTotal() {
    return items.reduce((sum, item) => {
      const q = parseFloat(item.qty) || 0;
      const p = parseFloat(item.price) || 0;
      return sum + q * p;
    }, 0);
  }

  function updateItem(id, field, value) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, initialItem()]);
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function validate() {
    const errs = {};
    if (!customerName.trim()) errs.customerName = "Customer name is required";
    if (!phone.trim() || phone.length < 10) errs.phone = "Enter valid 10-digit phone";
    const hasItem = items.some(
      (it) => it.name.trim() && parseFloat(it.qty) > 0 && parseFloat(it.price) > 0
    );
    if (!hasItem) errs.items = "Add at least one valid item";
    return errs;
  }

  function saveBill() {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const validItems = items
      .filter((it) => it.name.trim() && parseFloat(it.qty) > 0 && parseFloat(it.price) > 0)
      .map((it) => ({
        name: it.name.trim(),
        qty: parseFloat(it.qty),
        price: parseFloat(parseFloat(it.price).toFixed(2)),
        subtotal: parseFloat((parseFloat(it.qty) * parseFloat(it.price)).toFixed(2)),
      }));

    const now = new Date();
    const record = {
      id: Date.now(),
      customerName: customerName.trim(),
      phone: phone.trim(),
      paymentMethod,
      items: validItems,
      total: parseFloat(calcTotal().toFixed(2)),
      timestamp: now.toISOString(),
      date: now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setRecords((prev) => [record, ...prev]);
    setCustomerName("");
    setPhone("");
    setPaymentMethod("cash");
    setItems([initialItem()]);
    setErrors({});
    showToast("Bill saved!");
  }

  function deleteRecord(id) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    showToast("Record deleted");
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "billing_records.json";
    a.click();
    showToast("JSON exported!");
  }

  const filtered = records.filter(
    (r) =>
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search)
  );

  const totalRevenue = records.reduce((s, r) => s + r.total, 0);
  const cashTotal = records.filter((r) => r.paymentMethod === "cash").reduce((s, r) => s + r.total, 0);
  const gpayTotal = records.filter((r) => r.paymentMethod === "gpay").reduce((s, r) => s + r.total, 0);

  const fmt = (n) =>
    "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    fontSize: 14,
    border: "0.5px solid #d1d1d1",
    borderRadius: 8,
    background: "#fff",
    color: "#1a1a1a",
    outline: "none",
    boxSizing: "border-box",
  };

  const errStyle = { fontSize: 12, color: "#a32d2d", marginTop: 3 };

  const cardStyle = {
    background: "#fff",
    border: "0.5px solid #e5e5e5",
    borderRadius: 12,
    padding: "1.25rem",
    marginBottom: "1rem",
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 640, margin: "0 auto", padding: "1.5rem 1rem", background: "#fafaf9", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
        🧾 Billing Tracker
      </h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f0efed", borderRadius: 8, padding: 4, marginBottom: "1.5rem" }}>
        {["new", "records"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "8px",
              border: tab === t ? "0.5px solid #e5e5e5" : "none",
              borderRadius: 6,
              background: tab === t ? "#fff" : "transparent",
              fontWeight: tab === t ? 500 : 400,
              fontSize: 14,
              cursor: "pointer",
              color: "#1a1a1a",
            }}
          >
            {t === "new" ? "New Bill" : "Records"}
          </button>
        ))}
      </div>

      {/* NEW BILL TAB */}
      {tab === "new" && (
        <>
          <div style={cardStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: "#666", display: "block", marginBottom: 4 }}>Customer name</label>
                <input
                  style={{ ...inputStyle, borderColor: errors.customerName ? "#a32d2d" : "#d1d1d1" }}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ravi Kumar"
                />
                {errors.customerName && <div style={errStyle}>{errors.customerName}</div>}
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#666", display: "block", marginBottom: 4 }}>Phone number</label>
                <input
                  style={{ ...inputStyle, borderColor: errors.phone ? "#a32d2d" : "#d1d1d1" }}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/, "").slice(0, 10))}
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                />
                {errors.phone && <div style={errStyle}>{errors.phone}</div>}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, color: "#666", display: "block", marginBottom: 6 }}>Payment method</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { key: "cash", label: "💵 Cash", active: "badge-cash" },
                  { key: "gpay", label: "📱 GPay", active: "badge-gpay" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setPaymentMethod(key)}
                    style={{
                      flex: 1,
                      padding: "9px",
                      border: "0.5px solid",
                      borderColor: paymentMethod === key ? (key === "cash" ? "#3B6D11" : "#185FA5") : "#d1d1d1",
                      borderRadius: 8,
                      background: paymentMethod === key ? (key === "cash" ? "#EAF3DE" : "#E6F1FB") : "#f5f5f4",
                      color: paymentMethod === key ? (key === "cash" ? "#27500A" : "#0C447C") : "#666",
                      fontWeight: paymentMethod === key ? 500 : 400,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Items */}
          <div style={cardStyle}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 10 }}>Items</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 90px 36px", gap: 8, marginBottom: 6 }}>
              {["Item name", "Qty", "Price (₹)", ""].map((h, i) => (
                <div key={i} style={{ fontSize: 12, color: "#888" }}>{h}</div>
              ))}
            </div>
            {items.map((item) => (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 70px 90px 36px", gap: 8, marginBottom: 8 }}>
                <input
                  style={inputStyle}
                  value={item.name}
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  placeholder="Item name"
                />
                <input
                  style={inputStyle}
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                />
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => updateItem(item.id, "price", e.target.value)}
                  placeholder="0.00"
                />
                <button
                  onClick={() => removeItem(item.id)}
                  style={{ border: "0.5px solid #d1d1d1", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 14, color: "#888" }}
                >
                  ✕
                </button>
              </div>
            ))}
            {errors.items && <div style={errStyle}>{errors.items}</div>}
            <button
              onClick={addItem}
              style={{ width: "100%", padding: "8px", border: "0.5px dashed #d1d1d1", borderRadius: 8, background: "transparent", fontSize: 13, color: "#888", cursor: "pointer", marginTop: 4 }}
            >
              + Add item
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "0.5px solid #e5e5e5", marginTop: 10 }}>
              <span style={{ fontSize: 14, color: "#666" }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 500 }}>{fmt(calcTotal())}</span>
            </div>
          </div>

          <button
            onClick={saveBill}
            style={{ width: "100%", padding: 12, border: "0.5px solid #1a1a1a", borderRadius: 8, background: "#fff", fontSize: 15, fontWeight: 500, cursor: "pointer" }}
          >
            💾 Save Bill
          </button>
        </>
      )}

      {/* RECORDS TAB */}
      {tab === "records" && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: "1rem" }}>
            <MetricCard label="Total revenue" value={fmt(totalRevenue)} />
            <MetricCard label="Cash" value={fmt(cashTotal)} />
            <MetricCard label="GPay" value={fmt(gpayTotal)} />
          </div>

          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>All records</span>
              <button
                onClick={exportJSON}
                style={{ border: "0.5px solid #d1d1d1", borderRadius: 8, background: "#fff", fontSize: 13, color: "#666", cursor: "pointer", padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}
              >
                ↓ Export JSON
              </button>
            </div>

            <input
              style={{ ...inputStyle, marginBottom: 12, paddingLeft: 32, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23888' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='8' stroke='%23888' stroke-width='2' fill='none'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65' stroke='%23888' stroke-width='2'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "10px center" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
            />

            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", color: "#888", fontSize: 14, padding: "2rem 0" }}>
                {records.length === 0 ? "No bills saved yet" : "No matching records"}
              </div>
            ) : (
              filtered.map((r) => (
                <div key={r.id} style={{ border: "0.5px solid #e5e5e5", borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{r.customerName}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>📞 {r.phone}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>{fmt(r.total)}</div>
                      <button
                        onClick={() => deleteRecord(r.id)}
                        style={{ border: "none", background: "none", color: "#888", cursor: "pointer", fontSize: 14 }}
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <Badge method={r.paymentMethod} />
                    <span style={{ fontSize: 12, color: "#888", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.items.map((it) => `${it.name} ×${it.qty}`).join(", ")}
                    </span>
                    <span style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap" }}>{r.date} {r.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}