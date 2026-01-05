# PolyWatch - Polymarket Insider Detector

A real-time monitoring system for detecting suspicious insider trading activity on Polymarket.

## Features

- 🔍 Real-time trade monitoring via WebSocket
- 🚨 Insider activity detection based on account age and bet size
- 📊 Live dashboard with interactive charts
- 💾 SQLite database for persistent alert storage
- ⚡ Redis caching for wallet age lookups (optional)
- 🎨 Modern, professional React UI

## Tech Stack

### Backend
- **FastAPI** - Python web framework
- **WebSockets** - Real-time data streaming
- **SQLite** - Database for alerts
- **Redis** (optional) - Caching layer
- **Web3.py** - Blockchain integration

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons

## Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd polymarket-watch
   ```

2. **Install dependencies**
   ```bash
   make install
   ```
   
   Or install separately:
   ```bash
   # Backend
   make install-backend
   
   # Frontend
   make setup-frontend
   ```

3. **Run the application**
   ```bash
   make dev
   ```
   
   Or run separately:
   ```bash
   # Terminal 1 - Backend
   make run-backend
   
   # Terminal 2 - Frontend
   make run-frontend
   ```

## Usage

1. Start both backend and frontend servers using `make dev`
2. Open `http://localhost:5173` in your browser
3. The dashboard will show:
   - Live trade feed
   - Suspicious activity alerts
   - Account age analysis
   - Risk metrics

## Configuration

Edit `backend/app.py` to configure:

- `USE_MOCK_DATA` - Set to `True` for mock data, `False` for real Polymarket WebSocket
- `SUSPICIOUS_THRESHOLD_USD` - Minimum bet size to flag (default: $10,000)
- `NEW_ACCOUNT_HOURS` - Account age threshold (default: 48 hours)
- `POLYMARKET_WS_URL` - WebSocket endpoint URL

## Makefile Commands

- `make install` - Full setup (backend + frontend)
- `make install-backend` - Install Python dependencies
- `make setup-frontend` - Setup React app and install dependencies
- `make run-backend` - Start FastAPI server (port 8000)
- `make run-frontend` - Start Vite dev server
- `make dev` - Run both servers concurrently
- `make stop` - Stop all running servers
- `make clean` - Clean PID files

## Project Structure

```
polymarket-watch/
├── backend/
│   ├── app.py              # FastAPI application
│   └── insider_activity.db # SQLite database (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── main.jsx        # React entry point
│   │   └── index.css       # Global styles
│   ├── package.json
│   └── vite.config.js
├── makefile                # Development commands
└── README.md
```

## License

MIT

