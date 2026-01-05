import asyncio
import json
import logging
import random
import time
from typing import Dict, Optional, List

# Third-party imports (requires: pip install fastapi uvicorn redis aiosqlite web3 websockets)
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from redis import asyncio as aioredis
import aiosqlite
from web3 import Web3
import websockets

# --- Configuration ---
# Try RTDS for trade data, or CLOB for orderbook data
POLYMARKET_RTDS_URL = "wss://ws-live-data.polymarket.com"  # Real-Time Data Socket for trades
POLYMARKET_CLOB_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/market"  # CLOB for market data
POLYMARKET_WS_URL = POLYMARKET_RTDS_URL  # Default to RTDS for trades
RPC_URL = "https://polygon-rpc.com" 
REDIS_URL = "redis://localhost:6379"
DB_PATH = "insider_activity.db"
SUSPICIOUS_THRESHOLD_USD = 10000
NEW_ACCOUNT_HOURS = 48
USE_MOCK_DATA = False  # Set to True to use mock data instead of real WebSocket connection

# --- Setup ---
app = FastAPI(title="Polymarket Insider Sentinel")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sentinel")

# Enable CORS for the React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))

# Global connections
redis: Optional[aioredis.Redis] = None
db: Optional[aiosqlite.Connection] = None

# Connection Manager for React Clients
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # Convert to JSON string once
        payload = json.dumps(message)
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                # Handle stale connections
                pass

manager = ConnectionManager()

@app.on_event("startup")
async def startup():
    global redis, db
    # 1. Connect Redis
    try:
        redis = await aioredis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
        logger.info("Redis Connected")
    except Exception as e:
        logger.warning(f"Redis connection failed (Continuing without cache): {e}")

    # 2. Connect SQLite & Create Table
    db = await aiosqlite.connect(DB_PATH)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS suspicious_trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tx_hash TEXT,
            wallet_address TEXT,
            market_slug TEXT,
            amount_usd REAL,
            wallet_age_hours REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    await db.commit()
    logger.info("SQLite Connected")
    
    # 3. Start Background Sentinel
    asyncio.create_task(polymarket_sentinel())

@app.on_event("shutdown")
async def shutdown():
    if redis: await redis.close()
    if db: await db.close()

# --- Core Logic ---

async def get_wallet_age_hours(wallet_address: str) -> float:
    """
    Determines wallet age. 
    1. Checks Redis Cache (Fast)
    2. If miss, Queries Blockchain (Slow) & Caches result
    """
    cache_key = f"wallet:{wallet_address}:first_seen"
    
    # 1. Try Cache
    if redis:
        cached_timestamp = await redis.get(cache_key)
        if cached_timestamp:
            first_seen_ts = float(cached_timestamp)
            return (time.time() - first_seen_ts) / 3600

    # 2. Cache Miss - Query RPC
    try:
        # Simulate RPC latency or fetch real nonce
        # nonce = w3.eth.get_transaction_count(wallet_address)
        await asyncio.sleep(0.1) 
        
        # MOCK LOGIC: Randomize age for demonstration purposes if RPC fails or is slow
        # In prod: use real nonce or etherscan API
        is_new = random.random() > 0.8
        
        if is_new:
            first_seen_ts = time.time() - (random.randint(1, 20) * 3600)
        else:
            first_seen_ts = time.time() - (24 * 3600 * 30)

        # 3. Write to Cache (TTL 24 hours)
        if redis:
            await redis.set(cache_key, str(first_seen_ts), ex=86400)
        
        return (time.time() - first_seen_ts) / 3600
        
    except Exception as e:
        logger.error(f"RPC Error: {e}")
        return 9999 

