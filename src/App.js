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

function StockLevelBadge({ status }) {
  const s = String(status || "GREEN").toUpperCase();

  const base = {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "10px",
    fontWeight: 700,
    fontSize: "12px",
    border: "1px solid rgba(0,0,0,0.12)",
    minWidth: "78px",
    textAlign: "center",
  };

  if (s === "RED") {
    return <span style={{ ...base, background: "#ffdddd", color: "#7a0000" }}>LOW</span>;
  }
  if (s === "YELLOW") {
    return <span style={{ ...base, background: "#fff3c4", color: "#7a5a00" }}>MEDIUM</span>;
  }
  return <span style={{ ...base, background: "#dff7df", color: "#0f5a0f" }}>OK</span>;
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
        title={show ? "Hide password" : "Show password"}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: "18px",
          lineHeight: 1,
          padding: 0,
        }}
      >
        {show ? "⌣" : "👁"}
      </button>
    </div>
  );
}

function App() {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("tm_token") || "");
  const [me, setMe] = useState(() => {
    const raw = localStorage.getItem("tm_me");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
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
      const msg = err?.response?.data?.detail || "Sign up failed.";
      setAuthError(String(msg));
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
      const msg = err?.response?.data?.detail || "Sign in failed.";
      setAuthError(String(msg));
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
      loadMe(authToken).catch(() => {
        signOut();
      });
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

      const res = await axios.get(`${API_BASE}/products`, {
        params: { shop_id: SHOP_ID },
      });

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
      const profit =
        Number.isFinite(sell) && Number.isFinite(cost) ? sell - cost : null;

      return { ...p, profit_per_unit: profit };
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();

    if (!q) return productsWithProfit;

    return productsWithProfit.filter((p) =>
      String(p.name || "").toLowerCase().includes(q)
    );
  }, [productsWithProfit, productSearch]);

  async function submitNewProduct(e) {
    e.preventDefault();

    const sell = Number(newSellPrice);
    const cost = Number(newCostPrice);
    const qty = Number(newStockQty);
    const alertQty = Number(newAlertQty);

    if (!newName.trim()) {
      alert("Product name is required.");
      return;
    }
    if (!selectedUnit) {
      alert("Please select a unit.");
      return;
    }
    if (!Number.isFinite(sell) || sell < 0) {
      alert("Enter a valid sell price (0 or more).");
      return;
    }
    if (!Number.isFinite(cost) || cost < 0) {
      alert("Enter a valid cost price (0 or more).");
      return;
    }
    if (!Number.isFinite(qty) || qty < 0) {
      alert("Enter a valid stock quantity (0 or more).");
      return;
    }
    if (!Number.isFinite(alertQty) || alertQty < 0) {
      alert("Enter a valid low stock alert quantity (0 or more).");
      return;
    }

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

      if (!productId) {
        alert("Product created but product id is missing.");
        return;
      }

      if (qty > 0) {
        await axios.post(`${API_BASE}/purchases`, {
          shop_id: SHOP_ID,
          items: [
            {
              product_id: productId,
              qty: qty,
              unit_price: cost,
              sell_price: sell,
              alert_qty: alertQty,
            },
          ],
        });
      }

      setNewName("");
      setSelectedUnit("");
      setNewSellPrice("");
      setNewCostPrice("");
      setNewStockQty("");
      setNewAlertQty("");

      await loadProducts();
      await loadReport(reportPeriod);
      alert("Product added and purchase recorded ✅");
    } catch (e2) {
      const msg =
        e2?.response?.data?.detail ||
        e2?.response?.data ||
        "Failed to add product. Check backend and try again.";
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

  function closeAdjust() {
    setSelectedProduct(null);
    setDeltaQty("");
    setReason("");
  }

  async function submitAdjust() {
    if (!selectedProduct) return;

    const n = Number(deltaQty);
    if (!Number.isFinite(n) || n === 0) {
      alert("Enter a valid quantity (example: 1 or -1).");
      return;
    }

    try {
      setSaving(true);

      if (n > 0) {
        await axios.post(`${API_BASE}/purchases`, {
          shop_id: SHOP_ID,
          items: [
            {
              product_id: selectedProduct.id,
              qty: n,
              unit_price: Number(selectedProduct.cost_price),
              sell_price: Number(selectedProduct.sell_price),
              alert_qty: Number(selectedProduct.alert_qty || 0),
            },
          ],
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
      const msg =
        e?.response?.data?.detail ||
        "Stock update failed. Check backend and try again.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  function openAlertModal(product) {
    setAlertProduct(product);
    setAlertQtyInput(String(product.alert_qty ?? 0));
  }

  function closeAlertModal() {
    setAlertProduct(null);
    setAlertQtyInput("");
  }

  async function submitAlertQty() {
    if (!alertProduct) return;

    const n = Number(alertQtyInput);
    if (!Number.isFinite(n) || n < 0) {
      alert("Enter a valid alert quantity (0 or more).");
      return;
    }

    try {
      setSavingAlert(true);

      await axios.put(`${API_BASE}/products/${alertProduct.id}/alert`, {
        shop_id: SHOP_ID,
        alert_qty: n,
      });

      await loadProducts();
      closeAlertModal();
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        "Updating alert quantity failed. Check backend and try again.";
      alert(msg);
    } finally {
      setSavingAlert(false);
    }
  }

  async function deleteProduct(p) {
    const ok = window.confirm("Do you want to delete this product from your shop?");
    if (!ok) return;

    try {
      await axios.delete(`${API_BASE}/products/${p.id}`, {
        params: { shop_id: SHOP_ID },
      });
      await loadProducts();
      alert("Product deleted ✅");
    } catch (e) {
      const msg = e?.response?.data?.detail || "Delete failed. Check backend and try again.";
      alert(msg);
    }
  }

  async function openTelegramBotShop() {
    if (!BOT_USERNAME || BOT_USERNAME === "YOUR_BOT_NAME") {
      alert("Set BOT_USERNAME in App.js first (example: TradeMateBot).");
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE}/auth/telegram/link-token`,
        {},
        { headers: authHeaders }
      );

      const linkToken = res.data?.link_token;
      if (!linkToken) {
        alert("Could not create Telegram link token.");
        return;
      }

      window.open(`https://t.me/${BOT_USERNAME}?start=${linkToken}`, "_blank");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Telegram link failed. Please sign in again.";
      alert(String(msg));
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="page">
        <header className="header">
          <div>
            <h1>Trade Mate</h1>
            <p className="muted">Sign in to manage your shop</p>
          </div>

          <nav className="nav">
            <button
              className={`tab ${authMode === "signin" ? "tabActive" : ""}`}
              onClick={() => setAuthMode("signin")}
            >
              Sign In
            </button>
            <button
              className={`tab ${authMode === "signup" ? "tabActive" : ""}`}
              onClick={() => setAuthMode("signup")}
            >
              Sign Up
            </button>
          </nav>
        </header>

        <div className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
          {authError && <p className="error">{authError}</p>}

          {authMode === "signin" && (
            <>
              <h2 style={{ marginTop: 0 }}>Sign In</h2>
              <form onSubmit={signIn} className="formGrid">
                <div>
                  <label className="label">Username or Email</label>
                  <input
                    className="input"
                    value={siKey}
                    onChange={(e) => setSiKey(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Password</label>
                  <PasswordField
                    value={siPassword}
                    onChange={(e) => setSiPassword(e.target.value)}
                    show={showSignInPassword}
                    setShow={setShowSignInPassword}
                  />
                </div>
                <div>
                  <button className="btn btnPrimary" type="submit">
                    Sign In
                  </button>
                </div>
              </form>
            </>
          )}

          {authMode === "signup" && (
            <>
              <h2 style={{ marginTop: 0 }}>Sign Up</h2>
              <form onSubmit={signUp} className="formGrid">
                <div className="row3">
                  <div>
                    <label className="label">Username</label>
                    <input
                      className="input"
                      value={suUsername}
                      onChange={(e) => setSuUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      className="input"
                      value={suEmail}
                      onChange={(e) => setSuEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <PasswordField
                      value={suPassword}
                      onChange={(e) => setSuPassword(e.target.value)}
                      show={showSignUpPassword}
                      setShow={setShowSignUpPassword}
                    />
                  </div>
                </div>

                <div className="row3">
                  <div>
                    <label className="label">Shop Name</label>
                    <input
                      className="input"
                      value={suShopName}
                      onChange={(e) => setSuShopName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Shop Type</label>
                    <input
                      className="input"
                      value={suShopType}
                      onChange={(e) => setSuShopType(e.target.value)}
                      placeholder="Grocery, Hardware, Pharmacy..."
                    />
                  </div>
                </div>

                <div>
                  <button className="btn btnPrimary" type="submit">
                    Create Account
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Trade Mate</h1>
          <p className="muted">
            Signed in as {me.username} | Shop: {me.shop_name} ({me.shop_type}) | Shop ID: {me.shop_id}
          </p>
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
          <button className="tab" onClick={refreshPage}>
            Refresh Page
          </button>
          <button className="tab" onClick={openTelegramBotShop}>
            Your Telegram Bot Shop
          </button>
          <button className="tab" onClick={signOut}>
            Sign Out
          </button>
        </nav>
      </header>

      {activePage === "inventory" && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="cardHeader">
              <h2>Add Product</h2>
            </div>

            <form onSubmit={submitNewProduct} className="formGrid">
              <div>
                <label className="label">Product name</label>
                <input
                  className="input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="example: White Rice basmathi"
                />
              </div>

              <div>
                <label className="label">Unit</label>

                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 6 }}>
                  {UNIT_OPTIONS.map((u) => (
                    <label key={u} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="radio"
                        name="unitPicker"
                        value={u}
                        checked={selectedUnit === u}
                        onChange={() => setSelectedUnit(u)}
                      />
                      <span>{u}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="row3">
                <div>
                  <label className="label">Sell price</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={newSellPrice}
                    onChange={(e) => setNewSellPrice(e.target.value)}
                    placeholder="example: 450"
                  />
                </div>
                <div>
                  <label className="label">Cost price</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(e.target.value)}
                    placeholder="example: 380"
                  />
                </div>
                <div>
                  <label className="label">Starting stock qty</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={newStockQty}
                    onChange={(e) => setNewStockQty(e.target.value)}
                    placeholder="example: 20"
                  />
                </div>
              </div>

              <div style={{ maxWidth: 280 }}>
                <label className="label">Low stock alert qty</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={newAlertQty}
                  onChange={(e) => setNewAlertQty(e.target.value)}
                  placeholder="example: 10"
                />
              </div>

              <div>
                <button className="btn btnPrimary" type="submit" disabled={adding}>
                  {adding ? "Adding..." : "Add Product"}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="cardHeader">
              <h2>Products</h2>
              <div className="actions">
                <input
                  className="input"
                  style={{ width: 220 }}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search product"
                />
              </div>
            </div>

            {loadingProducts && <p>Loading...</p>}
            {productsError && <p className="error">{productsError}</p>}

            {!loadingProducts && !productsError && productsWithProfit.length === 0 && (
              <p>No products yet. Add a product above.</p>
            )}

            {!loadingProducts &&
              !productsError &&
              productsWithProfit.length > 0 &&
              filteredProducts.length === 0 && (
                <p>No matching products found.</p>
              )}

            {!loadingProducts && !productsError && filteredProducts.length > 0 && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Unit</th>
                    <th>Sell</th>
                    <th>Cost</th>
                    <th>Profit/unit</th>
                    <th>Stock</th>
                    <th>Alert Qty</th>
                    <th>Stock Level</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.unit}</td>
                      <td>{fmtMoney(p.sell_price)}</td>
                      <td>{fmtMoney(p.cost_price)}</td>
                      <td>{p.profit_per_unit === null ? "-" : fmtMoney(p.profit_per_unit)}</td>
                      <td>{fmtNum(p.stock_qty)}</td>
                      <td>{fmtNum(p.alert_qty)}</td>
                      <td>
                        <StockLevelBadge status={p.stock_status} />
                      </td>
                      <td className="actions">
                        <button className="btn" onClick={() => openAdjust(p, "add")}>
                          + Add
                        </button>
                        <button className="btn" onClick={() => openAlertModal(p)}>
                          Set Alert
                        </button>
                        <button className="btn btnDanger" onClick={() => openAdjust(p, "remove")}>
                          − Remove
                        </button>
                        <button className="btn btnDanger" onClick={() => deleteProduct(p)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {selectedProduct && (
            <div className="modalOverlay" onClick={closeAdjust}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Adjust Stock</h3>
                <p className="muted">
                  {selectedProduct.name} (current: {fmtNum(selectedProduct.stock_qty)})
                </p>

                <label className="label">Quantity change</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={deltaQty}
                  onChange={(e) => setDeltaQty(e.target.value)}
                  placeholder="example: 5 or -2"
                />

                <label className="label">Reason (optional)</label>
                <input
                  className="input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="example: New stock / Damaged"
                />

                <div className="modalActions">
                  <button className="btn" onClick={closeAdjust} disabled={saving}>
                    Cancel
                  </button>
                  <button className="btn btnPrimary" onClick={submitAdjust} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {alertProduct && (
            <div className="modalOverlay" onClick={closeAlertModal}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Set Low Stock Alert</h3>
                <p className="muted">
                  {alertProduct.name} (current alert: {fmtNum(alertProduct.alert_qty)})
                </p>

                <label className="label">Alert quantity</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={alertQtyInput}
                  onChange={(e) => setAlertQtyInput(e.target.value)}
                  placeholder="example: 10"
                />

                <div className="modalActions">
                  <button className="btn" onClick={closeAlertModal} disabled={savingAlert}>
                    Cancel
                  </button>
                  <button className="btn btnPrimary" onClick={submitAlertQty} disabled={savingAlert}>
                    {savingAlert ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activePage === "reports" && (
        <div className="card">
          <div className="cardHeader">
            <h2>Reports</h2>

            <div className="actions">
              <button
                className={`periodBtn ${reportPeriod === "daily" ? "periodActive" : ""}`}
                onClick={() => loadReport("daily")}
                disabled={reportLoading}
              >
                Daily
              </button>

              <button
                className={`periodBtn ${reportPeriod === "weekly" ? "periodActive" : ""}`}
                onClick={() => loadReport("weekly")}
                disabled={reportLoading}
              >
                Weekly
              </button>

              <button
                className={`periodBtn ${reportPeriod === "monthly" ? "periodActive" : ""}`}
                onClick={() => loadReport("monthly")}
                disabled={reportLoading}
              >
                Monthly
              </button>

              <button className="btn btnPrimary" onClick={() => downloadPdf(reportPeriod)} disabled={reportLoading}>
                Download PDF
              </button>
            </div>
          </div>

          {reportLoading && <p>Loading report...</p>}
          {reportError && <p className="error">{reportError}</p>}

          {!reportLoading && !reportError && report && (
            <div>
              <p className="muted">
                Period: {report.period} | From: {report.start_date} | To: {report.end_date}
              </p>

              <table className="table">
                <thead>
                  <tr>
                    <th>Sales</th>
                    <th>Purchases</th>
                    <th>Cash Out</th>
                    <th>Profit</th>
                    <th>Net Cash</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{fmtMoney(report.sales_total)}</td>
                    <td>{fmtMoney(report.purchases_total)}</td>
                    <td>{fmtMoney(report.cash_out_total)}</td>
                    <td>{fmtMoney(report.profit)}</td>
                    <td>{fmtMoney(report.net_cash)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;