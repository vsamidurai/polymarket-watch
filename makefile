# Makefile for Polymarket Insider Detector

.PHONY: help install install-backend run-backend setup-frontend run-frontend dev stop clean

# Python and Node commands
PYTHON=python3
PIP=pip3
NPM=npm

# PID files for process management
BACKEND_PID=.backend.pid
FRONTEND_PID=.frontend.pid

help:
	@echo "----------------------------------------------------------------"
	@echo "Polymarket Insider Detector - Local Development Manager"
	@echo "----------------------------------------------------------------"
	@echo "Prerequisites: Python 3.8+, Node.js 16+, Redis (optional)"
	@echo ""
	@echo "Usage:"
	@echo "  make install           Full setup (Backend install + Frontend init)"
	@echo "  make install-backend   Install Python dependencies only"
	@echo "  make run-backend       Start the Python/FastAPI server"
	@echo "  make setup-frontend    Initialize React app & install dependencies"
	@echo "  make run-frontend      Start the React development server"
	@echo "  make dev               Run both servers concurrently"
	@echo "  make stop              Stop all running servers"
	@echo "  make clean             Clean PID files"
	@echo "----------------------------------------------------------------"

install: install-backend setup-frontend

install-backend:
	@echo "Installing Python dependencies..."
	$(PIP) install fastapi uvicorn redis aiosqlite web3 websockets

run-backend:
	@echo "Starting Python Backend on port 8000..."
	@cd backend && uvicorn app:app --reload --port 8000 --host 0.0.0.0

setup-frontend:
	@if [ ! -f "frontend/package.json" ]; then \
		echo "Initializing Vite React App..."; \
		$(NPM) create vite@latest frontend -- --template react --yes || true; \
		echo "Installing Frontend Dependencies..."; \
		cd frontend && $(NPM) install; \
		cd frontend && $(NPM) install lucide-react recharts; \
		cd frontend && $(NPM) install -D tailwindcss postcss autoprefixer; \
		echo "Configuring Tailwind CSS..."; \
		cd frontend && npx tailwindcss init -p || true; \
		if [ ! -f "frontend/tailwind.config.js" ]; then \
			echo "/** @type {import('tailwindcss').Config} */ \nexport default { \n  content: [\"./index.html\", \"./src/**/*.{js,ts,jsx,tsx}\"], \n  theme: { extend: {} }, \n  plugins: [], \n}" > frontend/tailwind.config.js; \
		fi; \
		if [ ! -f "frontend/src/index.css" ] || ! grep -q "@tailwind" frontend/src/index.css 2>/dev/null; then \
			echo "@tailwind base;\n@tailwind components;\n@tailwind utilities;" > frontend/src/index.css; \
		fi; \
		if [ -f "frontend/ui.js" ] && [ ! -f "frontend/src/App.jsx" ]; then \
			echo "Copying ui.js to App.jsx..."; \
			cp frontend/ui.js frontend/src/App.jsx || cp frontend/ui.js frontend/src/App.js; \
		fi; \
		echo "----------------------------------------------------------------"; \
		echo "SETUP COMPLETE!"; \
		echo "If your React code is in frontend/ui.js, it has been copied to frontend/src/App.jsx"; \
		echo "----------------------------------------------------------------"; \
	else \
		echo "Frontend already initialized. Skipping setup."; \
	fi

run-frontend:
	@if [ ! -f "frontend/package.json" ]; then \
		echo "----------------------------------------------------------------"; \
		echo "ERROR: Frontend not initialized."; \
		echo "Please run 'make setup-frontend' first."; \
		echo "----------------------------------------------------------------"; \
		exit 1; \
	fi
	@echo "Starting Frontend..."
	@cd frontend && $(NPM) run dev

dev:
	@echo "Starting both backend and frontend servers..."
	@echo "Press Ctrl+C to stop both servers"
	@bash -c ' \
		trap "kill 0" EXIT INT TERM; \
		(cd backend && uvicorn app:app --reload --port 8000 --host 0.0.0.0) & \
		sleep 2; \
		if [ -f "frontend/package.json" ]; then \
			(cd frontend && $(NPM) run dev) & \
		else \
			echo "Warning: Frontend not set up. Run '"'"'make setup-frontend'"'"' first."; \
		fi; \
		wait \
	'

stop:
	@echo "Stopping servers..."
	@if [ -f "$(BACKEND_PID)" ]; then \
		kill $$(cat $(BACKEND_PID)) 2>/dev/null || true; \
		rm -f $(BACKEND_PID); \
	fi
	@if [ -f "$(FRONTEND_PID)" ]; then \
		kill $$(cat $(FRONTEND_PID)) 2>/dev/null || true; \
		rm -f $(FRONTEND_PID); \
	fi
	@pkill -f "uvicorn app:app" 2>/dev/null || true
	@pkill -f "vite" 2>/dev/null || true
	@echo "Servers stopped."

clean:
	@rm -f $(BACKEND_PID) $(FRONTEND_PID)
	@echo "Cleaned PID files."