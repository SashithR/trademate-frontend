import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";
const BOT_USERNAME = "trademate_fyp_bot";

function fmtNum(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function fmtMoney(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(2);
}

function LoadingDots() {
  return (
    <div className="loadingDots">
      <span /><span /><span />
    </div>
  );
}

function StockLevelBadge({ status }) {
  const s = String(status || "GREEN").toUpperCase();
  if (s === "RED") return <span className="badge badgeRed">● LOW</span>;
  if (s === "YELLOW") return <span className="badge badgeYellow">● MEDIUM</span>;
  return <span className="badge badgeGreen">● OK</span>;
}

/* Telegram-style paper plane SVG logo */
function TelegramLogoIcon({ size = 40, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <circle cx="20" cy="20" r="20" fill="url(#tg-grad)" />
      <defs>
        <linearGradient id="tg-grad" x1="20" y1="0" x2="20" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#54BEF0" />
          <stop offset="1" stopColor="#1A8FC9" />
        </linearGradient>
      </defs>
      {/* Paper plane */}
      <path
        d="M8.5 19.5L29 12L22 28L18.5 23.5L14 26V21.5L8.5 19.5Z"
        fill="white"
        opacity="0.95"
      />
      <path
        d="M14 21.5L18.5 23.5L17 28L22 28"
        fill="white"
        opacity="0.7"
      />
    </svg>
  );
}

/* Larger version for auth page */
function TelegramLogoLarge() {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ margin: "0 auto 14px", display: "block", filter: "drop-shadow(0 0 18px rgba(42,171,238,0.45))" }}
    >
      <circle cx="36" cy="36" r="36" fill="url(#tg-grad-lg)" />
      <defs>
        <linearGradient id="tg-grad-lg" x1="36" y1="0" x2="36" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#54BEF0" />
          <stop offset="1" stopColor="#1685BE" />
        </linearGradient>
      </defs>
      <path
        d="M15 35L52 22L40 50L33 42L25 47V38L15 35Z"
        fill="white"
        opacity="0.95"
      />
      <path
        d="M25 38L33 42L31 50"
        fill="white"
        opacity="0.7"
      />
    </svg>
  );
}

function PasswordField({ value, onChange, show, setShow, placeholder = "" }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        className="input"
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ paddingRight: "44px" }}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: "16px",
          color: "var(--text-muted)",
          lineHeight: 1,
          padding: 0,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.target.style.color = "var(--text-secondary)")}
        onMouseLeave={(e) => (e.target.style.color = "var(--text-muted)")}
      >
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}

