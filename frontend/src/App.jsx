
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  Search,
  RefreshCw,
  TrendingUp,
  Wallet,
  Database,
  CircleCheck,
  Clock3,
} from "lucide-react";
import "./App.css";

const API = "http://localhost:5000";

function App() {
  const [trades, setTrades] = useState([]);
  const [search, setSearch] = useState("");
  const [symbol, setSymbol] = useState("All");
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const loadTrades = async () => {
    try {
      setError("");
      const response = await axios.get(`${API}/getTrades`);
      setTrades(response.data.trades || []);
      setStatus(response.data.pullStatus || "idle");
    } catch {
      setError("Cannot connect to backend. Make sure port 5000 is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
  }, []);

  const symbols = useMemo(
    () => ["All", ...new Set(trades.map((trade) => trade.symbol))],
    [trades]
  );

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      const matchesSymbol = symbol === "All" || trade.symbol === symbol;
      const query = search.toLowerCase();
      const matchesSearch =
        trade.tradeId?.toLowerCase().includes(query) ||
        trade.client?.toLowerCase().includes(query) ||
        trade.symbol?.toLowerCase().includes(query);

      return matchesSymbol && matchesSearch;
    });
  }, [trades, search, symbol]);

  const totalValue = trades.reduce(
    (sum, trade) => sum + trade.quantity * trade.price,
    0
  );

  const startPull = async () => {
    try {
      setPulling(true);
      setError("");
      const response = await axios.post(`${API}/pull`);
      setStatus(response.data.pullStatus || "running");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to start pull. Check the backend terminal."
      );
    } finally {
      setPulling(false);
    }
  };

  useEffect(() => {
    const events = new EventSource(`${API}/events`);

    events.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.pullStatus) setStatus(data.pullStatus);

        if (data.newTrades?.length) {
          loadTrades();
        }
      } catch {
        // Ignore invalid event data.
      }
    };

    events.onerror = () => {
      // EventSource retries the connection automatically.
    };

    return () => events.close();
  }, []);

  const formatMoney = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Activity size={23} /></div>
          <div>
            <h2>Arham<span>Trade</span></h2>
            <small>TRADING INTELLIGENCE</small>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>
        <div className="nav-item active"><Database size={18} /> Trade Overview</div>
        <div className="nav-item"><TrendingUp size={18} /> Market Activity</div>
        <div className="nav-item"><Wallet size={18} /> Transactions</div>

        <div className="sidebar-bottom">
          <div className="online-dot" />
          <div><strong>System Online</strong><small>Local environment</small></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">OVERVIEW / DASHBOARD</p>
            <h1>Trade Dashboard</h1>
            <p className="subtitle">Monitor and manage your trade records.</p>
          </div>
          <div className="top-actions">
            <span className="live-badge"><span /> LIVE DATA</span>
            <button className="primary-button" onClick={startPull} disabled={pulling || status === "running"}>
              <ArrowDownToLine size={17} />
              {pulling || status === "running" ? "Pull Running..." : "Pull Data"}
            </button>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-top"><span>Total Trades</span><Database size={19} /></div>
            <h2>{trades.length.toLocaleString("en-IN")}</h2>
            <p><CircleCheck size={15} /> Records loaded from MongoDB</p>
          </article>

          <article className="stat-card">
            <div className="stat-top"><span>Trade Value</span><Wallet size={19} /></div>
            <h2>{formatMoney(totalValue)}</h2>
            <p><TrendingUp size={15} /> Quantity × price</p>
          </article>

          <article className="stat-card">
            <div className="stat-top"><span>Symbols</span><Activity size={19} /></div>
            <h2>{Math.max(0, symbols.length - 1)}</h2>
            <p><ArrowUpRight size={15} /> Unique instruments</p>
          </article>

          <article className="stat-card">
            <div className="stat-top"><span>Pull Status</span><Clock3 size={19} /></div>
            <h2 className="status-value">{status}</h2>
            <p><span className={`status-dot ${status}`} /> Data sync status</p>
          </article>
        </section>

        <section className="table-panel">
          <div className="table-heading">
            <div>
              <h2>Trade Records</h2>
              <p>Search, filter and review recent transactions.</p>
            </div>
            <button className="secondary-button" onClick={loadTrades} disabled={loading}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          <div className="filters">
            <label className="search-box">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search trade, client or symbol..."
              />
            </label>

            <select value={symbol} onChange={(event) => setSymbol(event.target.value)}>
              {symbols.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Symbols" : item}
                </option>
              ))}
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>TRADE ID</th>
                  <th>CLIENT</th>
                  <th>SYMBOL</th>
                  <th>QUANTITY</th>
                  <th>PRICE</th>
                  <th>TOTAL VALUE</th>
                  <th>TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="empty-state">Loading trades...</td></tr>
                ) : filteredTrades.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state">No matching trades found.</td></tr>
                ) : (
                  filteredTrades.map((trade) => (
                    <tr key={trade._id || trade.tradeId}>
                      <td className="trade-id">{trade.tradeId}</td>
                      <td>{trade.client}</td>
                      <td><span className="symbol-pill">{trade.symbol}</span></td>
                      <td>{trade.quantity}</td>
                      <td>{formatMoney(trade.price)}</td>
                      <td className="value-cell">{formatMoney(trade.quantity * trade.price)}</td>
                      <td>{new Date(trade.timestamp).toLocaleString("en-IN")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>Showing {filteredTrades.length} of {trades.length} loaded records</span>
            <span><span className="online-dot" /> MongoDB connected</span>
          </div>
        </section>

        <footer>Arham Trade Intelligence <span>•</span> Assessment Dashboard</footer>
      </main>
    </div>
  );
}

export default App;
