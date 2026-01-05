import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Settings, 
  ShieldAlert, 
  TrendingUp, 
  UserPlus, 
  Pause,
  Play,
  Search,
  Clock,
  Database,
  HardDrive,
  Zap,
  Server,
  Trash2,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceArea
} from 'recharts';

/**
 * POLYMARKET INSIDER DETECTOR - Professional UI
 */

const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
const formatTimeAgo = (hours) => hours < 24 ? `${Math.floor(hours)}h` : `${Math.floor(hours / 24)}d`;

// --- Components ---

const MetricCard = ({ title, value, subvalue, icon: Icon, colorClass, gradientFrom, gradientTo }) => (
  <div className="relative bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:opacity-50 transition-opacity"></div>
    <div className="relative flex items-start justify-between">
      <div className="flex-1">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">{title}</p>
        <h3 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-1">
          {value}
        </h3>
        {subvalue && (
          <p className={`text-xs font-medium mt-2 ${colorClass}`}>{subvalue}</p>
        )}
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} shadow-lg`}>
        <Icon size={24} className="text-white" strokeWidth={2} />
      </div>
    </div>
  </div>
);

const AlertRow = ({ alert }) => (
  <div className="group relative bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border-l-4 border-red-500 dark:border-red-400 p-4 mb-3 rounded-r-xl shadow-sm hover:shadow-md transition-all duration-200">
    <div className="flex justify-between items-start gap-4">
      <div className="flex gap-3 flex-1">
        <div className="mt-0.5">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <ShieldAlert className="text-red-600 dark:text-red-400" size={18} strokeWidth={2} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-red-700 dark:text-red-400 font-semibold text-sm mb-1.5">Suspicious Insider Activity Detected</h4>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            Wallet <span className="font-mono font-semibold text-slate-900 dark:text-white">{alert.trader.substring(0, 8)}...{alert.trader.slice(-6)}</span> created{' '}
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold text-xs">
              {formatTimeAgo(alert.accountAgeHours)} ago
            </span>{' '}
            placed a <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(alert.amount)}</span> bet.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs">
              {alert.market}
            </span>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  </div>
);

const TradeRow = ({ trade, isHighRisk, isCacheHit }) => (
  <div className={`group grid grid-cols-12 gap-4 py-3.5 px-5 border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-150 ${
    isHighRisk ? 'bg-red-50/50 dark:bg-red-950/10' : ''
  }`}>
    <div className="col-span-3 text-sm text-slate-700 dark:text-slate-300 truncate font-medium">
      {trade.market}
    </div>
    <div className="col-span-3 text-sm font-mono text-slate-600 dark:text-slate-400 flex items-center gap-2">
      <span className="truncate">{trade.trader.substring(0, 10)}...</span>
      {isCacheHit && (
        <Zap size={12} className="text-amber-500 dark:text-amber-400 flex-shrink-0" title="Cache Hit" strokeWidth={2.5} />
      )}
    </div>
    <div className="col-span-2 text-sm text-right font-mono font-semibold text-slate-900 dark:text-slate-200">
      {formatCurrency(trade.amount)}
    </div>
    <div className="col-span-2 text-sm text-right">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
        trade.accountAgeHours < 24 
          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' 
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
      }`}>
        {formatTimeAgo(trade.accountAgeHours)}
      </span>
    </div>
    <div className="col-span-2 flex justify-end items-center">
      {isHighRisk && (
        <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
          <AlertTriangle size={14} className="text-red-600 dark:text-red-400" strokeWidth={2.5} />
        </div>
      )}
    </div>
  </div>
);

const SystemStatus = ({ cacheStats, dbSize }) => (
  <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
    <div className="grid grid-cols-2 gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
          <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Zap size={12} className="text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
          </div>
          Redis Cache
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">Live</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-1">
          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 w-3/4 animate-pulse rounded-full"></div>
        </div>
      </div>
      <div className="flex flex-col gap-2 border-l border-slate-200 dark:border-slate-700 pl-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <HardDrive size={12} className="text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
          </div>
          SQLite DB
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{dbSize}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Alerts</span>
        </div>
      </div>
    </div>
  </div>
);