function App() {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("tm_token") || "");
  const [me, setMe] = useState(() => {
    const raw = localStorage.getItem("tm_me");
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  });

  const isLoggedIn = Boolean(authToken && me);
  const [authMode, setAuthMode] = useState("signin");
  const [authError, setAuthError] = useState("");

  const [suUsername, setSuUsername] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suShopName, setSuShopName] = useState("");
  const [suShopType, setSuShopType] = useState("");

  const [siKey, setSiKey] = useState("");
  const [siPassword, setSiPassword] = useState("");

  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const authHeaders = useMemo(() => {
    if (!authToken) return {};
    return { Authorization: `Bearer ${authToken}` };
  }, [authToken]);

  async function loadMe(token) {
    const t = token || authToken;
    if (!t) return;
    const res = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    setMe(res.data);
    localStorage.setItem("tm_me", JSON.stringify(res.data));
  }

  async function signUp(e) {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await axios.post(`${API_BASE}/auth/signup`, {
        username: suUsername.trim(),
        email: suEmail.trim(),
        password: suPassword,
        shop_name: suShopName.trim(),
        shop_type: suShopType.trim(),
      });
      setAuthToken(res.data.token);
      localStorage.setItem("tm_token", res.data.token);
      setMe(res.data);
      localStorage.setItem("tm_me", JSON.stringify(res.data));
    } catch (err) {
      setAuthError(String(err?.response?.data?.detail || "Sign up failed."));
    }
  }

  async function signIn(e) {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        username_or_email: siKey.trim(),
        password: siPassword,
      });
      setAuthToken(res.data.token);
      localStorage.setItem("tm_token", res.data.token);
      setMe(res.data);
      localStorage.setItem("tm_me", JSON.stringify(res.data));
    } catch (err) {
      setAuthError(String(err?.response?.data?.detail || "Sign in failed."));
    }
  }

  function signOut() {
    setAuthToken("");
    setMe(null);
    localStorage.removeItem("tm_token");
    localStorage.removeItem("tm_me");
  }

  useEffect(() => {
    if (authToken && !me) {
      loadMe(authToken).catch(() => signOut());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const SHOP_ID = me?.shop_id || 1;

  const [activePage, setActivePage] = useState("inventory");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [newName, setNewName] = useState("");
  const [newSellPrice, setNewSellPrice] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [newStockQty, setNewStockQty] = useState("");
  const [newAlertQty, setNewAlertQty] = useState("");
  const [adding, setAdding] = useState(false);

  const UNIT_OPTIONS = ["g", "kg", "ml", "l", "Bottle", "Packet", "Piece", "Box"];
  const [selectedUnit, setSelectedUnit] = useState("");

  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deltaQty, setDeltaQty] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const [alertProduct, setAlertProduct] = useState(null);
  const [alertQtyInput, setAlertQtyInput] = useState("");
  const [savingAlert, setSavingAlert] = useState(false);

  const [reportPeriod, setReportPeriod] = useState("daily");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [report, setReport] = useState(null);

  async function loadProducts() {
    try {
      setProductsError("");
      setLoadingProducts(true);
      const res = await axios.get(`${API_BASE}/products`, { params: { shop_id: SHOP_ID } });
      setProducts(res.data || []);
    } catch (e) {
      setProductsError("Failed to load products. Is backend running?");
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadReport(period) {
    try {
      setReportError("");
      setReportLoading(true);
      setReportPeriod(period);
      const res = await axios.get(`${API_BASE}/reports/summary`, {
        params: { shop_id: SHOP_ID, period },
      });
      setReport(res.data);
    } catch (e) {
      setReportError("Failed to load report.");
    } finally {
      setReportLoading(false);
    }
  }

  async function refreshPage() {
    await loadProducts();
    await loadReport(reportPeriod);
  }

  async function downloadPdf(period) {
    try {
      const res = await axios.get(`${API_BASE}/reports/pdf`, {
        params: { shop_id: SHOP_ID, period },
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trade_mate_report_${SHOP_ID}_${period}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("PDF download failed. Check backend and try again.");
    }
  }

  useEffect(() => {
    if (!isLoggedIn) return;
    loadProducts();
    loadReport("daily");
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const productsWithProfit = useMemo(() => {
    return (products || []).map((p) => {
      const sell = Number(p.sell_price);
      const cost = Number(p.cost_price);
      const profit = Number.isFinite(sell) && Number.isFinite(cost) ? sell - cost : null;
      return { ...p, profit_per_unit: profit };
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return productsWithProfit;
    return productsWithProfit.filter((p) => String(p.name || "").toLowerCase().includes(q));
  }, [productsWithProfit, productSearch]);

  async function submitNewProduct(e) {
    e.preventDefault();
    const sell = Number(newSellPrice);
    const cost = Number(newCostPrice);
    const qty = Number(newStockQty);
    const alertQty = Number(newAlertQty);

    if (!newName.trim()) { alert("Product name is required."); return; }
    if (!selectedUnit) { alert("Please select a unit."); return; }
    if (!Number.isFinite(sell) || sell < 0) { alert("Enter a valid sell price (0 or more)."); return; }
    if (!Number.isFinite(cost) || cost < 0) { alert("Enter a valid cost price (0 or more)."); return; }
    if (!Number.isFinite(qty) || qty < 0) { alert("Enter a valid stock quantity (0 or more)."); return; }
    if (!Number.isFinite(alertQty) || alertQty < 0) { alert("Enter a valid low stock alert quantity (0 or more)."); return; }

    try {
      setAdding(true);
      const productRes = await axios.post(`${API_BASE}/products`, {
        shop_id: SHOP_ID,
        name: newName.trim(),
        unit: selectedUnit,
        sell_price: sell,
        cost_price: cost,
        stock_qty: 0,
        alert_qty: alertQty,
      });
      const productId = productRes.data?.id;
      if (!productId) { alert("Product created but product id is missing."); return; }
      if (qty > 0) {
        await axios.post(`${API_BASE}/purchases`, {
          shop_id: SHOP_ID,
          items: [{ product_id: productId, qty, unit_price: cost, sell_price: sell, alert_qty: alertQty }],
        });
      }
      setNewName(""); setSelectedUnit(""); setNewSellPrice("");
      setNewCostPrice(""); setNewStockQty(""); setNewAlertQty("");
      await loadProducts();
      await loadReport(reportPeriod);
      alert("Product added and purchase recorded ✅");
    } catch (e2) {
      const msg = e2?.response?.data?.detail || e2?.response?.data || "Failed to add product.";
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setAdding(false);
    }
  }

  function openAdjust(product, sign) {
    setSelectedProduct(product);
    setDeltaQty(sign === "add" ? "1" : "-1");
    setReason(sign === "add" ? "New stock" : "Removed stock");
  }

  function closeAdjust() { setSelectedProduct(null); setDeltaQty(""); setReason(""); }

  async function submitAdjust() {
    if (!selectedProduct) return;
    const n = Number(deltaQty);
    if (!Number.isFinite(n) || n === 0) { alert("Enter a valid quantity (example: 1 or -1)."); return; }
    try {
      setSaving(true);
      if (n > 0) {
        await axios.post(`${API_BASE}/purchases`, {
          shop_id: SHOP_ID,
          items: [{
            product_id: selectedProduct.id,
            qty: n,
            unit_price: Number(selectedProduct.cost_price),
            sell_price: Number(selectedProduct.sell_price),
            alert_qty: Number(selectedProduct.alert_qty || 0),
          }],
        });
      } else {
        await axios.post(`${API_BASE}/stock/adjust`, {
          shop_id: SHOP_ID,
          product_id: selectedProduct.id,
          delta_qty: n,
          reason: reason || null,
        });
      }
      await loadProducts();
      await loadReport(reportPeriod);
      closeAdjust();
    } catch (e) {
      alert(e?.response?.data?.detail || "Stock update failed.");
    } finally {
      setSaving(false);
    }
  }

  function openAlertModal(product) {
    setAlertProduct(product);
    setAlertQtyInput(String(product.alert_qty ?? 0));
  }

  function closeAlertModal() { setAlertProduct(null); setAlertQtyInput(""); }

  async function submitAlertQty() {
    if (!alertProduct) return;
    const n = Number(alertQtyInput);
    if (!Number.isFinite(n) || n < 0) { alert("Enter a valid alert quantity (0 or more)."); return; }
    try {
      setSavingAlert(true);
      await axios.put(`${API_BASE}/products/${alertProduct.id}/alert`, { shop_id: SHOP_ID, alert_qty: n });
      await loadProducts();
      closeAlertModal();
    } catch (e) {
      alert(e?.response?.data?.detail || "Updating alert quantity failed.");
    } finally {
      setSavingAlert(false);
    }
  }

  async function deleteProduct(p) {
    const ok = window.confirm("Delete this product from your shop?");
    if (!ok) return;
    try {
      await axios.delete(`${API_BASE}/products/${p.id}`, { params: { shop_id: SHOP_ID } });
      await loadProducts();
      alert("Product deleted ✅");
    } catch (e) {
      alert(e?.response?.data?.detail || "Delete failed.");
    }
  }

  async function openTelegramBotShop() {
    if (!BOT_USERNAME || BOT_USERNAME === "YOUR_BOT_NAME") {
      alert("Set BOT_USERNAME in App.js first.");
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/auth/telegram/link-token`, {}, { headers: authHeaders });
      const linkToken = res.data?.link_token;
      if (!linkToken) { alert("Could not create Telegram link token."); return; }
      window.open(`https://t.me/${BOT_USERNAME}?start=${linkToken}`, "_blank");
    } catch (err) {
      alert(String(err?.response?.data?.detail || "Telegram link failed."));
    }
  }

  /* ─────────────────────────────────── AUTH PAGE ─────────────────────────────────── */
  if (!isLoggedIn) {
    return (
      <div className="authPage">
        <div className="authGlow" />
        <div className="authCard">
          <div className="authBrand">
            {/* Telegram-style circular logo */}
            <TelegramLogoLarge />
            <h1>Trade Mate</h1>
            <p>Cashbook &amp; Inventory Management</p>
          </div>

          <div className="authTabs">
            <button
              className={`authTab ${authMode === "signin" ? "authTabActive" : ""}`}
              onClick={() => { setAuthMode("signin"); setAuthError(""); }}
            >
              Sign In
            </button>
            <button
              className={`authTab ${authMode === "signup" ? "authTabActive" : ""}`}
              onClick={() => { setAuthMode("signup"); setAuthError(""); }}
            >
              Sign Up
            </button>
          </div>

          {authError && <p className="error" style={{ marginBottom: 16 }}>{authError}</p>}

          {authMode === "signin" && (
            <form onSubmit={signIn} className="formGrid">
              <div>
                <label className="label">Username or Email</label>
                <input
                  className="input"
                  value={siKey}
                  onChange={(e) => setSiKey(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="label">Password</label>
                <PasswordField
                  value={siPassword}
                  onChange={(e) => setSiPassword(e.target.value)}
                  show={showSignInPassword}
                  setShow={setShowSignInPassword}
                  placeholder="••••••••"
                />
              </div>
              <button className="btn btnPrimary btnLg btnFull" type="submit">
                Sign In →
              </button>
            </form>
          )}

          {authMode === "signup" && (
            <form onSubmit={signUp} className="formGrid">
              <div className="row3">
                <div>
                  <label className="label">Username</label>
                  <input
                    className="input"
                    value={suUsername}
                    onChange={(e) => setSuUsername(e.target.value)}
                    placeholder="johndoe"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    className="input"
                    value={suEmail}
                    onChange={(e) => setSuEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label className="label">Password</label>
                  <PasswordField
                    value={suPassword}
                    onChange={(e) => setSuPassword(e.target.value)}
                    show={showSignUpPassword}
                    setShow={setShowSignUpPassword}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="row2">
                <div>
                  <label className="label">Shop Name</label>
                  <input
                    className="input"
                    value={suShopName}
                    onChange={(e) => setSuShopName(e.target.value)}
                    placeholder="My Shop"
                  />
                </div>
                <div>
                  <label className="label">Shop Type</label>
                  <input
                    className="input"
                    value={suShopType}
                    onChange={(e) => setSuShopType(e.target.value)}
                    placeholder="Grocery, Hardware…"
                  />
                </div>
              </div>
              <button className="btn btnPrimary btnLg btnFull" type="submit">
                Create Account →
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────── MAIN APP ─────────────────────────────────── */
  return (
    <div className="page">
      {/* Header */}
      <header className="header">
        <div className="headerBrand">
          {/* Telegram-style circular logo in header */}
          <TelegramLogoIcon size={40} style={{ flexShrink: 0 }} />
          <div>
            <h1>Trade Mate</h1>
            <p>
              {me.shop_name} · {me.shop_type} · <span style={{ color: "var(--text-muted)" }}>@{me.username}</span>
            </p>
          </div>
        </div>

        <nav className="nav">
          <button
            className={`tab ${activePage === "inventory" ? "tabActive" : ""}`}
            onClick={() => setActivePage("inventory")}
          >
            Inventory
          </button>
          <button
            className={`tab ${activePage === "reports" ? "tabActive" : ""}`}
            onClick={() => setActivePage("reports")}
          >
            Reports
          </button>
          <button className="tab" onClick={refreshPage} title="Refresh data">
            ↺ Refresh
          </button>
          <button className="tab" onClick={openTelegramBotShop} title="Open Telegram bot">
             Telegram BOT
          </button>
          <button className="tab tabDanger" onClick={signOut}>
            Sign Out
          </button>
        </nav>
      </header>

      {/* ── INVENTORY PAGE ── */}
      {activePage === "inventory" && (
        <>
          {/* Add Product Card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="cardHeader">
              <div className="cardHeaderLeft">
                <h2>Product Adding Section</h2>
              </div>
            </div>

            <form onSubmit={submitNewProduct} className="formGrid">
              <div>
                <label className="label">Product Name</label>
                <input
                  className="input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Basmati White Rice"
                />
              </div>

              <div>
                <label className="label">Unit</label>
                <div className="unitPicker">
                  {UNIT_OPTIONS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      className={`unitBtn ${selectedUnit === u ? "unitBtnActive" : ""}`}
                      onClick={() => setSelectedUnit(u)}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div className="row3">
                <div>
                  <label className="label">Sell Price</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={newSellPrice}
                    onChange={(e) => setNewSellPrice(e.target.value)}
                    placeholder="e.g. 450"
                  />
                </div>
                <div>
                  <label className="label">Cost Price</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(e.target.value)}
                    placeholder="e.g. 380"
                  />
                </div>
                <div>
                  <label className="label">Starting Stock Qty</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={newStockQty}
                    onChange={(e) => setNewStockQty(e.target.value)}
                    placeholder="e.g. 20"
                  />
                </div>
              </div>

              <div style={{ maxWidth: 280 }}>
                <label className="label">Low Stock Alert Qty</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={newAlertQty}
                  onChange={(e) => setNewAlertQty(e.target.value)}
                  placeholder="e.g. 10"
                />
              </div>

              <div>
                <button className="btn btnPrimary btnLg" type="submit" disabled={adding}>
                  {adding ? "Adding…" : "＋ Add Product"}
                </button>
              </div>
            </form>
          </div>

          {/* Products Table Card */}
          <div className="card">
            <div className="cardHeader">
              <div className="cardHeaderLeft">
                <h2>Your Inventory</h2>
              </div>
              <div className="searchWrap">
                <span className="searchIcon">🔎︎</span>
                <input
                  className="input searchInput"
                  style={{ width: 220 }}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products…"
                />
              </div>
            </div>

            {loadingProducts && (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <LoadingDots />
              </div>
            )}
            {productsError && <p className="error">{productsError}</p>}

            {!loadingProducts && !productsError && productsWithProfit.length === 0 && (
              <div className="emptyState">
                <p style={{ fontSize: 36, marginBottom: 8 }}>📭</p>
                <p>No products yet. Add your first product above.</p>
              </div>
            )}

            {!loadingProducts && !productsError && productsWithProfit.length > 0 && filteredProducts.length === 0 && (
              <div className="emptyState">
                <p>No products matching "{productSearch}"</p>
              </div>
            )}

            {!loadingProducts && !productsError && filteredProducts.length > 0 && (
              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Unit</th>
                      <th>Sell</th>
                      <th>Cost</th>
                      <th>Profit/Unit</th>
                      <th>Stock</th>
                      <th>Alert Qty</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{p.unit}</td>
                        <td>{fmtMoney(p.sell_price)}</td>
                        <td>{fmtMoney(p.cost_price)}</td>
                        <td>
                          {p.profit_per_unit === null ? (
                            <span style={{ color: "var(--text-muted)" }}>—</span>
                          ) : (
                            <span className={p.profit_per_unit >= 0 ? "profitPositive" : "profitNegative"}>
                              {p.profit_per_unit >= 0 ? "+" : ""}{fmtMoney(p.profit_per_unit)}
                            </span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{fmtNum(p.stock_qty)}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{fmtNum(p.alert_qty)}</td>
                        <td><StockLevelBadge status={p.stock_status} /></td>
                        <td>
                          <div className="actions">
                            <button className="btn btnSuccess" onClick={() => openAdjust(p, "add")}>
                              + Add
                            </button>
                            <button className="btn" onClick={() => openAlertModal(p)}>
                              ⚠︎ Alert
                            </button>
                            <button className="btn btnDanger" onClick={() => openAdjust(p, "remove")}>
                              − Remove
                            </button>
                            <button className="btn btnDanger" onClick={() => deleteProduct(p)}>
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Adjust Stock Modal */}
          {selectedProduct && (
            <div className="modalOverlay" onClick={closeAdjust}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Adjust Stock</h3>
                <p className="modalMeta">
                  <strong>{selectedProduct.name}</strong> &nbsp;·&nbsp; Current stock: <strong>{fmtNum(selectedProduct.stock_qty)} {selectedProduct.unit}</strong>
                </p>
                <div className="formGrid">
                  <div>
                    <label className="label">Quantity Change</label>
                    <input
                      className="input"
                      type="number"
                      step="0.01"
                      value={deltaQty}
                      onChange={(e) => setDeltaQty(e.target.value)}
                      placeholder="e.g. 5 or -2"
                    />
                  </div>
                  <div>
                    <label className="label">Reason (optional)</label>
                    <input
                      className="input"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. New stock / Damaged"
                    />
                  </div>
                </div>
                <div className="modalActions">
                  <button className="btn" onClick={closeAdjust} disabled={saving}>Cancel</button>
                  <button className="btn btnPrimary" onClick={submitAdjust} disabled={saving}>
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Alert Qty Modal */}
          {alertProduct && (
            <div className="modalOverlay" onClick={closeAlertModal}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>🔔 Set Low Stock Alert</h3>
                <p className="modalMeta">
                  <strong>{alertProduct.name}</strong> &nbsp;·&nbsp; Current alert at: <strong>{fmtNum(alertProduct.alert_qty)}</strong>
                </p>
                <div>
                  <label className="label">Alert Quantity</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={alertQtyInput}
                    onChange={(e) => setAlertQtyInput(e.target.value)}
                    placeholder="e.g. 10"
                  />
                </div>
                <div className="modalActions">
                  <button className="btn" onClick={closeAlertModal} disabled={savingAlert}>Cancel</button>
                  <button className="btn btnPrimary" onClick={submitAlertQty} disabled={savingAlert}>
                    {savingAlert ? "Saving…" : "Save Alert"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── REPORTS PAGE ── */}
      {activePage === "reports" && (
        <div className="card">
          <div className="cardHeader">
            <div className="cardHeaderLeft">
              <h2>Reports</h2>
            </div>
            <div className="actions">
              <div className="periodGroup">
                {["daily", "weekly", "monthly"].map((p) => (
                  <button
                    key={p}
                    className={`periodBtn ${reportPeriod === p ? "periodActive" : ""}`}
                    onClick={() => loadReport(p)}
                    disabled={reportLoading}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <button className="btn btnPrimary" onClick={() => downloadPdf(reportPeriod)} disabled={reportLoading}>
                ↓ PDF
              </button>
            </div>
          </div>

          {reportLoading && (
            <div style={{ padding: "32px 0", textAlign: "center" }}>
              <LoadingDots />
            </div>
          )}
          {reportError && <p className="error">{reportError}</p>}

          {!reportLoading && !reportError && report && (
            <>
              <div className="reportMeta">
                <span className="reportMetaPill">From: {report.start_date}</span>
                <span className="reportMetaPill">To: {report.end_date}</span>
              </div>

              <div className="statsGrid">
                <div className="statCard">
                  <div className="statLabel">Total Sales</div>
                  <div className="statValue accent">{fmtMoney(report.sales_total)}</div>
                  <div className="statMeta">Revenue collected</div>
                </div>
                <div className="statCard">
                  <div className="statLabel">Purchases</div>
                  <div className="statValue">{fmtMoney(report.purchases_total)}</div>
                  <div className="statMeta">Stock restocking</div>
                </div>
                <div className="statCard">
                  <div className="statLabel">Cash Out</div>
                  <div className="statValue negative">{fmtMoney(report.cash_out_total)}</div>
                  <div className="statMeta">Other expenses</div>
                </div>
                <div className="statCard">
                  <div className="statLabel">Profit</div>
                  <div className={`statValue ${Number(report.profit) >= 0 ? "positive" : "negative"}`}>
                    {fmtMoney(report.profit)}
                  </div>
                  <div className="statMeta">Sell − cost</div>
                </div>
                <div className="statCard">
                  <div className="statLabel">Net Cash</div>
                  <div className={`statValue ${Number(report.net_cash) >= 0 ? "positive" : "negative"}`}>
                    {fmtMoney(report.net_cash)}
                  </div>
                  <div className="statMeta">Cash flow</div>
                </div>
              </div>
            </>
          )}

          {!reportLoading && !reportError && !report && (
            <div className="emptyState">
              <p>Select a period above to load your report.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