async def analyze_trade(trade_data: dict):
    """
    Heuristic Engine & Broadcast System
    Handles various Polymarket data formats
    """
    try:
        # Normalize Polymarket Data - try multiple possible field names
        maker_address = (
            trade_data.get('maker_address') or 
            trade_data.get('maker') or
            trade_data.get('user') or 
            trade_data.get('trader') or
            trade_data.get('address') or
            trade_data.get('taker_address') or
            "0x..."
        )
        
        # Calculate size - try multiple formats
        size = float(
            trade_data.get('size') or 
            trade_data.get('amount') or 
            trade_data.get('quantity') or 
            trade_data.get('volume') or
            0
        )
        price = float(
            trade_data.get('price') or 
            trade_data.get('price_per_share') or
            trade_data.get('execution_price') or
            0
        )
        
        # If size_usd is provided directly, use it
        size_usd = float(
            trade_data.get('size_usd') or 
            trade_data.get('amount_usd') or 
            trade_data.get('value') or
            size * price
        )
        
        market_slug = (
            trade_data.get('market') or 
            trade_data.get('market_id') or
            trade_data.get('condition_id') or
            trade_data.get('asset_id') or
            trade_data.get('question_id') or
            'unknown_market'
        )

        # 1. Filter Noise (Small trades)
        if size_usd < 100: # Low threshold for demo, raise to 10000 in prod
            return 

        # 2. Check Age
        age_hours = await get_wallet_age_hours(maker_address)
        
        # 3. Construct Alert Object
        alert_obj = {
            "id": str(time.time()),
            "timestamp": time.time() * 1000, # JS expects ms
            "trader": maker_address,
            "market": market_slug,
            "amount": size_usd,
            "type": trade_data.get('side', 'BUY').upper(),
            "accountAgeHours": age_hours,
            "riskProfile": "normal"
        }

        # 4. Check Heuristics
        if age_hours <= NEW_ACCOUNT_HOURS and size_usd >= SUSPICIOUS_THRESHOLD_USD:
            alert_obj["riskProfile"] = "insider"
            logger.warning(f"INSIDER ALERT: {maker_address} bet ${size_usd}")
            
            # Persist
            await db.execute(
                "INSERT INTO suspicious_trades (wallet_address, amount_usd, wallet_age_hours, market_slug) VALUES (?, ?, ?, ?)",
                (maker_address, size_usd, age_hours, market_slug)
            )
            await db.commit()

        # 5. Broadcast to React Client (Live Feed)
        # We send ALL trades that pass the noise filter to populate the "Live Feed"
        # The frontend decides how to display them (Red highlight vs normal row)
        await manager.broadcast(alert_obj)
            
    except Exception as e:
        logger.error(f"Analysis failed: {e}")

