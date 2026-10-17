# ArhamTrade — Trade Dashboard

A full-stack trade monitoring dashboard built with React, Vite, Node.js, Express, and MongoDB.

## Features

- Displays trade records stored in MongoDB.
- Seeds the database with 2,000 sample trades when it is empty.
- Provides a mock trade-pull API.
- Supports a configurable pull delay using an environment variable.
- Adds 100 new sample trades after a successful pull.
- Updates the dashboard automatically using Server-Sent Events (SSE).
- Includes trade search and symbol filtering.
- Displays trade statistics and pull status.

## Tech Stack

**Frontend**
- React
- Vite
- Axios
- CSS

**Backend**
- Node.js
- Express.js
- Mongoose
- Server-Sent Events (SSE)

**Database**
- MongoDB

## Project Structure

```text
arham-trades-dashboard/
├── backend/
│   ├── server.js
│   ├── tradeModel.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   ├── package.json
│   └── index.html
└── README.md
```

## Prerequisites

- Node.js and npm
- MongoDB database
- A code editor such as VS Code

## Configuration

Create a `.env` file inside the `backend` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
PULL_DELAY_MS=10000
```

Replace `your_mongodb_connection_string` with your MongoDB connection string. Keep `.env` private and never commit database credentials to Git.

`PULL_DELAY_MS` specifies the pull delay in milliseconds. For example, `10000` means 10 seconds.

## Installation and Setup

### 1. Start the backend

Open a terminal in the `backend` directory and run:

```bash
npm install
npm run dev
```

The backend runs at `http://localhost:5000`.

### 2. Start the frontend

Open another terminal in the `frontend` directory and run:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

Keep both terminals running while using the dashboard.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/getTrades` | Retrieves trade records and pull status |
| GET | `/events` | Opens an SSE connection for live updates |
| POST | `/pull` | Starts a mock trade pull |

The current `GET /getTrades` implementation returns up to 500 records per request.

The `POST /pull` endpoint returns an accepted response when a pull starts. A second pull is rejected while another pull is running. After the configured delay, the mock pull inserts 100 new trades into MongoDB.

## Automatic Updates

The frontend connects to `/events` using `EventSource`. The backend sends pull-status updates and publishes newly pulled trades when the pull finishes. The frontend then reloads the trade list without requiring a manual browser refresh.

## Notes

- The application uses mock trade data; it does not connect to a real stock exchange.
- The pull delay is configurable through `PULL_DELAY_MS`.
- Keep the backend and frontend running in separate terminals.
