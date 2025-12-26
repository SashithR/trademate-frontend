import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";
const SHOP_ID = 1;

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deltaQty, setDeltaQty] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    try {
      setError("");
      setLoading(true);
      const res = await axios.get(`${API_BASE}/products`, {
        params: { shop_id: SHOP_ID },
      });
      setProducts(res.data || []);
    } catch (e) {
      setError("Failed to load products. Is backend running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

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
      await axios.post(`${API_BASE}/stock/adjust`, {
        shop_id: SHOP_ID,
        product_id: selectedProduct.id,
        delta_qty: n,
        reason: reason || null,
      });

      await loadProducts();
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

  return (
    <div className="page">
      <header className="header">
        <h1>Trade Mate</h1>
        <p>Shop ID: {SHOP_ID}</p>
      </header>

      <div className="card">
        <div className="cardHeader">
          <h2>Products</h2>
          <button className="btn" onClick={loadProducts} disabled={loading}>
            Refresh
          </button>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && products.length === 0 && (
          <p>No products yet. Add products in Swagger first.</p>
        )}

        {!loading && !error && products.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Unit</th>
                <th>Sell Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.unit}</td>
                  <td>{p.sell_price}</td>
                  <td>{p.stock_qty}</td>
                  <td className="actions">
                    <button
                      className="btn"
                      onClick={() => openAdjust(p, "add")}
                    >
                      + Add
                    </button>
                    <button
                      className="btn btnDanger"
                      onClick={() => openAdjust(p, "remove")}
                    >
                      - Remove
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
              {selectedProduct.name} (current: {selectedProduct.stock_qty})
            </p>

            <label className="label">Quantity change</label>
            <input
              className="input"
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
    </div>
  );
}

export default App;