async def polymarket_sentinel():
    """
    Connects to Polymarket WS and ingests trades.
    Uses mock data only if USE_MOCK_DATA is True, otherwise retries real connection.
    """
    
    if USE_MOCK_DATA:
        # Mock data mode
        logger.info("Running in mock data mode - generating simulated trades")
        while True:
            try:
                await asyncio.sleep(random.uniform(0.5, 2.0))
                mock_trade = {
                    "maker_address": f"0x{random.randint(1000,9999)}...{random.randint(1000,9999)}",
                    "size": random.randint(100, 50000),
                    "price": random.random(),
                    "side": "BUY" if random.random() > 0.5 else "SELL",
                    "market": f"Market_{random.randint(1, 10)}"
                }
                await analyze_trade(mock_trade)
            except Exception as e:
                logger.error(f"Mock data generation error: {e}")
                await asyncio.sleep(5)
        return
    
    # Real WebSocket connection mode - retry on failure
    retry_delay = 5
    max_retry_delay = 60
    
    while True:
        try:
            logger.info(f"Attempting to connect to Polymarket WS: {POLYMARKET_WS_URL}")
            # Connect without timeout parameter (it's not supported in older websockets versions)
            async with websockets.connect(
                POLYMARKET_WS_URL, 
                ping_interval=20,
                ping_timeout=10
            ) as ws:
                logger.info(f"✓ Connected to Polymarket WS: {POLYMARKET_WS_URL}")
                retry_delay = 5  # Reset retry delay on successful connection
                
                # Send subscription message based on endpoint type
                if "rtds" in POLYMARKET_WS_URL.lower() or "live-data" in POLYMARKET_WS_URL.lower():
                    # RTDS subscription format
                    subscribe_msg = {
                        "type": "subscribe",
                        "channel": "trades"
                    }
                    logger.info("Subscribing to RTDS trades channel...")
                elif "clob" in POLYMARKET_WS_URL.lower():
                    # CLOB subscription format - subscribe to all markets or specific ones
                    subscribe_msg = {
                        "type": "market",
                        "assets_ids": []  # Empty array subscribes to all, or specify asset IDs
                    }
                    logger.info("Subscribing to CLOB market data...")
                else:
                    # Generic subscription attempt
                    subscribe_msg = {
                        "type": "subscribe",
                        "channel": "trades"
                    }
                    logger.info("Subscribing to trades channel...")
                
                try:
                    await ws.send(json.dumps(subscribe_msg))
                    logger.info(f"Subscription sent: {subscribe_msg}")
                except Exception as e:
                    logger.warning(f"Failed to send subscription message (may not be required): {e}")
                
                while True:
                    try:
                        msg = await asyncio.wait_for(ws.recv(), timeout=30)
                        try:
                            data = json.loads(msg)
                            # Log first few messages to understand structure
                            logger.info(f"Received message: {json.dumps(data)[:200]}")
                            
                            # Try to process as trade data
                            # Polymarket messages might have different structures
                            if isinstance(data, dict):
                                # Check if it's a trade/fill event
                                if data.get('type') in ['fill', 'trade', 'match'] or 'maker_address' in data or 'size' in data:
                                    await analyze_trade(data)
                                elif isinstance(data, list):
                                    # Handle array of trades
                                    for trade in data:
                                        if isinstance(trade, dict):
                                            await analyze_trade(trade)
                                elif data.get('channel') == 'trades' or 'trades' in str(data).lower():
                                    # Extract trade data from nested structure
                                    trades = data.get('data', data.get('payload', [data]))
                                    if isinstance(trades, list):
                                        for trade in trades:
                                            await analyze_trade(trade)
                                    else:
                                        await analyze_trade(trades)
                                else:
                                    # Try to process anyway - might be trade data with different keys
                                    logger.debug(f"Unrecognized message format, attempting to process: {list(data.keys())[:5]}")
                                    await analyze_trade(data)
                            elif isinstance(data, list):
                                # Handle array directly
                                for item in data:
                                    if isinstance(item, dict):
                                        await analyze_trade(item)
                        except json.JSONDecodeError:
                            # Handle non-JSON messages (ping/pong, etc.)
                            logger.debug(f"Received non-JSON message: {str(msg)[:100]}")
                            continue
                    except asyncio.TimeoutError:
                        # Send ping to keep connection alive
                        try:
                            await ws.ping()
                            logger.debug("Sent ping to keep connection alive")
                        except:
                            pass
                        continue
                    except websockets.exceptions.ConnectionClosed:
                        logger.warning("WebSocket connection closed by server")
                        break
                    except Exception as e:
                        logger.error(f"Error processing message: {e}", exc_info=True)
                        continue
                        
        except asyncio.TimeoutError:
            logger.error(f"Connection timeout to {POLYMARKET_WS_URL}. Retrying in {retry_delay}s...")
        except websockets.exceptions.InvalidURI:
            logger.error(f"Invalid WebSocket URI: {POLYMARKET_WS_URL}. Please check the URL.")
            logger.error("Retrying in 30s...")
            await asyncio.sleep(30)
            continue
        except Exception as e:
            logger.error(f"Connection error to {POLYMARKET_WS_URL}: {e}")
            logger.error(f"Retrying in {retry_delay}s...")
        
        await asyncio.sleep(retry_delay)
        retry_delay = min(retry_delay * 1.5, max_retry_delay)  # Exponential backoff

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open, wait for client messages (optional)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/alerts")
async def get_historical_alerts():
    """
    API Endpoint for the frontend to fetch history from SQLite
    """
    cursor = await db.execute("SELECT * FROM suspicious_trades ORDER BY timestamp DESC LIMIT 100")
    rows = await cursor.fetchall()
    # Format for frontend
    formatted = []
    for r in rows:
        formatted.append({
            "id": r[0],
            "trader": r[2],
            "market": r[3],
            "amount": r[4],
            "accountAgeHours": r[5],
            "type": "UNK", # DB schema simplified for demo
            "timestamp": r[6]
        })
    return formatted

if __name__ == "__main__":
    import uvicorn
    # Run on 0.0.0.0 to allow network access if needed
    uvicorn.run(app, host="0.0.0.0", port=8000)