export default function PolymarketDetector() {
  // --- State ---
  const [trades, setTrades] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Settings
  const [minBetSize, setMinBetSize] = useState(10000); 
  const [maxAccountAge, setMaxAccountAge] = useState(24); 
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // --- WebSocket Logic ---
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    console.log("Attempting connection...");
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    ws.onopen = () => {
      setWsStatus('connected');
      console.log("WS Connected");
    };
    
    ws.onclose = () => {
      setWsStatus('disconnected');
      console.log("WS Disconnected, retrying in 3s...");
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = () => {
      setWsStatus('error');
      ws.close();
    };
    
    ws.onmessage = (event) => {
      if (!isPlaying) return;
      
      try {
        const tradeData = JSON.parse(event.data);
        
        const enrichedTrade = { 
          ...tradeData, 
          id: tradeData.id || Math.random().toString(36), 
          riskProfile: tradeData.riskProfile || 'normal',
          timestamp: tradeData.timestamp || Date.now()
        };

        const isSuspicious = (enrichedTrade.accountAgeHours <= maxAccountAge) && (enrichedTrade.amount >= minBetSize);

        setTrades(prev => [enrichedTrade, ...prev].slice(0, 50));
        
        if (isSuspicious || enrichedTrade.riskProfile === 'insider') {
          setAlerts(prev => [enrichedTrade, ...prev].slice(0, 50));
        }
      } catch (e) {
        console.error("Parse error", e);
      }
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    fetch('http://localhost:8000/alerts')
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(d => ({
            ...d, 
            riskProfile: 'insider',
            timestamp: new Date(d.timestamp).getTime() 
        }));
        setAlerts(formatted); 
      })
      .catch(err => console.error("API Error - Backend likely offline", err));

    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  // --- Derived Stats ---
  const suspiciousCount = alerts.length;
  const newAccountVolume = useMemo(() => trades.filter(t => t.accountAgeHours < 24).reduce((acc, t) => acc + t.amount, 0), [trades]);

  const filteredTrades = useMemo(() => {
    if (!searchQuery) return trades;
    const query = searchQuery.toLowerCase();
    return trades.filter(t => 
      t.market.toLowerCase().includes(query) || 
      t.trader.toLowerCase().includes(query)
    );
  }, [trades, searchQuery]);

  const scatterData = trades.map(t => ({
    x: t.accountAgeHours,
    y: t.amount,
    z: 100,
    risk: (t.accountAgeHours <= maxAccountAge && t.amount >= minBetSize) ? 'high' : 'low',
    name: t.trader
  }));

  const clearDb = () => {
    setAlerts([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`relative p-2.5 rounded-xl transition-all duration-300 ${
              wsStatus === 'connected' 
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-200 dark:bg-slate-700'
            }`}>
              <Activity className="text-white relative z-10" size={22} strokeWidth={2.5} />
              {wsStatus === 'connected' && (
                <div className="absolute inset-0 bg-white/30 rounded-xl animate-pulse"></div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                PolyWatch <span className="font-normal text-emerald-600 dark:text-emerald-400">Insider Detector</span>
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                {wsStatus === 'connected' ? (
                  <>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></span>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">LIVE CONNECTED</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">DISCONNECTED</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <Server size={14} className="text-slate-500 dark:text-slate-400" strokeWidth={2} />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Backend:</span>
                <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">localhost:8000</span>
             </div>

            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2.5 rounded-lg border transition-all duration-200 ${
                isPlaying 
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700' 
                  : 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
              }`}
              title={isPlaying ? "Pause Stream" : "Resume Stream"}
            >
              {isPlaying ? <Pause size={18} strokeWidth={2.5} /> : <Play size={18} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </header>

      {/* Connection Warning Banner */}
      {wsStatus !== 'connected' && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border-b border-red-200 dark:border-red-900/50 py-3">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-sm text-red-700 dark:text-red-400 flex items-center justify-center gap-2 font-medium">
              <WifiOff size={16} strokeWidth={2.5} />
              Connection lost. Ensure backend is running on <span className="font-mono font-semibold">ws://localhost:8000/ws</span>
            </p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Stats & Settings */}
        <div className="space-y-6">
          
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard 
              title="Suspicious Acts" 
              value={suspiciousCount} 
              subvalue="Active Alerts"
              icon={AlertTriangle} 
              colorClass="text-red-600 dark:text-red-400"
              gradientFrom="from-red-500"
              gradientTo="to-red-600"
            />
            <MetricCard 
              title="New Acct Vol" 
              value={formatCurrency(newAccountVolume)} 
              subvalue="< 24h old wallets"
              icon={UserPlus} 
              colorClass="text-amber-600 dark:text-amber-400"
              gradientFrom="from-amber-500"
              gradientTo="to-amber-600"
            />
          </div>

          <SystemStatus cacheStats={{}} dbSize={alerts.length} />

          {/* Configuration Panel */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Settings size={18} className="text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Detection Sensitivity</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Min Bet Threshold</label>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                    {formatCurrency(minBetSize)}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1000" 
                  max="50000" 
                  step="1000" 
                  value={minBetSize} 
                  onChange={(e) => setMinBetSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Max Account Age</label>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                    {maxAccountAge} Hours
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="168" 
                  step="1" 
                  value={maxAccountAge} 
                  onChange={(e) => setMaxAccountAge(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Visualizer Chart */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm h-80 flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp size={18} className="text-purple-600 dark:text-purple-400" strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Danger Zone Analysis</h3>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Age" 
                    unit="h" 
                    domain={[0, 72]} 
                    tick={{fill: '#64748b', fontSize: 11, fontWeight: 500}}
                    label={{ value: 'Account Age (Hours)', position: 'insideBottom', offset: -5, fill: '#475569', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Amount" 
                    unit="$" 
                    domain={[0, 'auto']} 
                    tick={{fill: '#64748b', fontSize: 11, fontWeight: 500}}
                    tickFormatter={(value) => `$${value/1000}k`}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-lg text-xs">
                            <p className="text-slate-900 dark:text-white font-bold mb-2">{payload[0].payload.name}</p>
                            <p className="text-slate-600 dark:text-slate-400 mb-1">Age: <span className="font-semibold">{payload[0].value}h</span></p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-semibold">Bet: {formatCurrency(payload[1].value)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceArea x1={0} x2={maxAccountAge} y1={minBetSize} y2={200000} fill="rgba(239, 68, 68, 0.1)" stroke="none" />
                  
                  <Scatter name="Trades" data={scatterData} fill="#8884d8">
                    {scatterData.map((entry, index) => (
                      <cell key={`cell-${index}`} fill={entry.risk === 'high' ? '#ef4444' : '#6366f1'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Middle & Right: Feeds */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Alerts Section */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-red-200 dark:border-red-900/50 overflow-hidden shadow-sm">
             <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 px-6 py-4 border-b border-red-200 dark:border-red-900/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Database size={18} className="text-red-600 dark:text-red-400" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Persisted Alerts</h3>
                </div>
                <button 
                  onClick={clearDb} 
                  className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 size={14} strokeWidth={2.5} />
                  Clear View
                </button>
             </div>
             <div className="p-6 max-h-64 overflow-y-auto">
               {alerts.length === 0 ? (
                 <div className="text-center py-8">
                   <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full w-fit mx-auto mb-3">
                     <ShieldAlert className="text-slate-400 mx-auto" size={24} strokeWidth={1.5} />
                   </div>
                   <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No suspicious activity recorded</p>
                 </div>
               ) : (
                 alerts.map((alert, i) => (
                   <AlertRow key={alert.id + i} alert={alert} />
                 ))
               )}
             </div>
          </div>

          {/* Main Trade Feed */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-[600px]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Clock size={18} className="text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Market Feed</h3>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" strokeWidth={2} />
                <input 
                  type="text" 
                  placeholder="Filter by Market or Wallet..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-300 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-slate-100/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
              <div className="col-span-3">Market</div>
              <div className="col-span-3">Trader ID</div>
              <div className="col-span-2 text-right">Size (USDC)</div>
              <div className="col-span-2 text-right">Acct Age</div>
              <div className="col-span-2"></div>
            </div>

            {/* Scrolling List */}
            <div className="flex-1 overflow-y-auto">
              {filteredTrades.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400 flex-col gap-3 py-12">
                  {wsStatus === 'connected' ? (
                     <>
                        <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                          <RefreshCw className="animate-spin text-blue-600 dark:text-blue-400" size={24} strokeWidth={2} />
                        </div>
                        <p className="text-sm font-medium">Listening for trades...</p>
                     </>
                  ) : (
                    <>
                       <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                         <WifiOff className="text-red-600 dark:text-red-400" size={24} strokeWidth={2} />
                       </div>
                       <p className="text-sm font-medium">Waiting for connection...</p>
                    </>
                  )}
                </div>
              ) : (
                filteredTrades.map((trade) => (
                  <TradeRow 
                    key={trade.id} 
                    trade={trade} 
                    isHighRisk={trade.riskProfile === 'insider' || (trade.accountAgeHours <= maxAccountAge && trade.amount >= minBetSize)}
                    isCacheHit={trade.isCacheHit}
                  />
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Displaying {filteredTrades.length} of {trades.length} transactions
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                 <span className="flex items-center gap-1.5">
                   <Zap size={12} className="text-amber-500" strokeWidth={2.5} />
                   Cache Hit
                 </span>
                 <span className="flex items-center gap-1.5">
                   <AlertTriangle size={12} className="text-red-500" strokeWidth={2.5} />
                   Insider
                 </span>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
