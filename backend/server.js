
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Trade = require("./tradeModel");

const app = express();

app.use(cors());
app.use(express.json());

// Pull status
let pullStatus = "idle";
let pullInProgress = false;
let clients = [];

function sendUpdate(data) {
  clients.forEach((client) => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// Create sample trades
async function seedTrades() {
  const count = await Trade.countDocuments();

  if (count > 0) return;

  const symbols = ["TCS", "INFY", "RELIANCE", "HDFCBANK"];

  const trades = Array.from({ length: 2000 }, (_, i) => ({
    tradeId: `TR-${i + 1}`,
    client: `Client-${(i % 100) + 1}`,
    symbol: symbols[i % symbols.length],
    quantity: Math.floor(Math.random() * 100) + 1,
    price: Number((100 + Math.random() * 2000).toFixed(2)),
    timestamp: new Date(Date.now() - i * 1000)
  }));

  await Trade.insertMany(trades);
  console.log("2000 sample trades created");
}

// GET existing trades immediately
app.get("/getTrades", async (req, res) => {
  try {
    const trades = await Trade.find()
      .sort({ timestamp: -1 })
      .limit(500);

    res.json({
      trades,
      count: trades.length,
      pullStatus
    });
  } catch (error) {
    res.status(500).json({ error: "Could not fetch trades" });
  }
});

// Server-Sent Events
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);
  res.write(`data: ${JSON.stringify({ pullStatus })}\n\n`);

  req.on("close", () => {
    clients = clients.filter((client) => client !== res);
  });
});

// Start pull without keeping HTTP request open
app.post("/pull", async (req, res) => {
  if (pullInProgress) {
    return res.status(409).json({
      message: "A pull is already running"
    });
  }

  pullInProgress = true;
  pullStatus = "running";

  res.status(202).json({
    message: "Pull started",
    pullStatus
  });

  sendUpdate({ pullStatus });

  try {
    const delay = Number(process.env.PULL_DELAY_MS || 900000);

    await new Promise((resolve) => setTimeout(resolve, delay));

    const batch = Array.from({ length: 100 }, (_, i) => ({
      tradeId: `NEW-${Date.now()}-${i}`,
      client: `Client-${i + 1}`,
      symbol: ["TCS", "INFY", "RELIANCE"][i % 3],
      quantity: Math.floor(Math.random() * 100) + 1,
      price: Number((100 + Math.random() * 2000).toFixed(2)),
      timestamp: new Date()
    }));

    await Trade.insertMany(batch);

    pullStatus = "completed";
    sendUpdate({ pullStatus, newTrades: batch });
  } catch (error) {
    console.error("Pull failed:", error.message);
    pullStatus = "failed";
    sendUpdate({ pullStatus });
  } finally {
    pullInProgress = false;
  }
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");

    await seedTrades();

    app.listen(process.env.PORT || 5000, () => {
      console.log("Server running on http://localhost:5000");
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
