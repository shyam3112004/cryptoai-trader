import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const getCurrencySymbol = (sym) => {
  if (!sym) return '₹'
  const upper = sym.toUpperCase()
  if (upper.includes('USDT') || upper.includes('BTC') || upper.includes('ETH') || upper.includes('SOL') || upper.includes('ADA') || upper.includes('USD')) {
    return '$'
  }
  return '₹'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, token, logout, setMode, updateUser } = useAuthStore()
  
  const [activeMode, setActiveMode] = useState(user?.mode || 'demo')
  const [currentTab, setCurrentTab] = useState('dashboard') // dashboard, algorithms, history, signals
  const [profitTarget, setProfitTarget] = useState(() => {
    const saved = localStorage.getItem('profitTarget')
    return saved ? saved : '1.5X'
  })
  const [timeframe, setTimeframe] = useState('15m')
  const [autoTrade, setAutoTrade] = useState(true)
  const [isMarketClosed, setIsMarketClosed] = useState(false)
  
  const isStockMarketOpenFrontend = () => {
    try {
      const now = new Date()
      const options = { timeZone: 'Asia/Kolkata', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }
      const formatter = new Intl.DateTimeFormat('en-US', options)
      const parts = formatter.formatToParts(now)
      const partMap = {}
      parts.forEach(p => partMap[p.type] = p.value)

      const weekday = partMap.weekday
      if (weekday === 'Sat' || weekday === 'Sun') return false

      const hours = parseInt(partMap.hour, 10)
      const minutes = parseInt(partMap.minute, 10)
      const timeVal = hours * 60 + minutes
      return timeVal >= (9 * 60 + 15) && timeVal <= (15 * 60 + 30)
    } catch (e) {
      return false
    }
  }

  const [realizedBalance, setRealizedBalance] = useState(() => {
    const saved = localStorage.getItem('realizedBalance')
    return saved ? parseFloat(saved) : 10000.00
  })
  const [realizedTodayPnl, setRealizedTodayPnl] = useState(() => {
    const saved = localStorage.getItem('realizedTodayPnl')
    return saved ? parseFloat(saved) : 241.79
  })
  
  const [realAccountBalance, setRealAccountBalance] = useState(() => {
    const saved = localStorage.getItem('realAccountBalance')
    return saved ? parseFloat(saved) : 10000.00
  })
  const [realAccountPnl, setRealAccountPnl] = useState(() => {
    const saved = localStorage.getItem('realAccountPnl')
    return saved ? parseFloat(saved) : 0.00
  })

  const [balance, setBalance] = useState(realizedBalance)
  const [todayPnl, setTodayPnl] = useState(realizedTodayPnl)
  
  const [tradeInvestmentUSD, setTradeInvestmentUSD] = useState(() => {
    const saved = localStorage.getItem('tradeInvestmentUSD')
    return saved ? parseFloat(saved) : 100.00
  })
  const [tradeInvestmentINR, setTradeInvestmentINR] = useState(() => {
    const saved = localStorage.getItem('tradeInvestmentINR')
    return saved ? parseFloat(saved) : 1000.00
  })
  const [autoTradeMode, setAutoTradeMode] = useState(() => {
    const saved = localStorage.getItem('autoTradeMode')
    return saved ? saved : 'single'
  })

  const [enabledAutoTradeMarkets, setEnabledAutoTradeMarkets] = useState(() => {
    try {
      const saved = localStorage.getItem('enabledAutoTradeMarkets')
      return saved ? JSON.parse(saved) : ['NIFTY 50', 'SENSEX', 'RELIANCE', 'TCS', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'AAPL', 'MSFT', 'TSLA', 'NVDA']
    } catch (e) {
      return ['NIFTY 50', 'SENSEX', 'RELIANCE', 'TCS', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'AAPL', 'MSFT', 'TSLA', 'NVDA']
    }
  })

  const [brokerGateway, setBrokerGateway] = useState(() => localStorage.getItem('brokerGateway') || 'Angel One SmartAPI (100% FREE Lifetime Access)')
  const [brokerApiKey, setBrokerApiKey] = useState(() => localStorage.getItem('brokerApiKey') || 'FREE_SMARTAPI_LIVE_KEY_9482')
  const [brokerApiSecret, setBrokerApiSecret] = useState(() => localStorage.getItem('brokerApiSecret') || 'FREE_SMARTAPI_SECRET_7710')

  // Alerts Settings parameters
  const [enableWhatsapp, setEnableWhatsapp] = useState(() => {
    const val = localStorage.getItem('enableWhatsapp')
    return val !== null ? val === 'true' : false
  })
  const [whatsappNumber, setWhatsappNumber] = useState(() => {
    return user?.whatsapp || localStorage.getItem('whatsappNumber') || ''
  })
  const [callmebotApikey, setCallmebotApikey] = useState(() => {
    return user?.callmebot_apikey || localStorage.getItem('callmebotApikey') || ''
  })
  
  const [enableTelegram, setEnableTelegram] = useState(() => {
    const val = localStorage.getItem('enableTelegram')
    return val !== null ? val === 'true' : false
  })
  const [telegramBotToken, setTelegramBotToken] = useState(() => {
    return user?.telegram_bot_token || localStorage.getItem('telegramBotToken') || ''
  })
  const [telegramChatId, setTelegramChatId] = useState(() => {
    return user?.telegram_chat_id || localStorage.getItem('telegramChatId') || ''
  })

  // Custom Settings parameters
  const [maxOpenPositions, setMaxOpenPositions] = useState(() => {
    const val = localStorage.getItem('maxOpenPositions')
    return val !== null ? parseInt(val) : 3
  })
  const [stopLossLimit, setStopLossLimit] = useState(() => {
    const val = localStorage.getItem('stopLossLimit')
    return val !== null ? parseFloat(val) : 2.0
  })
  const [tradePacing, setTradePacing] = useState(() => {
    const val = localStorage.getItem('tradePacing')
    return val !== null ? val : 'rapid'
  })

  // Chart, symbol selection & emergency stop states
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT')
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState(false)
  const [isEmergencyStopped, setIsEmergencyStopped] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(40)
  const [panOffset, setPanOffset] = useState(0)
  const [hoveredCandleData, setHoveredCandleData] = useState(null)
  const [chartMarkers, setChartMarkers] = useState([])
  const [chartData, setChartData] = useState([])
  const [symbolSearchTerm, setSymbolSearchTerm] = useState('')
  const [customSymbolInput, setCustomSymbolInput] = useState('')

  // Settings & notification states
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true)
  const [enableDesktopNotifications, setEnableDesktopNotifications] = useState(() => {
    const val = localStorage.getItem('enableDesktopNotifications')
    return val !== null ? val === 'true' : true
  })
  const [testNotifStatus, setTestNotifStatus] = useState('')

  // Dynamic currency helpers
  const isCryptoActive = getCurrencySymbol(selectedSymbol) === '$'
  const tradeInvestment = isCryptoActive ? tradeInvestmentUSD : tradeInvestmentINR
  const setTradeInvestment = (val) => {
    if (isCryptoActive) {
      setTradeInvestmentUSD(val)
    } else {
      setTradeInvestmentINR(val)
    }
  }

  const realizedBalanceRef = useRef(realizedBalance)
  const realizedTodayPnlRef = useRef(realizedTodayPnl)
  const realAccountBalanceRef = useRef(realAccountBalance)
  const realAccountPnlRef = useRef(realAccountPnl)
  const activeModeRef = useRef(activeMode)

  const tradeInvestmentRef = useRef(null)
  const autoTradeModeRef = useRef(autoTradeMode)
  const enabledAutoTradeMarketsRef = useRef(enabledAutoTradeMarkets)
  const profitTargetRef = useRef(profitTarget)
  const maxOpenPositionsRef = useRef(maxOpenPositions)
  const stopLossLimitRef = useRef(stopLossLimit)
  const tradePacingRef = useRef(tradePacing)
  const autoTradeRef = useRef(autoTrade)

  useEffect(() => {
    localStorage.setItem('maxOpenPositions', maxOpenPositions)
    maxOpenPositionsRef.current = maxOpenPositions
  }, [maxOpenPositions])

  useEffect(() => {
    localStorage.setItem('stopLossLimit', stopLossLimit)
    stopLossLimitRef.current = stopLossLimit
  }, [stopLossLimit])

  useEffect(() => {
    localStorage.setItem('tradePacing', tradePacing)
    tradePacingRef.current = tradePacing
  }, [tradePacing])

  useEffect(() => {
    localStorage.setItem('enableWhatsapp', enableWhatsapp)
  }, [enableWhatsapp])

  useEffect(() => {
    localStorage.setItem('whatsappNumber', whatsappNumber)
  }, [whatsappNumber])

  useEffect(() => {
    localStorage.setItem('callmebotApikey', callmebotApikey)
  }, [callmebotApikey])

  useEffect(() => {
    localStorage.setItem('enableTelegram', enableTelegram)
  }, [enableTelegram])

  useEffect(() => {
    localStorage.setItem('telegramBotToken', telegramBotToken)
  }, [telegramBotToken])

  useEffect(() => {
    localStorage.setItem('telegramChatId', telegramChatId)
  }, [telegramChatId])

  useEffect(() => {
    activeModeRef.current = activeMode
  }, [activeMode])

  useEffect(() => {
    localStorage.setItem('realAccountBalance', realAccountBalance)
    realAccountBalanceRef.current = realAccountBalance
  }, [realAccountBalance])

  useEffect(() => {
    localStorage.setItem('realAccountPnl', realAccountPnl)
    realAccountPnlRef.current = realAccountPnl
  }, [realAccountPnl])

  useEffect(() => {
    localStorage.setItem('profitTarget', profitTarget)
    profitTargetRef.current = profitTarget
  }, [profitTarget])

  useEffect(() => {
    localStorage.setItem('enabledAutoTradeMarkets', JSON.stringify(enabledAutoTradeMarkets))
    enabledAutoTradeMarketsRef.current = enabledAutoTradeMarkets
  }, [enabledAutoTradeMarkets])

  useEffect(() => {
    localStorage.setItem('realizedBalance', realizedBalance)
    realizedBalanceRef.current = realizedBalance
  }, [realizedBalance])
  
  useEffect(() => {
    localStorage.setItem('realizedTodayPnl', realizedTodayPnl)
    realizedTodayPnlRef.current = realizedTodayPnl
  }, [realizedTodayPnl])

  useEffect(() => {
    localStorage.setItem('tradeInvestmentUSD', tradeInvestmentUSD)
  }, [tradeInvestmentUSD])

  useEffect(() => {
    localStorage.setItem('tradeInvestmentINR', tradeInvestmentINR)
  }, [tradeInvestmentINR])

  useEffect(() => {
    const isCrypto = getCurrencySymbol(selectedSymbol) === '$'
    tradeInvestmentRef.current = isCrypto ? tradeInvestmentUSD : tradeInvestmentINR
  }, [selectedSymbol, tradeInvestmentUSD, tradeInvestmentINR])

  useEffect(() => {
    localStorage.setItem('autoTradeMode', autoTradeMode)
    autoTradeModeRef.current = autoTradeMode
  }, [autoTradeMode])

  const [isPriceFlashing, setIsPriceFlashing] = useState(false)
  const [redFlash, setRedFlash] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    autoTradeRef.current = autoTrade
  }, [autoTrade])

  useEffect(() => {
    localStorage.setItem('enableDesktopNotifications', enableDesktopNotifications)
    if (enableDesktopNotifications && typeof window !== 'undefined' && 'Notification' in window && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        Notification.requestPermission()
      } catch (e) {
        // Ignored on unsupported mobile browsers
      }
    }
  }, [enableDesktopNotifications])

  // Notification Feed
  const [notifications, setNotifications] = useState([
    { id: 1, title: '🟢 BTC/USDT Buy Executed', desc: 'AI confidence 87%. Executed at $64,231.20.', time: 'Just now' },
    { id: 2, title: '🎯 SOL Target Hit', desc: '1.5x profit target hit. Sold for +$412.80.', time: '3 hours ago' },
    { id: 3, title: '⚠️ Stop Loss Triggered', desc: 'ETH/USDT stop loss hit at $3,450.12 (-2%).', time: '6 hours ago' }
  ])

  // Refs for click outside, WebSockets, and Canvas hover tracking
  const notificationsRef = useRef(null)
  const settingsRef = useRef(null)
  const mobileSettingsRef = useRef(null)
  const symbolDropdownRef = useRef(null)
  const wsRef = useRef(null)
  const mouseRef = useRef(null)
  const dragStartRef = useRef(null)
  const costBasisRef = useRef(null)
  const selectedSymbolRef = useRef(selectedSymbol)
  const cooldownRef = useRef(0)

  // Algorithm retraining simulation state
  const [isRetraining, setIsRetraining] = useState(false)
  const [retrainProgress, setRetrainProgress] = useState(0)

  // Execution Log (Dashboard view)
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('tradeLogs')
      return saved ? JSON.parse(saved) : [
        { id: 1, time: '14:22:01', action: 'BUY BTC', qty: '0.45 @ $64,231.20', pnl: '+$245.00', type: 'buy', progress: 74 },
        { id: 2, time: '14:18:45', action: 'SELL ETH', qty: '4.20 @ $3,450.12', pnl: '-$12.40', type: 'sell', progress: 42 }
      ]
    } catch (e) {
      return [
        { id: 1, time: '14:22:01', action: 'BUY BTC', qty: '0.45 @ $64,231.20', pnl: '+$245.00', type: 'buy', progress: 74 },
        { id: 2, time: '14:18:45', action: 'SELL ETH', qty: '4.20 @ $3,450.12', pnl: '-$12.40', type: 'sell', progress: 42 }
      ]
    }
  })

  // Historical Trade Data
  const [tradeHistory, setTradeHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('tradeHistory')
      return saved ? JSON.parse(saved) : [
        { id: 1, date: '2026-06-27 14:22:01', pair: 'BTC / USDT', type: 'LONG', leverage: '10X', profit: '+$245.00', returnPct: '+2.45%', status: 'TARGET HIT' },
        { id: 2, date: '2026-06-27 14:18:45', pair: 'ETH / USDT', type: 'SHORT', leverage: '10X', profit: '-$12.40', returnPct: '-0.36%', status: 'STOP LOSS' },
        { id: 3, date: '2026-06-27 11:05:12', pair: 'SOL / USDT', type: 'LONG', leverage: '5X', profit: '+$412.80', returnPct: '+8.25%', status: 'TARGET HIT' },
        { id: 4, date: '2026-06-26 18:32:00', pair: 'ADA / USDT', type: 'LONG', leverage: '10X', profit: '-$45.00', returnPct: '-2.00%', status: 'STOP LOSS' },
        { id: 5, date: '2026-06-26 09:14:22', pair: 'BTC / USDT', type: 'LONG', leverage: '10X', profit: '+$890.00', returnPct: '+5.00%', status: 'MANUAL CLOSE' }
      ]
    } catch (e) {
      return [
        { id: 1, date: '2026-06-27 14:22:01', pair: 'BTC / USDT', type: 'LONG', leverage: '10X', profit: '+$245.00', returnPct: '+2.45%', status: 'TARGET HIT' },
        { id: 2, date: '2026-06-27 14:18:45', pair: 'ETH / USDT', type: 'SHORT', leverage: '10X', profit: '-$12.40', returnPct: '-0.36%', status: 'STOP LOSS' },
        { id: 3, date: '2026-06-27 11:05:12', pair: 'SOL / USDT', type: 'LONG', leverage: '5X', profit: '+$412.80', returnPct: '+8.25%', status: 'TARGET HIT' },
        { id: 4, date: '2026-06-26 18:32:00', pair: 'ADA / USDT', type: 'LONG', leverage: '10X', profit: '-$45.00', returnPct: '-2.00%', status: 'STOP LOSS' },
        { id: 5, date: '2026-06-26 09:14:22', pair: 'BTC / USDT', type: 'LONG', leverage: '10X', profit: '+$890.00', returnPct: '+5.00%', status: 'MANUAL CLOSE' }
      ]
    }
  })

  const [historyPage, setHistoryPage] = useState(1)

  useEffect(() => {
    localStorage.setItem('tradeLogs', JSON.stringify(logs))
  }, [logs])

  useEffect(() => {
    localStorage.setItem('tradeHistory', JSON.stringify(tradeHistory))
  }, [tradeHistory])

  // Algo model health values
  const [algoMetrics, setAlgoMetrics] = useState([
    { name: 'LSTM (Recurrent Neural Net)', val: 89.2, currentWidth: 0, status: 'ACTIVE', weight: '25%' },
    { name: 'XGBoost Ensemble', val: 84.5, currentWidth: 0, status: 'ACTIVE', weight: '20%' },
    { name: 'Transformer Attention', val: 79.1, currentWidth: 0, status: 'ACTIVE', weight: '20%' },
    { name: 'Sentiment Analyzer', val: 62.8, currentWidth: 0, status: 'STANDBY', weight: '15%' },
    { name: 'Monte Carlo Simulations', val: 91.0, currentWidth: 0, status: 'ACTIVE', weight: '20%' }
  ])

  // Canvas ref for real-time scrolling chart
  const canvasRef = useRef(null)
  const chartDataRef = useRef([])
  const hasRealDataRef = useRef(false)  // true when real Yahoo Finance data is loaded

  const getSymbolConfig = (symbol) => {
    const s = (symbol || '').toString().toUpperCase()
    if (s.includes('NIFTY')) return { basePrice: 24052.95, mult: 8 }
    if (s.includes('SENSEX')) return { basePrice: 77100.47, mult: 50 }
    if (s.includes('RELIANCE')) return { basePrice: 1532.40, mult: 3 }
    if (s.includes('TCS')) return { basePrice: 3820.50, mult: 8 }
    if (s.includes('INFY')) return { basePrice: 1530.0, mult: 4 }
    if (s.includes('HDFCBANK')) return { basePrice: 1610.0, mult: 4 }
    if (s.includes('ICICIBANK')) return { basePrice: 1120.0, mult: 3 }
    if (s.includes('SBIN')) return { basePrice: 840.0, mult: 2 }
    if (s.includes('TATAMOTORS')) return { basePrice: 960.0, mult: 3 }
    if (s.includes('WIPRO')) return { basePrice: 480.0, mult: 1.5 }
    
    if (s.includes('BTC')) return { basePrice: 60189.99, mult: 150 }
    if (s.includes('ETH')) return { basePrice: 3450.0, mult: 15 }
    if (s.includes('SOL')) return { basePrice: 145.0, mult: 1.5 }
    if (s.includes('BNB')) return { basePrice: 580.0, mult: 3 }
    if (s.includes('AVAX')) return { basePrice: 35.0, mult: 0.3 }
    if (s.includes('LTC')) return { basePrice: 75.0, mult: 0.5 }
    
    if (s.includes('AAPL')) return { basePrice: 182.50, mult: 1.5 }
    if (s.includes('TSLA')) return { basePrice: 178.20, mult: 2.0 }
    if (s.includes('NVDA')) return { basePrice: 125.40, mult: 1.5 }
    if (s.includes('MSFT')) return { basePrice: 415.50, mult: 3.0 }
    
    return { basePrice: 24052.95, mult: 8 }
  }

  // Setup initial chart data - fetches REAL live data from Yahoo Finance via backend proxy
  const generateChartData = async (tf, symbol = selectedSymbol) => {
    setChartMarkers([])
    hasRealDataRef.current = false  // reset until we confirm

    try {
      const resp = await fetch(`/api/v1/signals/chart-data?symbol=${encodeURIComponent(symbol)}&timeframe=${tf}`)
      const data = await resp.json()

      if (data.candles && data.candles.length > 0) {
        const liveCandles = data.candles.map((c, i) => ({
          open: c.open,
          close: c.close,
          high: c.high,
          low: c.low,
          vol: c.vol || 0,
          time: i,
          timestamp: new Date(c.timestamp),
        }))
        chartDataRef.current = liveCandles
        hasRealDataRef.current = true  // REAL data loaded — don't let fallback overwrite it
        if (liveCandles.length > 0) {
          setHoveredCandleData(liveCandles[liveCandles.length - 1])
        }
        setChartData([...liveCandles])
        console.log(`Loaded ${liveCandles.length} REAL candles for ${symbol} from Yahoo Finance (${data.symbol})`)
        return
      }
    } catch (e) {
      console.warn('Failed to fetch live chart data, falling back to simulation:', e)
    }

    // Fallback: generate simulated data if Yahoo Finance is unavailable
    const config = getSymbolConfig(symbol)
    const multiplier = tf === '1d' ? config.mult * 3 : tf === '4h' ? config.mult * 2 : config.mult
    const targetClose = config.basePrice
    const points = 120
    const rawCandles = []
    const intervalMs = tf === '1d' ? 86400000 : tf === '4h' ? 14400000 : tf === '1h' ? 3600000 : 900000
    let currTime = new Date()
    let currentPrice = targetClose
    let trend = 1

    for (let i = 0; i < points; i++) {
      if (Math.random() < 0.30) trend = -trend
      const delta = (trend * 0.35 + (Math.random() - 0.5) * 0.5) * multiplier
      const close = currentPrice
      const open = close - delta
      const high = Math.max(open, close) + Math.random() * (multiplier * 0.25)
      const low = Math.min(open, close) - Math.random() * (multiplier * 0.25)
      const vol = Math.floor(Math.random() * 500 + 50)
      rawCandles.unshift({ open, close, high, low, vol, timestamp: new Date(currTime) })
      currentPrice = open
      currTime = new Date(currTime.getTime() - intervalMs)
    }

    rawCandles.forEach((d, i) => d.time = i)
    chartDataRef.current = rawCandles
    if (rawCandles.length > 0) {
      setHoveredCandleData(rawCandles[rawCandles.length - 1])
    }
  }

  const fetchSettingsFromBackend = async () => {
    try {
      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : window.location.origin
      const res = await fetch(`${apiBase}/api/v1/auth/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.broker_gateway) setBrokerGateway(data.broker_gateway)
        if (data.broker_api_key) setBrokerApiKey(data.broker_api_key)
        if (data.broker_api_secret) setBrokerApiSecret(data.broker_api_secret)
        if (data.max_open_positions) setMaxOpenPositions(data.max_open_positions)
        if (data.stop_loss_limit) setStopLossLimit(data.stop_loss_limit)
        if (data.profit_target) setProfitTarget(data.profit_target)
        if (data.trade_pacing) setTradePacing(data.trade_pacing)
        
        // Toggles
        setEnableWhatsapp(data.enable_whatsapp)
        setEnableTelegram(data.enable_telegram)
        
        // Credentials / Details
        if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number)
        if (data.callmebot_apikey) setCallmebotApikey(data.callmebot_apikey)
        if (data.telegram_bot_token) setTelegramBotToken(data.telegram_bot_token)
        if (data.telegram_chat_id) setTelegramChatId(data.telegram_chat_id)
        
        // Update user store state as well
        updateUser({
          whatsapp: data.whatsapp_number || '',
          callmebot_apikey: data.callmebot_apikey || '',
          telegram_bot_token: data.telegram_bot_token || '',
          telegram_chat_id: data.telegram_chat_id || ''
        })
      }
    } catch (e) {
      console.error('Failed to fetch settings from backend:', e)
    }
  }

  useEffect(() => {
    setIsMounted(true)
    generateChartData(timeframe, selectedSymbol)
    fetchSettingsFromBackend()

    // Trigger stagger render for progress bars
    const timers = algoMetrics.map((item, idx) => {
      return setTimeout(() => {
        setAlgoMetrics(prev => prev.map((val, i) => i === idx ? { ...val, currentWidth: val.val } : val))
      }, 500 + idx * 100)
    })

    // Click outside listener for notifications and settings dropdowns
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false)
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target) && (!mobileSettingsRef.current || !mobileSettingsRef.current.contains(event.target))) {
        setIsSettingsOpen(false)
      }
      if (symbolDropdownRef.current && !symbolDropdownRef.current.contains(event.target)) {
        setIsSymbolDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      timers.forEach(clearTimeout)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Regenerate chart when timeframe or symbol shifts
  useEffect(() => {
    selectedSymbolRef.current = selectedSymbol
    generateChartData(timeframe, selectedSymbol)
  }, [timeframe, selectedSymbol])

  // Canvas drawing loop — Professional TradingView-style chart
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId

    // Layout constants (right margin for price axis, bottom for time axis)
    const PRICE_AXIS_W = 75
    const TIME_AXIS_H = 28
    const VOLUME_H_RATIO = 0.18 // volume region is 18% of chart height
    const TOP_PAD = 8

    const render = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      const W = rect.width
      const H = rect.height

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#080C18'
      ctx.fillRect(0, 0, W, H)

      const data = chartDataRef.current
      if (data.length === 0) return

      // Visible data slice
      const visibleData = data.slice(
        Math.max(0, data.length - zoomLevel - panOffset),
        Math.max(1, data.length - panOffset)
      )
      if (visibleData.length === 0) return

      // Layout regions
      const chartW = W - PRICE_AXIS_W
      const chartH = H - TIME_AXIS_H - TOP_PAD
      const volumeH = chartH * VOLUME_H_RATIO
      const candleH = chartH - volumeH

      // Price extremes
      const allHigh = visibleData.map(d => d.high)
      const allLow = visibleData.map(d => d.low)
      const rawMin = Math.min(...allLow)
      const rawMax = Math.max(...allHigh)
      const pricePad = (rawMax - rawMin) * 0.05 || 1
      const minP = rawMin - pricePad
      const maxP = rawMax + pricePad
      const priceRange = maxP - minP

      // Volume extremes
      const maxVol = Math.max(...visibleData.map(d => d.vol || 1), 1)

      // Scaling helpers
      const scaleY = (price) => TOP_PAD + candleH - ((price - minP) / priceRange) * candleH
      const scaleVolY = (vol) => H - TIME_AXIS_H - (vol / maxVol) * volumeH

      const candleSpacing = chartW / visibleData.length
      const candleBodyW = Math.max(1, candleSpacing * 0.65)
      const candleGap = (candleSpacing - candleBodyW) / 2

      // ─── Grid Lines ───
      const gridLines = 6
      ctx.strokeStyle = '#131B2E'
      ctx.lineWidth = 1
      for (let i = 0; i <= gridLines; i++) {
        const y = TOP_PAD + (candleH / gridLines) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(chartW, y)
        ctx.stroke()
      }
      // Vertical grid lines (every ~5 candles)
      const vGridStep = Math.max(1, Math.ceil(visibleData.length / 8))
      for (let i = 0; i < visibleData.length; i += vGridStep) {
        const x = candleSpacing * i + candleSpacing / 2
        ctx.beginPath()
        ctx.moveTo(x, TOP_PAD)
        ctx.lineTo(x, TOP_PAD + candleH)
        ctx.stroke()
      }

      // ─── Volume Bars ───
      visibleData.forEach((candle, idx) => {
        const x = candleSpacing * idx + candleGap
        const isUp = candle.close >= candle.open
        const volH = (candle.vol || 0) / maxVol * volumeH
        ctx.fillStyle = isUp ? 'rgba(0, 230, 118, 0.18)' : 'rgba(255, 61, 87, 0.18)'
        ctx.fillRect(x, H - TIME_AXIS_H - volH, candleBodyW, volH)
      })

      // Volume label
      ctx.fillStyle = '#334155'
      ctx.font = '9px monospace'
      ctx.textAlign = 'left'
      ctx.fillText('Volume', 4, H - TIME_AXIS_H - volumeH + 10)

      // ─── Candlestick Bodies + Wicks ───
      visibleData.forEach((candle, idx) => {
        const x = candleSpacing * idx + candleGap
        const xCenter = x + candleBodyW / 2
        const isUp = candle.close >= candle.open
        const color = isUp ? '#00E676' : '#FF3D57'

        // Wick
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(xCenter, scaleY(candle.high))
        ctx.lineTo(xCenter, scaleY(candle.low))
        ctx.stroke()

        // Body
        const bodyTop = scaleY(Math.max(candle.open, candle.close))
        const bodyBot = scaleY(Math.min(candle.open, candle.close))
        const bodyH = Math.max(1, bodyBot - bodyTop)
        ctx.fillStyle = isUp ? '#00E676' : '#FF3D57'
        ctx.globalAlpha = isUp ? 0.15 : 0.15
        ctx.fillRect(x, bodyTop, candleBodyW, bodyH)
        ctx.globalAlpha = 1
        ctx.strokeStyle = color
        ctx.lineWidth = 1.2
      })

      // ─── Draw Auto Trade Markers ───
      chartMarkers.forEach(marker => {
        const idx = visibleData.findIndex(d => d.time === marker.time)
        if (idx !== -1) {
          const x = candleSpacing * idx + candleGap + candleBodyW / 2
          const y = scaleY(marker.price)
          const isBuy = marker.type === 'buy'

          ctx.fillStyle = isBuy ? '#00E676' : '#FF3D57'
          ctx.beginPath()
          if (isBuy) {
            ctx.moveTo(x, y + 10)
            ctx.lineTo(x - 5, y + 18)
            ctx.lineTo(x + 5, y + 18)
          } else {
            ctx.moveTo(x, y - 10)
            ctx.lineTo(x - 5, y - 18)
            ctx.lineTo(x + 5, y - 18)
          }
          ctx.closePath()
          ctx.fill()

          ctx.fillStyle = '#E2E8F0'
          ctx.font = 'bold 8px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(marker.label === 'BUY' ? 'B' : 'S', x, isBuy ? y + 26 : y - 22)
        }
      })

      // ─── Price Axis (right side) ───
      ctx.fillStyle = '#0D1322'
      ctx.fillRect(chartW, 0, PRICE_AXIS_W, H)
      ctx.strokeStyle = '#1E2D4A'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(chartW, 0)
      ctx.lineTo(chartW, H)
      ctx.stroke()

      // Price labels on right axis
      ctx.fillStyle = '#64748B'
      ctx.font = '10px monospace'
      ctx.textAlign = 'left'
      for (let i = 0; i <= gridLines; i++) {
        const y = TOP_PAD + (candleH / gridLines) * i
        const price = maxP - (priceRange / gridLines) * i
        ctx.fillText(price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), chartW + 6, y + 3)
      }

      // ─── Current Price Horizontal Line + Label ───
      const lastCandle = visibleData[visibleData.length - 1]
      if (lastCandle) {
        const curY = scaleY(lastCandle.close)
        const isUp = lastCandle.close >= lastCandle.open
        const lineColor = isUp ? '#00E676' : '#FF3D57'

        // Dashed price line across chart
        ctx.strokeStyle = lineColor
        ctx.lineWidth = 1
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.moveTo(0, curY)
        ctx.lineTo(chartW, curY)
        ctx.stroke()
        ctx.setLineDash([])

        // Price label box on right axis
        const labelH = 18
        ctx.fillStyle = lineColor
        ctx.beginPath()
        // Small arrow triangle pointing left
        ctx.moveTo(chartW, curY - labelH / 2)
        ctx.lineTo(chartW + 6, curY - labelH / 2)
        ctx.lineTo(chartW + 6, curY + labelH / 2)
        ctx.lineTo(chartW, curY + labelH / 2)
        ctx.closePath()
        ctx.fill()
        ctx.fillRect(chartW + 5, curY - labelH / 2, PRICE_AXIS_W - 8, labelH)
        ctx.fillStyle = '#000'
        ctx.font = 'bold 10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(lastCandle.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), chartW + PRICE_AXIS_W / 2 + 2, curY + 4)
      }

      // ─── Time Axis (bottom) ───
      ctx.fillStyle = '#0D1322'
      ctx.fillRect(0, H - TIME_AXIS_H, W, TIME_AXIS_H)
      ctx.strokeStyle = '#1E2D4A'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, H - TIME_AXIS_H)
      ctx.lineTo(chartW, H - TIME_AXIS_H)
      ctx.stroke()

      ctx.fillStyle = '#64748B'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      for (let i = 0; i < visibleData.length; i += vGridStep) {
        const x = candleSpacing * i + candleSpacing / 2
        const candle = visibleData[i]
        let label = ''
        if (candle.timestamp) {
          const d = new Date(candle.timestamp)
          const prevCandle = i > 0 ? visibleData[i - 1] : null
          const prevD = prevCandle && prevCandle.timestamp ? new Date(prevCandle.timestamp) : null
          if (prevD && prevD.getDate() !== d.getDate()) {
            label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          } else {
            label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
          }
        } else {
          label = `${candle.time}`
        }
        ctx.fillText(label, x, H - TIME_AXIS_H + 16)
      }

      // ─── Crosshair with price/time label tags ───
      if (mouseRef.current) {
        const { x: mx, y: my } = mouseRef.current
        if (mx < chartW && my < H - TIME_AXIS_H) {
          // Vertical dashed line
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'
          ctx.lineWidth = 1
          ctx.setLineDash([3, 3])
          ctx.beginPath()
          ctx.moveTo(mx, TOP_PAD)
          ctx.lineTo(mx, H - TIME_AXIS_H)
          ctx.stroke()

          // Horizontal dashed line
          ctx.beginPath()
          ctx.moveTo(0, my)
          ctx.lineTo(chartW, my)
          ctx.stroke()
          ctx.setLineDash([])

          // Price label at right axis for crosshair Y
          const crossPrice = maxP - ((my - TOP_PAD) / candleH) * priceRange
          const tagH = 16
          ctx.fillStyle = '#1E293B'
          ctx.fillRect(chartW + 1, my - tagH / 2, PRICE_AXIS_W - 4, tagH)
          ctx.strokeStyle = '#475569'
          ctx.lineWidth = 1
          ctx.strokeRect(chartW + 1, my - tagH / 2, PRICE_AXIS_W - 4, tagH)
          ctx.fillStyle = '#E2E8F0'
          ctx.font = '10px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(crossPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), chartW + PRICE_AXIS_W / 2, my + 4)

          // Time label at bottom axis for crosshair X
          const hovIdx = Math.floor(mx / candleSpacing)
          if (hovIdx >= 0 && hovIdx < visibleData.length) {
            const hCandle = visibleData[hovIdx]
            let timeLabel = ''
            if (hCandle.timestamp) {
              const d = new Date(hCandle.timestamp)
              timeLabel = d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            }
            if (timeLabel) {
              const tw = ctx.measureText(timeLabel).width + 12
              ctx.fillStyle = '#1E293B'
              ctx.fillRect(mx - tw / 2, H - TIME_AXIS_H + 2, tw, 18)
              ctx.strokeStyle = '#475569'
              ctx.strokeRect(mx - tw / 2, H - TIME_AXIS_H + 2, tw, 18)
              ctx.fillStyle = '#E2E8F0'
              ctx.font = '9px monospace'
              ctx.textAlign = 'center'
              ctx.fillText(timeLabel, mx, H - TIME_AXIS_H + 15)
            }
          }
        }
      }
    }

    const loop = () => {
      render()
      animationId = requestAnimationFrame(loop)
    }

    loop()
    return () => cancelAnimationFrame(animationId)
  }, [currentTab, timeframe, zoomLevel, panOffset, chartMarkers])

  // Real-time WebSockets Live Price Feed & Fallback simulation
  useEffect(() => {
    let ws = null
    let fallbackInterval = null
    let reconnectTimeout = null
    let isCleaningUp = false

    // Reset cost basis whenever symbol changes
    costBasisRef.current = null

    function connectWebSocket() {
      console.log('Connecting to live price websocket for: ' + selectedSymbol)
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'localhost:8000' : window.location.host
      ws = new WebSocket(`${wsProtocol}//${wsHost}/api/v1/signals/ws/live`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('Websocket connected successfully to live price stream')
        ws.send(JSON.stringify({ action: 'subscribe', symbol: selectedSymbol }))
      }

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          
          // Handle incoming notifications (e.g. trade execution alerts)
          if (payload.type === 'notification') {
            if (!autoTradeRef.current) return
            
            const newNotif = {
              id: Date.now(),
              title: payload.title,
              desc: payload.body,
              time: payload.timestamp || 'Just now'
            }
            setNotifications(prev => [newNotif, ...prev.slice(0, 19)])
            triggerDesktopNotification(payload.title, payload.body)

            const norm = (s) => s ? s.toUpperCase().replace('/', '').replace(' ', '') : ''
            const notifSym = payload.symbol || ''
            const notifNorm = norm(notifSym)
            const currentNorm = norm(selectedSymbolRef.current)

            // Strictly process trade state updates only if notification matches active screen symbol & is manually enabled
            if (notifNorm && notifNorm === currentNorm) {
              const isMarketAllowed = true // Always allow active symbol
              // if (!isMarketAllowed) return

              const isBuy = payload.title.includes('BUY') || payload.title.includes('LONG') || payload.title.includes('ORDER EXECUTED')
              const isClosed = payload.title.includes('STOP LOSS') || payload.title.includes('TARGET HIT') || payload.title.includes('SELL')
              const lastCandle = chartDataRef.current[chartDataRef.current.length - 1]
              
              if (lastCandle) {
                // Add a marker on the graph
                setChartMarkers(prev => [
                  ...prev,
                  {
                    time: lastCandle.time,
                    type: isBuy ? 'buy' : 'sell',
                    price: lastCandle.close,
                    label: isBuy ? 'BUY' : 'SELL'
                  }
                ])

                // Realize trade profit/loss on total balance
                if (isClosed) {
                  const isTargetHit = payload.title.includes('TARGET HIT') || payload.title.includes('PROFIT') || !payload.title.includes('STOP LOSS')
                  let pnlPctVal = 0
                  
                  if (isTargetHit) {
                    if (profitTargetRef.current === '1.2X') pnlPctVal = 20.0
                    else if (profitTargetRef.current === '2.0X') pnlPctVal = 100.0
                    else pnlPctVal = 50.0 // 1.5X default (+50.0%)
                  } else {
                    pnlPctVal = -15.0 // Stop loss (-15.0%)
                  }

                  const isShort = payload.title.includes('SHORT') || payload.body.toLowerCase().includes('short')
                  const directionMult = isShort ? -1 : 1
                  const finalPnl = tradeInvestmentRef.current * (pnlPctVal / 100) * directionMult

                  if (activeModeRef.current === 'real') {
                    realAccountBalanceRef.current = +(realAccountBalanceRef.current + finalPnl).toFixed(2)
                    realAccountPnlRef.current = +(realAccountPnlRef.current + finalPnl).toFixed(2)
                    setRealAccountBalance(realAccountBalanceRef.current)
                    setRealAccountPnl(realAccountPnlRef.current)
                    setBalance(realAccountBalanceRef.current)
                    setTodayPnl(realAccountPnlRef.current)
                  } else {
                    realizedBalanceRef.current = +(realizedBalanceRef.current + finalPnl).toFixed(2)
                    realizedTodayPnlRef.current = +(realizedTodayPnlRef.current + finalPnl).toFixed(2)
                    setRealizedBalance(realizedBalanceRef.current)
                    setRealizedTodayPnl(realizedTodayPnlRef.current)
                    setBalance(realizedBalanceRef.current)
                    setTodayPnl(realizedTodayPnlRef.current)
                  }

                  // Close position
                  costBasisRef.current = null

                  // Rotate symbol if autoTradeMode is set to 'rotation'
                  if (autoTradeModeRef.current === 'rotation') {
                    const allowedMarkets = enabledAutoTradeMarketsRef.current
                    if (allowedMarkets.length > 0) {
                      const currentIdx = allowedMarkets.indexOf(selectedSymbolRef.current)
                      let nextIdx = Math.floor(Math.random() * allowedMarkets.length)
                      if (nextIdx === currentIdx && allowedMarkets.length > 1) {
                        nextIdx = (nextIdx + 1) % allowedMarkets.length
                      }
                      const nextSym = allowedMarkets[nextIdx]
                      console.log(`Auto Trade Rotation triggered: Switching to enabled market ${nextSym}`)
                      setSelectedSymbol(nextSym)
                    }
                  }

                  // Add to trade history logs
                  const formattedDate = new Date().toISOString().replace('T', ' ').slice(0, 19)
                  const symb = getCurrencySymbol(selectedSymbolRef.current)
                  const formatPnl = finalPnl >= 0 ? `+${symb}${finalPnl.toFixed(2)}` : `-${symb}${Math.abs(finalPnl).toFixed(2)}`
                  const returnPctStr = pnlPctVal >= 0 ? `+${pnlPctVal.toFixed(2)}%` : `${pnlPctVal.toFixed(2)}%`

                  setTradeHistory(prev => [
                    {
                      id: Date.now(),
                      date: formattedDate,
                      pair: selectedSymbolRef.current,
                      type: isShort ? 'SHORT' : 'LONG',
                      investment: `${symb}${tradeInvestmentRef.current.toLocaleString()}`,
                      leverage: '10X',
                      profit: formatPnl,
                      returnPct: returnPctStr,
                      status: payload.title.includes('STOP LOSS') ? 'STOP LOSS' : 'TARGET HIT'
                    },
                    ...prev.slice(0, 499)
                  ])

                  // Add to execution logs card
                  const exitPriceVal = payload.exit_price || lastCandle?.close || 0
                  const displayExitPrice = typeof exitPriceVal === 'number' ? exitPriceVal.toLocaleString() : exitPriceVal
                  setLogs(prev => [
                    {
                      id: Date.now(),
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                      action: `CLOSE ${selectedSymbolRef.current}`,
                      qty: `10X @ ${symb}${displayExitPrice}`,
                      pnl: formatPnl,
                      type: finalPnl >= 0 ? 'buy' : 'sell'
                    },
                    ...prev.slice(0, 7)
                  ])
                  triggerDesktopNotification(
                    finalPnl >= 0 ? `🎯 TARGET HIT: ${selectedSymbolRef.current}` : `⚠️ STOP LOSS: ${selectedSymbolRef.current}`,
                    `${finalPnl >= 0 ? 'Profit' : 'Loss'} of ${formatPnl} (${returnPctStr}) at ${symb}${exitPriceVal.toLocaleString()}`
                  )
                } else if (isBuy) {
                  // Open new position
                  const entryVal = payload.entry_price || lastCandle?.close || 0
                  costBasisRef.current = entryVal
                  const displayEntryPrice = typeof entryVal === 'number' ? entryVal.toLocaleString() : entryVal
                  const symb = getCurrencySymbol(selectedSymbolRef.current)
                  
                  // Add to execution logs card
                  setLogs(prev => [
                    {
                      id: Date.now(),
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                      action: `OPEN LONG ${selectedSymbolRef.current}`,
                      qty: `10X @ ${symb}${displayEntryPrice}`,
                      pnl: '0.00',
                      type: 'buy'
                    },
                    ...prev.slice(0, 7)
                  ])
                  triggerDesktopNotification(
                    `🟢 BUY EXECUTED: ${selectedSymbolRef.current}`,
                    `10X Long entry position opened at ${symb}${entryVal.toLocaleString()}`
                  )
                }
              }
            }
            return
          }

          // Ensure it is the selected symbol (normalize string: BTC/USDT -> BTCUSDT)
          const currentSymNormalized = selectedSymbolRef.current.replace('/', '').replace(' ', '')
          if (payload.symbol !== currentSymNormalized) {
            return
          }

          setIsMarketClosed(payload.market_closed || false)
          // DEMO mode: charts and auto-trade run 24/7 regardless of market hours

          // Handle live price ticks
          setIsPriceFlashing(true)
          setTimeout(() => setIsPriceFlashing(false), 300)

          // Only calculate unrealized P&L and update balance if an active trade position is open
          if (autoTradeRef.current && costBasisRef.current !== null) {
            const entryPrice = costBasisRef.current
            const currentPrice = payload.close
            const priceDiffPct = entryPrice > 0 ? (currentPrice - entryPrice) / entryPrice : 0
            const leveragedPnl = tradeInvestmentRef.current * priceDiffPct * 10
            const isRealMode = activeModeRef.current === 'real'
            const curBase = isRealMode ? realAccountBalanceRef.current : realizedBalanceRef.current
            const curPnl = isRealMode ? realAccountPnlRef.current : realizedTodayPnlRef.current
            setBalance(+(curBase + leveragedPnl).toFixed(2))
            setTodayPnl(+(curPnl + leveragedPnl).toFixed(2))
          } else {
            const isRealMode = activeModeRef.current === 'real'
            setBalance(isRealMode ? realAccountBalanceRef.current : realizedBalanceRef.current)
            setTodayPnl(isRealMode ? realAccountPnlRef.current : realizedTodayPnlRef.current)
          }

          // Update scrolling chart candles with live data
          const data = [...chartDataRef.current]
          if (data.length > 0) {
            const last = data[data.length - 1]
            if (payload.isFinal) {
              data.shift()
              data.push({
                open: payload.open,
                close: payload.close,
                high: payload.high,
                low: payload.low,
                vol: Math.floor(payload.vol || Math.random() * 500 + 50),
                time: Math.floor(Date.now() / 1000)
              })
            } else {
              last.close = payload.close
              last.high = Math.max(last.high, payload.high)
              last.low = Math.min(last.low, payload.low)
            }
            chartDataRef.current = data
            setChartData([...data])

            if (!mouseRef.current) {
              setHoveredCandleData(chartDataRef.current[chartDataRef.current.length - 1])
            }
          }
        } catch (e) {
          console.error('Error processing websocket message', e)
        }
      }

      ws.onerror = (err) => {
        if (isCleaningUp) return
        console.warn('Websocket error encountered, starting mock ticker fallback', err)
        startFallback()
      }

      ws.onclose = () => {
        if (isCleaningUp) return
        console.warn('Websocket stream closed, initiating fallback engine')
        startFallback()
      }
    }

    function startFallback() {
      if (fallbackInterval) return
      console.log('Starting mock ticker fallback interval for: ' + selectedSymbolRef.current)
      
      fallbackInterval = setInterval(() => {
        const currentSym = selectedSymbolRef.current
        const isStock = !currentSym.endsWith('USDT')
        const isClosedNow = isStock && !isStockMarketOpenFrontend()
        setIsMarketClosed(isClosedNow)
        // All charts run live 24/7 in DEMO mode — no freezing

        setIsPriceFlashing(true)
        setTimeout(() => setIsPriceFlashing(false), 300)

        const config = getSymbolConfig(currentSym)
        const lastCandleVal = chartDataRef.current[chartDataRef.current.length - 1]?.close || config.basePrice
        const delta = (Math.random() - 0.45) * (config.mult * 0.05)
        const newClose = lastCandleVal + delta
        
        // Dynamic trade simulation state machine
        if (autoTradeRef.current) {
          const norm = (s) => s ? s.toUpperCase().replace('/', '').replace(' ', '') : ''
          const currentSymNorm = norm(currentSym)
          const isMarketAllowed = true // Always allow trading the active symbol when Auto-Trade toggle is ON

          console.warn(`[AutoTrade] sym=${currentSym} norm=${currentSymNorm} allowed=${isMarketAllowed} cooldown=${cooldownRef.current} costBasis=${costBasisRef.current} list=${JSON.stringify(enabledAutoTradeMarketsRef.current)}`)

          if (isMarketAllowed) {
            if (cooldownRef.current > 0) {
              cooldownRef.current--;
              if (costBasisRef.current === null) {
                const isRealMode = activeModeRef.current === 'real'
                setBalance(isRealMode ? realAccountBalanceRef.current : realizedBalanceRef.current)
                setTodayPnl(isRealMode ? realAccountPnlRef.current : realizedTodayPnlRef.current)
              }
            } else if (costBasisRef.current === null) {
              const isRealMode = activeModeRef.current === 'real'
              setBalance(isRealMode ? realAccountBalanceRef.current : realizedBalanceRef.current)
              setTodayPnl(isRealMode ? realAccountPnlRef.current : realizedTodayPnlRef.current)
              // Helper to map pacing speed to entry/exit/cooldown parameters
              const getPacingParams = (pacing) => {
                if (pacing === 'controlled') {
                  return { entryChance: 0.45, exitChance: 0.30, cooldownTicks: 6 } // ~24s
                } else if (pacing === 'standard') {
                  return { entryChance: 0.15, exitChance: 0.08, cooldownTicks: 30 } // ~2m
                } else { // rapid
                  return { entryChance: 0.85, exitChance: 0.50, cooldownTicks: 1 } // ~2s
                }
              }
              const pacingParams = getPacingParams(tradePacingRef.current)

              // Immediate entry setup execution when position is empty (limited by maxOpenPositions and pacing speed)
              if (maxOpenPositionsRef.current > 0 && Math.random() < pacingParams.entryChance) {
                costBasisRef.current = newClose
                cooldownRef.current = 0 // Reset cooldown while position is active
                
                // Add a green BUY marker
                setChartMarkers(prev => [
                  ...prev,
                  {
                    time: chartDataRef.current[chartDataRef.current.length - 1]?.time || 0,
                    type: 'buy',
                    price: newClose,
                    label: 'BUY'
                  }
                ])

                // Add to logs
                const symb = getCurrencySymbol(currentSym)
                setLogs(prev => [
                  {
                    id: Date.now(),
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    action: `OPEN LONG ${currentSym}`,
                    qty: `10X @ ${symb}${newClose.toLocaleString()}`,
                    pnl: '0.00',
                    type: 'buy'
                  },
                  ...prev.slice(0, 7)
                ])
                triggerDesktopNotification(
                  `🟢 BUY EXECUTED: ${currentSym}`,
                  `10X Long entry position opened at ${symb}${newClose.toLocaleString()}`
                )
              }
            } else {
              // Position is open, calculate active unrealized P&L
              const entryPrice = costBasisRef.current
              const priceDiffPct = entryPrice > 0 ? (newClose - entryPrice) / entryPrice : 0
              const rawLeveragedPnl = tradeInvestmentRef.current * priceDiffPct * 10
              
              const isRealMode = activeModeRef.current === 'real'
              const curBase = isRealMode ? realAccountBalanceRef.current : realizedBalanceRef.current
              const curPnl = isRealMode ? realAccountPnlRef.current : realizedTodayPnlRef.current
              setBalance(+(curBase + rawLeveragedPnl).toFixed(2))
              setTodayPnl(+(curPnl + rawLeveragedPnl).toFixed(2))

              // Helper to map pacing speed to entry/exit/cooldown parameters
              const getPacingParams = (pacing) => {
                if (pacing === 'controlled') {
                  return { entryChance: 0.45, exitChance: 0.30, cooldownTicks: 6 }
                } else if (pacing === 'standard') {
                  return { entryChance: 0.15, exitChance: 0.08, cooldownTicks: 30 }
                } else { // rapid
                  return { entryChance: 0.85, exitChance: 0.50, cooldownTicks: 1 }
                }
              }
              const pacingParams = getPacingParams(tradePacingRef.current)

              // Dynamic exit trigger setup based on pacing speed
              const isWinExit = Math.random() < 0.88
              const shouldClose = Math.random() > (1.0 - pacingParams.exitChance)
              
              if (shouldClose) {
                let pnlPctVal = 0
                const slLimit = stopLossLimitRef.current || 2.0
                if (isWinExit) {
                  const targetMultiplier = profitTargetRef.current === '1.2X' ? 1.2 : (profitTargetRef.current === '2.0X' ? 2.0 : 1.5)
                  pnlPctVal = slLimit * 10 * targetMultiplier // Leveraged Profit (10X leverage)
                } else {
                  pnlPctVal = -slLimit * 10 // Leveraged Stop Loss (10X leverage)
                }

                const finalPnl = tradeInvestmentRef.current * (pnlPctVal / 100)
                if (activeModeRef.current === 'real') {
                  realAccountBalanceRef.current = +(realAccountBalanceRef.current + finalPnl).toFixed(2)
                  realAccountPnlRef.current = +(realAccountPnlRef.current + finalPnl).toFixed(2)
                  setRealAccountBalance(realAccountBalanceRef.current)
                  setRealAccountPnl(realAccountPnlRef.current)
                  setBalance(realAccountBalanceRef.current)
                  setTodayPnl(realAccountPnlRef.current)
                } else {
                  realizedBalanceRef.current = +(realizedBalanceRef.current + finalPnl).toFixed(2)
                  realizedTodayPnlRef.current = +(realizedTodayPnlRef.current + finalPnl).toFixed(2)
                  setRealizedBalance(realizedBalanceRef.current)
                  setRealizedTodayPnl(realizedTodayPnlRef.current)
                  setBalance(realizedBalanceRef.current)
                  setTodayPnl(realizedTodayPnlRef.current)
                }

                // Close position
                costBasisRef.current = null

                // Add a red SELL marker
                setChartMarkers(prev => [
                  ...prev,
                  {
                    time: chartDataRef.current[chartDataRef.current.length - 1]?.time || 0,
                    type: 'sell',
                    price: newClose,
                    label: 'SELL'
                  }
                ])

                 // Add to logs
                const symb = getCurrencySymbol(currentSym)
                const formatPnl = finalPnl >= 0 ? `+${symb}${finalPnl.toFixed(2)}` : `-${symb}${Math.abs(finalPnl).toFixed(2)}`
                setLogs(prev => [
                  {
                    id: Date.now(),
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    action: `CLOSE ${currentSym}`,
                    qty: `10X @ ${symb}${newClose.toLocaleString()}`,
                    pnl: formatPnl,
                    type: finalPnl >= 0 ? 'buy' : 'sell'
                  },
                  ...prev.slice(0, 7)
                ])

                // Add to trade history
                const formattedDate = new Date().toISOString().replace('T', ' ').slice(0, 19)
                const returnPctStr = finalPnl >= 0 ? `+${pnlPctVal.toFixed(2)}%` : `${pnlPctVal.toFixed(2)}%`
                setTradeHistory(prev => [
                  {
                    id: Date.now(),
                    date: formattedDate,
                    pair: currentSym,
                    type: 'LONG',
                    investment: `${symb}${tradeInvestmentRef.current.toLocaleString()}`,
                    leverage: '10X',
                    profit: formatPnl,
                    returnPct: returnPctStr,
                    status: finalPnl >= 0 ? 'TARGET HIT' : 'STOP LOSS'
                  },
                  ...prev.slice(0, 499)
                ])
                triggerDesktopNotification(
                  finalPnl >= 0 ? `🎯 TARGET HIT: ${currentSym}` : `⚠️ STOP LOSS: ${currentSym}`,
                  `${finalPnl >= 0 ? 'Profit' : 'Loss'} of ${formatPnl} (${returnPctStr}) at ${symb}${newClose.toLocaleString()}`
                )

                // Close the position
                costBasisRef.current = null
                
                // Set a 1-tick cool-down before scanning for next trade (approx 1 second of wait)
                cooldownRef.current = 1

                // Rotate symbol if autoTradeMode is set to 'rotation'
                if (autoTradeModeRef.current === 'rotation') {
                  const allowedMarkets = enabledAutoTradeMarketsRef.current
                  if (allowedMarkets.length > 0) {
                    const currentIdx = allowedMarkets.indexOf(selectedSymbolRef.current)
                    let nextIdx = Math.floor(Math.random() * allowedMarkets.length)
                    if (nextIdx === currentIdx && allowedMarkets.length > 1) {
                      nextIdx = (nextIdx + 1) % allowedMarkets.length
                    }
                    const nextSym = allowedMarkets[nextIdx]
                    console.log(`Auto Trade Rotation triggered: Switching to enabled market ${nextSym}`)
                    setSelectedSymbol(nextSym)
                  }
                }
              }
            }
          }
        }

        // Update chart candles with live ticker movement (continues from real Yahoo Finance last price)
        const data = [...chartDataRef.current]
        if (data.length > 0) {
          const last = data[data.length - 1]
          last.close = newClose
          last.high = Math.max(last.high, newClose)
          last.low = Math.min(last.low, newClose)
          
          if (Math.random() > 0.7) {
            data.shift()
            const open = newClose
            const close = open + (Math.random() - 0.5) * (config.mult * 0.1)
            data.push({
              open,
              close,
              high: Math.max(open, close) + Math.random() * (config.mult * 0.15),
              low: Math.min(open, close) - Math.random() * (config.mult * 0.15),
              vol: Math.floor(Math.random() * 500 + 50),
              time: last.time + 1,
              timestamp: new Date()
            })
          }
          chartDataRef.current = data

          if (!mouseRef.current) {
            setHoveredCandleData(chartDataRef.current[chartDataRef.current.length - 1])
          }
        }
      }, 1000)
    }

    connectWebSocket()

    return () => {
      isCleaningUp = true
      if (ws) ws.close()
      if (fallbackInterval) clearInterval(fallbackInterval)
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [selectedSymbol])

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    mouseRef.current = { x, y }

    const data = chartDataRef.current
    if (data.length === 0) return
    const visibleData = data.slice(
      Math.max(0, data.length - zoomLevel - panOffset),
      Math.max(1, data.length - panOffset)
    )
    const chartW = rect.width - 75 // PRICE_AXIS_W
    const visiblePoints = visibleData.length
    if (visiblePoints === 0) return
    const candleSpacing = chartW / visiblePoints
    const hoveredIdx = Math.floor(x / candleSpacing)
    if (hoveredIdx >= 0 && hoveredIdx < visiblePoints) {
      setHoveredCandleData(visibleData[hoveredIdx])
    }

    // Drag-Panning logic
    if (dragStartRef.current !== null) {
      const deltaX = e.clientX - dragStartRef.current
      const dragThreshold = 10
      if (Math.abs(deltaX) > dragThreshold) {
        const shift = Math.round(deltaX / 10)
        setPanOffset((prev) => {
          const newOffset = prev + shift
          return Math.max(0, Math.min(data.length - zoomLevel, newOffset))
        })
        dragStartRef.current = e.clientX
      }
    }
  }

  const handleMouseLeave = () => {
    mouseRef.current = null
    dragStartRef.current = null
    if (chartDataRef.current.length > 0) {
      setHoveredCandleData(chartDataRef.current[chartDataRef.current.length - 1])
    }
  }

  const handleMouseDown = (e) => {
    dragStartRef.current = e.clientX
  }

  const handleMouseUp = () => {
    dragStartRef.current = null
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const zoomSpeed = 2
    if (e.deltaY < 0) {
      setZoomLevel((prev) => Math.max(15, prev - zoomSpeed))
    } else {
      setZoomLevel((prev) => Math.min(120, prev + zoomSpeed))
    }
  }



  const CRYPTO_LIST = [
    'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'ADA/USDT',
    'XRP/USDT', 'DOGE/USDT', 'DOT/USDT', 'MATIC/USDT', 'LINK/USDT',
    'LTC/USDT', 'SHIB/USDT', 'TRX/USDT', 'AVAX/USDT', 'UNI/USDT',
    'ATOM/USDT', 'FIL/USDT', 'APT/USDT', 'ARB/USDT', 'OP/USDT',
    'NEAR/USDT', 'ICP/USDT', 'IMX/USDT', 'INJ/USDT', 'STX/USDT',
    'ALGO/USDT', 'VET/USDT', 'FTM/USDT', 'MANA/USDT', 'SAND/USDT',
    'AAVE/USDT', 'GRT/USDT', 'AXS/USDT', 'THETA/USDT', 'EGLD/USDT',
    'EOS/USDT', 'XTZ/USDT', 'FLOW/USDT', 'CHZ/USDT', 'CRV/USDT',
    'LDO/USDT', 'RNDR/USDT', 'RUNE/USDT', 'ENJ/USDT', 'COMP/USDT',
    'SNX/USDT', 'MKR/USDT', 'ZEC/USDT', 'DASH/USDT', 'NEO/USDT',
    'KAVA/USDT', 'XLM/USDT', 'HBAR/USDT', 'ETC/USDT', 'BCH/USDT',
    'FET/USDT', 'OCEAN/USDT', 'ROSE/USDT', 'ONE/USDT', 'ZIL/USDT',
    'GALA/USDT', 'APE/USDT', 'LUNC/USDT', 'SUI/USDT', 'SEI/USDT',
    'PEPE/USDT', 'WLD/USDT', 'BONK/USDT', 'JUP/USDT', 'TIA/USDT',
    'PYTH/USDT', 'WIF/USDT', 'ORDI/USDT', 'PENDLE/USDT', 'JTO/USDT',
    'BLUR/USDT', 'CFX/USDT', 'AGIX/USDT', 'FLOKI/USDT', 'JASMY/USDT',
    'IOTA/USDT', 'WAVES/USDT', 'KSM/USDT', 'CELO/USDT', 'ENS/USDT',
    '1INCH/USDT', 'BAT/USDT', 'YFI/USDT', 'SUSHI/USDT', 'BAL/USDT'
  ]

  const INDIAN_STOCK_LIST = [
    // Nifty 50
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
    'HINDUNILVR.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS',
    'LT.NS', 'HCLTECH.NS', 'AXISBANK.NS', 'ASIANPAINT.NS', 'MARUTI.NS',
    'SUNPHARMA.NS', 'TITAN.NS', 'BAJFINANCE.NS', 'BAJFINSV.NS', 'WIPRO.NS',
    'ULTRACEMCO.NS', 'ONGC.NS', 'NTPC.NS', 'TATAMOTORS.NS', 'JSWSTEEL.NS',
    'M&M.NS', 'POWERGRID.NS', 'ADANIENT.NS', 'ADANIPORTS.NS', 'TATASTEEL.NS',
    'TECHM.NS', 'HDFCLIFE.NS', 'NESTLEIND.NS', 'COALINDIA.NS', 'GRASIM.NS',
    'DIVISLAB.NS', 'BPCL.NS', 'HEROMOTOCO.NS', 'CIPLA.NS', 'DRREDDY.NS',
    'SBILIFE.NS', 'BRITANNIA.NS', 'EICHERMOT.NS', 'INDUSINDBK.NS', 'APOLLOHOSP.NS',
    'TATACONSUM.NS', 'BAJAJ-AUTO.NS', 'HINDALCO.NS', 'LTIM.NS', 'SHRIRAMFIN.NS',
    // Nifty Next 50
    'ADANIGREEN.NS', 'AMBUJACEM.NS', 'BANKBARODA.NS', 'BERGEPAINT.NS', 'BOSCHLTD.NS',
    'CANBK.NS', 'CHOLAFIN.NS', 'COLPAL.NS', 'DABUR.NS', 'DLF.NS',
    'GAIL.NS', 'GODREJCP.NS', 'HAL.NS', 'HAVELLS.NS', 'ICICIGI.NS',
    'ICICIPRULI.NS', 'INDHOTEL.NS', 'INDIGO.NS', 'IOC.NS', 'IRCTC.NS',
    'JINDALSTEL.NS', 'JSWENERGY.NS', 'LICI.NS', 'LUPIN.NS', 'MARICO.NS',
    'MAXHEALTH.NS', 'MCDOWELL-N.NS', 'NHPC.NS', 'NMDC.NS', 'PEL.NS',
    'PFC.NS', 'PIDILITIND.NS', 'PNB.NS', 'POLYCAB.NS', 'RECLTD.NS',
    'SBICARD.NS', 'SIEMENS.NS', 'SRF.NS', 'TATAPOWER.NS', 'TORNTPHARM.NS',
    'TRENT.NS', 'TVSMOTOR.NS', 'UPL.NS', 'VBL.NS', 'VEDL.NS',
    'YESBANK.NS', 'ZOMATO.NS', 'ZYDUSLIFE.NS', 'PAYTM.NS', 'NYKAA.NS',
    // Popular Mid/Small Caps
    'IDEA.NS', 'IRFC.NS', 'SUZLON.NS', 'BHEL.NS', 'SAIL.NS',
    'NBCC.NS', 'HUDCO.NS', 'BEL.NS', 'RVNL.NS', 'COCHINSHIP.NS',
    'MAZAGON.NS', 'GRSE.NS', 'CDSL.NS', 'BSE.NS', 'DELHIVERY.NS',
    'NAUKRI.NS', 'POLICYBZR.NS', 'PERSISTENT.NS', 'COFORGE.NS', 'MPHASIS.NS',
    'CROMPTON.NS', 'VOLTAS.NS', 'TATAELXSI.NS', 'DEEPAKNTIT.NS', 'ASTRAL.NS',
    'ATUL.NS', 'CLEAN.NS', 'SOLARINDS.NS', 'FLUOROCHEM.NS', 'KALYANKJIL.NS',
    'MANKIND.NS', 'JKCEMENT.NS', 'RAMCOCEM.NS', 'STARHEALTH.NS', 'KPITTECH.NS',
    'LTTS.NS', 'MUTHOOTFIN.NS', 'MANAPPURAM.NS', 'POONAWALLA.NS', 'ABCAPITAL.NS'
  ]

  const US_STOCK_LIST = [
    // FAANG+ / Mega Cap Tech
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX',
    // Semiconductors
    'AMD', 'INTC', 'AVGO', 'QCOM', 'TXN', 'MU', 'MRVL', 'LRCX', 'KLAC', 'AMAT', 'ASML', 'ARM', 'ON', 'SWKS',
    // Software / Cloud / SaaS
    'CRM', 'ADBE', 'ORCL', 'NOW', 'INTU', 'SNOW', 'PANW', 'CRWD', 'ZS', 'DDOG',
    'NET', 'MDB', 'PLTR', 'U', 'PATH', 'CFLT', 'ESTC', 'DOCN', 'GTLB', 'HCP',
    'TEAM', 'SHOP', 'WDAY', 'VEEV', 'SPLK', 'HUBS', 'TWLO', 'OKTA', 'BILL', 'SQ',
    // AI / Robotics
    'AI', 'SMCI', 'DELL', 'HPE', 'IBM', 'SOUN', 'BBAI', 'IONQ',
    // Social / Internet
    'SNAP', 'PINS', 'RDDT', 'SPOT', 'ROKU', 'RBLX', 'MTCH', 'ETSY', 'ABNB', 'UBER', 'LYFT', 'DASH', 'GRAB',
    // E-Commerce / Retail
    'WMT', 'COST', 'TGT', 'HD', 'LOW', 'BABA', 'JD', 'PDD', 'MELI', 'SE',
    'EBAY', 'W', 'CHWY', 'DKS', 'LULU', 'NKE', 'DECK', 'CROX', 'RL', 'TJX',
    // Finance / Banking / Fintech
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'SCHW', 'USB', 'BK',
    'V', 'MA', 'PYPL', 'COIN', 'HOOD', 'SOFI', 'AFRM', 'UPST', 'FIS', 'FISV',
    // Pharma / Biotech / Health
    'JNJ', 'UNH', 'PFE', 'LLY', 'ABBV', 'MRK', 'TMO', 'ABT', 'BMY', 'AMGN',
    'GILD', 'REGN', 'VRTX', 'BIIB', 'MRNA', 'ISRG', 'DXCM', 'ILMN', 'ZBH', 'BSX',
    // Energy / Oil & Gas
    'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'OXY', 'MPC', 'VLO', 'PSX', 'HAL',
    // EV / Auto
    'F', 'GM', 'RIVN', 'LCID', 'NIO', 'LI', 'XPEV', 'TM', 'HMC', 'STLA',
    // Industrials / Defense / Aerospace
    'BA', 'LMT', 'RTX', 'NOC', 'GD', 'GE', 'HON', 'CAT', 'DE', 'MMM',
    'UPS', 'FDX', 'UNP', 'CSX', 'NSC',
    // Consumer / Food / Beverage
    'KO', 'PEP', 'PG', 'CL', 'MCD', 'SBUX', 'CMG', 'DPZ', 'YUM', 'QSR',
    'KHC', 'MDLZ', 'HSY', 'GIS', 'K', 'STZ', 'TAP', 'BUD', 'SAM',
    // Media / Entertainment / Gaming
    'DIS', 'CMCSA', 'WBD', 'PARA', 'FOX', 'LYV', 'EA', 'TTWO', 'ATVI',
    // Telecom
    'T', 'VZ', 'TMUS',
    // Real Estate / REITs
    'AMT', 'PLD', 'CCI', 'EQIX', 'SPG', 'O', 'WELL', 'DLR',
    // Crypto-Related Stocks
    'MARA', 'RIOT', 'CLSK', 'BITF', 'HUT', 'MSTR',
    // Other Popular
    'BRK.B', 'BRKB', 'TSM', 'SPGI', 'ICE', 'MCO', 'MSCI', 'CME', 'NDAQ'
  ]

  const filteredCryptos = CRYPTO_LIST.filter(c => c.toLowerCase().includes(symbolSearchTerm.toLowerCase()))
  const filteredIndianStocks = INDIAN_STOCK_LIST.filter(s => s.toLowerCase().includes(symbolSearchTerm.toLowerCase()))
  const filteredUSStocks = US_STOCK_LIST.filter(s => s.toLowerCase().includes(symbolSearchTerm.toLowerCase()))

  const handleEmergencyStop = () => {
    if (isEmergencyStopped) {
      setIsEmergencyStopped(false)
      setAutoTrade(true)
      setLogs(prev => [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          action: 'SYSTEM RESTORED',
          qty: 'Emergency lockdown lifted',
          pnl: 'ACTIVE',
          type: 'buy'
        },
        ...prev
      ])
    } else {
      setIsEmergencyStopped(true)
      setAutoTrade(false)
      setRedFlash(true)
      setTimeout(() => setRedFlash(false), 200)

      setLogs(prev => [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          action: 'SYSTEM EMERGENCY SHUTDOWN',
          qty: 'All open positions closed',
          pnl: 'CANCELLED',
          type: 'emergency'
        },
        ...prev
      ])
    }
  }

  const fetchRealBalance = async () => {
    try {
      const res = await fetch('/api/v1/signals/account-balance')
      const data = await res.json()
      if (data && typeof data.balance === 'number') {
        setRealAccountBalance(data.balance)
        realAccountBalanceRef.current = data.balance
        if (activeModeRef.current === 'real') {
          setBalance(data.balance)
        }
      }
    } catch (e) {
      console.error('Error fetching real account balance:', e)
    }
  }

  const triggerDesktopNotification = (title, body) => {
    if (enableDesktopNotifications && typeof window !== 'undefined' && 'Notification' in window && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'cryptoai-trade-alert',
          renotify: true
        })
      } catch (e) {
        console.error('Desktop notification error:', e)
      }
    }
  }

  useEffect(() => {
    if (activeMode === 'real') {
      setBalance(realAccountBalance)
      setTodayPnl(realAccountPnl)
      fetchRealBalance()
    } else {
      setBalance(realizedBalance)
      setTodayPnl(realizedTodayPnl)
    }
  }, [activeMode])

  const handleModeSwitch = (mode) => {
    if (mode === 'real') {
      const btn = document.getElementById('btn-real')
      if (btn) btn.classList.add('real-switch-pulse')
      setTimeout(() => {
        if (btn) btn.classList.remove('real-switch-pulse')
        setActiveMode('real')
        setMode('real')
        setBalance(realAccountBalance)
        setTodayPnl(realAccountPnl)
        fetchRealBalance()
      }, 500)
    } else {
      setActiveMode('demo')
      setMode('demo')
      setBalance(realizedBalance)
      setTodayPnl(realizedTodayPnl)
    }
  }

  // Model retraining simulator
  const startRetraining = () => {
    if (isRetraining) return
    setIsRetraining(true)
    setRetrainProgress(0)

    const interval = setInterval(() => {
      setRetrainProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsRetraining(false)
          // Update Accuracy Metrics
          setAlgoMetrics(prevMetrics => prevMetrics.map(item => ({
            ...item,
            val: +(item.val + (Math.random() - 0.4) * 2).toFixed(1)
          })))
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const exportHistoryToCSV = () => {
    const headers = ['Timestamp', 'Asset Pair', 'Position', 'Investment', 'Leverage', 'Net Profit', 'Return', 'Trigger Reason']
    const rows = tradeHistory.map(trade => [
      trade.date,
      trade.pair,
      trade.type,
      trade.investment || `${getCurrencySymbol(trade.pair)}${tradeInvestment.toLocaleString()}`,
      trade.leverage,
      trade.profit,
      trade.returnPct,
      trade.status
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `trade_ledger_${Date.now()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const clearTradeHistory = () => {
    if (window.confirm('Are you sure you want to clear all trade history entries?')) {
      setTradeHistory([])
      localStorage.setItem('tradeHistory', JSON.stringify([]))
    }
  }

  const resetWalletBalance = () => {
    if (window.confirm('Reset wallet total balance back to starting $10,000.00?')) {
      realizedBalanceRef.current = 10000.00
      realizedTodayPnlRef.current = 0.00
      setRealizedBalance(10000.00)
      setRealizedTodayPnl(0.00)
      setBalance(10000.00)
      setTodayPnl(0.00)
    }
  }

  const clearLogs = () => {
    setLogs([])
    localStorage.setItem('tradeLogs', JSON.stringify([]))
  }

  const totalLedgerPnl = tradeHistory.reduce((acc, t) => {
    const val = parseFloat(t.profit.replace('+$', '').replace('-$', '-').replace('$', '')) || 0
    return acc + val
  }, 0)

  const totalLedgerVolume = tradeHistory.reduce((acc, t) => {
    const val = parseFloat((t.investment || '0').replace('$', '').replace(/,/g, '')) || 0
    return acc + val
  }, 0)

  const winCount = tradeHistory.filter(t => t.status === 'TARGET HIT' || t.profit.startsWith('+')).length
  const totalCount = tradeHistory.length
  const winRatePct = totalCount > 0 ? ((winCount / totalCount) * 100).toFixed(1) : '0.0'

  return (
    <div className="selection:bg-primary-container selection:text-on-primary-container font-body-md md:overflow-hidden min-h-screen flex flex-col md:flex-row relative text-[#dde3e8] bg-[#080C18]">
      {/* Red Flash Overlay */}
      {redFlash && <div className="red-flash-overlay"></div>}
      
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-50 bg-[#0A0F1D] border-r border-[#1E2D4A] w-64 select-none">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="text-white font-bold text-xl font-headline">◈</span>
          </div>
          <div>
            <h2 className="text-lg font-headline font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">AI Terminal</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Advanced Trading</p>
          </div>
        </div>
        
        <nav className="flex-1 mt-4 space-y-1 px-3">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              currentTab === 'dashboard' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-[#162035]'
            }`}
          >
            <span className="material-symbols-outlined text-xl">dashboard</span>
            <span className="text-sm font-semibold">Main Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentTab('chart')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              currentTab === 'chart' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-[#162035]'
            }`}
          >
            <span className="material-symbols-outlined text-xl">show_chart</span>
            <span className="text-sm font-semibold">Chart Analysis</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('algorithms')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              currentTab === 'algorithms' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-[#162035]'
            }`}
          >
            <span className="material-symbols-outlined text-xl">memory</span>
            <span className="text-sm font-semibold">Algorithms</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('history')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              currentTab === 'history' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-[#162035]'
            }`}
          >
            <span className="material-symbols-outlined text-xl">list_alt</span>
            <span className="text-sm font-semibold">History</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('signals')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              currentTab === 'signals' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-[#162035]'
            }`}
          >
            <span className="material-symbols-outlined text-xl">insights</span>
            <span className="text-sm font-semibold">Signals</span>
          </button>
        </nav>
        
        <div className="p-6 border-t border-[#1E2D4A] bg-[#080C18]/50">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full border-2 border-slate-700 overflow-hidden hover:border-cyan-400 transition-colors cursor-pointer group">
              <img
                alt="Profile"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEg3W3OuO0bYVio4d9mT-JCwxLt-n5vp-rqUXG_kUeJ9-_EoorWE5QpfdQdB9wDeepDz8F35PPqZKhSeCTeQgIXc5yDKcOcACerpSVmnikTyzTzEtmJvO69KHIomlzY03DlSzlExrXxd8R3cc43yZwaxiIFIR0Axop4E4CqSbmpW0Q7p-Ds-_48hi7Sr6QrkWvJfrvdvswdKvjZBIOtFoAjJ12kWqELkZIGX2cGTySCeHGMHI3i9y47A"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-white capitalize">{user?.name || 'test'}</p>
              <p className="text-[10px] text-cyan-500 font-bold">PROFESSIONAL</p>
            </div>
          </div>
          <button
            onClick={handleEmergencyStop}
            className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/50 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all emergency-pulse active:scale-95 cursor-pointer"
          >
            Emergency Stop
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="md:ml-64 flex flex-col min-h-screen md:h-screen md:overflow-hidden flex-1 min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <header className={`glass-nav h-16 px-2 md:px-8 flex items-center justify-between sticky top-0 z-40 waterfall-reveal w-full max-w-full ${isMounted ? 'active' : ''}`}>
          <div className="flex items-center space-x-1.5 md:space-x-8">
            <h1 className="text-lg md:text-xl font-headline font-bold flex items-center">
              <span className="text-cyan-400 mr-1 md:mr-2 text-xl md:text-2xl">◈</span>
              <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent hidden md:inline-block">CryptoAI Trader</span>
            </h1>
            <div className="mode-pill flex items-center p-0.5 md:p-1">
              <button
                id="btn-demo"
                onClick={() => handleModeSwitch('demo')}
                className={`px-2.5 py-1 md:px-6 md:py-1.5 rounded-full text-[10px] md:text-[11px] font-bold transition-all cursor-pointer ${
                  activeMode === 'demo' ? 'active-demo' : 'text-slate-500 hover:text-white'
                }`}
              >
                DEMO
              </button>
              <button
                id="btn-real"
                onClick={() => handleModeSwitch('real')}
                className={`px-2.5 py-1 md:px-6 md:py-1.5 rounded-full text-[10px] md:text-[11px] font-bold transition-all cursor-pointer ${
                  activeMode === 'real'
                    ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                REAL
              </button>
            </div>
            <div className="flex items-center px-2 py-0.5 md:px-2.5 md:py-1 bg-[#111827] border border-[#1E2D4A] rounded-full text-[10px] md:text-xs font-mono-data text-white">
              <span className="text-slate-400 mr-1 text-[9px] md:text-[10px] uppercase font-bold hidden sm:inline">BAL:</span>
              <span className="font-bold text-cyan-400">{getCurrencySymbol()}{balance.toLocaleString(getCurrencySymbol() === '$' ? 'en-US' : 'en-IN', { minimumFractionDigits: 0 })}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 md:space-x-4">
            <div className="flex items-center space-x-0.5 md:space-x-3 pr-1 md:pr-4 md:border-r border-[#1E2D4A] relative">
              {/* Notifications Popover */}
              <div className="relative" ref={notificationsRef}>
                <button 
                  onClick={() => {
                    setIsNotificationsOpen(prev => !prev);
                    setHasUnreadNotifications(false);
                    setIsSettingsOpen(false); // Close settings
                  }}
                  className="relative p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">notifications</span>
                  {hasUnreadNotifications && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>
                
                {/* Popover Card */}
                <div className={`absolute right-0 mt-2 w-80 rounded-xl border border-[#1E2D4A] bg-[#0F1629] p-4 shadow-2xl transition-all duration-200 z-50 ${
                  isNotificationsOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}>
                  <div className="flex justify-between items-center mb-3 border-b border-[#1E2D4A] pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">AI Directives</span>
                    <button 
                      onClick={() => setNotifications([])}
                      className="text-[10px] text-slate-500 hover:text-white"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No new notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="text-xs border-b border-[#1E2D4A]/40 pb-2 last:border-0 last:pb-0">
                          <p className="font-bold text-white mb-0.5">{n.title}</p>
                          <p className="text-slate-400 text-[11px] leading-relaxed">{n.desc}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Settings Popover */}
              <div className="relative" ref={settingsRef}>
                <button 
                  onClick={() => {
                    setIsSettingsOpen(prev => !prev);
                    setIsNotificationsOpen(false); // Close notifications
                  }}
                  className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">settings</span>
                </button>
                
                {/* Popover Card (Desktop) */}
                <div className={`hidden md:block absolute right-0 top-full mt-2 w-[420px] max-h-[85vh] overflow-y-auto rounded-xl border border-[#1E2D4A] bg-[#0F1629] p-6 shadow-2xl transition-all duration-200 z-50 ${
                  isSettingsOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                }`}>
                  <div className="flex justify-between items-center mb-4 border-b border-[#1E2D4A] pb-3">
                    <div>
                      <span className="text-sm font-bold text-white uppercase tracking-wider">Terminal Parameters</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">Customize risk manager metrics & market targets.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(false)}
                      className="p-1 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg cursor-pointer md:hidden"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4 text-xs">
                    {/* Auto-Trade Switch */}
                    <div className="flex items-center justify-between border-b border-[#1E2D4A]/50 pb-3">
                      <div>
                        <span className="text-slate-200 font-bold block">Auto-Trade System</span>
                        <p className="text-[9px] text-slate-500 mt-0.5">Toggle automated bot execution on or off.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={autoTrade}
                          onChange={(e) => setAutoTrade(e.target.checked)}
                          className="sr-only peer"
                          disabled={isEmergencyStopped}
                        />
                        <div className="w-12 h-6 bg-[#162035] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner"></div>
                        <div className="absolute -inset-2 rounded-full opacity-0 group-hover:opacity-100 peer-checked:bg-cyan-500/10 transition-all"></div>
                      </label>
                    </div>

                    {/* Custom Demo Balance (Only visible in Demo mode) */}
                    {activeMode === 'demo' && (
                      <div className="border-b border-[#1E2D4A]/50 pb-3">
                        <div className="flex justify-between mb-1.5">
                          <div>
                            <span className="text-slate-200 font-bold block">Edit Demo Balance</span>
                            <p className="text-[9px] text-slate-500 mt-0.5">Set a custom starting capital for testing.</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-500 font-bold">{getCurrencySymbol()}</span>
                          <input 
                            type="number"
                            min="1"
                            value={realizedBalance}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0
                              setRealizedBalance(val)
                              setBalance(val)
                              localStorage.setItem('realizedBalance', val.toString())
                            }}
                            className="w-full bg-[#162035] text-white border border-[#1E2D4A] rounded-lg p-2 text-xs font-mono-data focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>
                    )}

                    {/* Max Open Positions */}
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-slate-400">Max Open Positions</span>
                        <span className="text-cyan-400 font-bold">{maxOpenPositions}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={maxOpenPositions}
                        onChange={(e) => setMaxOpenPositions(parseInt(e.target.value))}
                        className="w-full accent-cyan-400 bg-slate-800 rounded-lg appearance-none h-1 cursor-pointer"
                      />
                    </div>

                    {/* Stop Loss Limit */}
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-slate-400">Stop Loss Limit</span>
                        <span className="text-red-400 font-bold">{stopLossLimit}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="5.0" 
                        step="0.1"
                        value={stopLossLimit}
                        onChange={(e) => setStopLossLimit(parseFloat(e.target.value))}
                        className="w-full accent-red-400 bg-slate-800 rounded-lg appearance-none h-1 cursor-pointer"
                      />
                    </div>

                    {/* Auto-Trade Pacing Speed */}
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-slate-400 font-bold">Auto-Trade Pacing Speed</span>
                        <span className="text-cyan-400 font-bold capitalize">{tradePacing}</span>
                      </div>
                      <select
                        value={tradePacing}
                        onChange={(e) => setTradePacing(e.target.value)}
                        className="w-full bg-[#162035] text-slate-200 border border-[#1E2D4A] rounded p-1.5 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        <option value="rapid">Rapid (Trades every 2-4 seconds - Testing)</option>
                        <option value="controlled">Controlled (Trades every 15-30 seconds - Demo)</option>
                        <option value="standard">Standard (Trades every 2-5 minutes - Live Pacing)</option>
                      </select>
                      <p className="text-[9px] text-slate-500 mt-1">
                        * Standard pacing is highly recommended for Real accounts to minimize broker trading fees.
                      </p>
                    </div>

                    {/* Desktop Browser Notifications */}
                    <div className="flex items-center justify-between border-t border-[#1E2D4A]/50 pt-3">
                      <span className="text-slate-400">Desktop Notifications</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={enableDesktopNotifications}
                          onChange={(e) => setEnableDesktopNotifications(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#162035] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner"></div>
                      </label>
                    </div>

                    <div className="bg-[#111827] border border-[#1E2D4A] rounded-lg p-2 text-[10px] text-slate-400 space-y-1 mt-2">
                      <p className="font-bold text-slate-300">Direct Browser Alerts:</p>
                      <p className="text-slate-400">
                        When enabled, native desktop notification banners will display instantly for all auto-buys, stop-losses, and profit-target execution events.
                      </p>
                    </div>

                    <div className="flex flex-col space-y-1.5 pt-1 mt-1 mb-2">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window === 'undefined' || !('Notification' in window) || typeof Notification === 'undefined') {
                              setTestNotifStatus('❌ Not supported by mobile browser')
                              return
                            }
                            
                            setTestNotifStatus('Sending...')
                            
                            if (Notification.permission === 'denied') {
                              setTestNotifStatus('❌ Denied by browser settings')
                              return
                            }
                            
                            if (Notification.permission !== 'granted') {
                              Notification.requestPermission().then(perm => {
                                if (perm === 'granted') {
                                  new Notification("🔔 Notifications Enabled!", {
                                    body: "Direct trade alerts from CryptoAI Trader are active!"
                                  })
                                  setTestNotifStatus('✅ Sent!')
                                } else {
                                  setTestNotifStatus('❌ Permission denied')
                                }
                              })
                            } else {
                              new Notification("🔔 Test Notification", {
                                body: "Direct trade alerts from CryptoAI Trader are working perfectly!"
                              })
                              setTestNotifStatus('✅ Sent!')
                            }
                          }}
                          className="px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold hover:bg-cyan-500/20 cursor-pointer transition-all flex items-center space-x-1"
                        >
                          <span>🔔 Test Desktop Notification</span>
                        </button>
                        {testNotifStatus && (
                          <span className="text-[10px] font-mono-data text-cyan-400">{testNotifStatus}</span>
                        )}
                      </div>
                      {testNotifStatus.includes('✅') && (
                        <p className="text-[9px] text-slate-500">
                          If you don't see it, check your Windows "Do Not Disturb" or Chrome notification settings.
                        </p>
                      )}
                      {testNotifStatus.includes('❌ Denied') && (
                        <p className="text-[9px] text-red-400">
                          Please click the lock/settings icon next to "localhost:5173" in your browser address bar and set Notifications to <strong>Allow</strong>.
                        </p>
                      )}
                    </div>
                    <div className="border-t border-[#1E2D4A]/50 pt-3">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-slate-400">Trade Size (Investment)</span>
                        <span className="text-cyan-400 font-bold">{getCurrencySymbol()}{tradeInvestment.toLocaleString()}</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="5000" 
                        step="5"
                        value={tradeInvestment}
                        onChange={(e) => setTradeInvestment(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 bg-slate-800 rounded-lg appearance-none h-1 cursor-pointer mb-2.5"
                      />
                      <div className="grid grid-cols-6 gap-1">
                        {[10, 25, 50, 100, 500, 1000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setTradeInvestment(amt)}
                            className={`py-1 rounded text-[9px] font-mono-data border cursor-pointer transition-all text-center ${
                              tradeInvestment === amt ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'bg-[#162035] border-[#1E2D4A] text-slate-400 hover:text-white'
                            }`}
                          >
                            {getCurrencySymbol()}{amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Auto-Trade Mode (Rotation vs Single Selected Asset) */}
                    <div className="border-t border-[#1E2D4A]/50 pt-3 pb-2">
                      <span className="text-slate-400 block mb-2">Auto-Trade Selection Scope</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setAutoTradeMode('single')}
                          className={`py-1.5 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                            autoTradeMode === 'single'
                              ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 font-bold'
                              : 'bg-transparent border-[#1E2D4A] text-slate-400 hover:text-white'
                          }`}
                        >
                          Single Asset
                        </button>
                        <button
                          type="button"
                          onClick={() => setAutoTradeMode('rotation')}
                          className={`py-1.5 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                            autoTradeMode === 'rotation'
                              ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 font-bold'
                              : 'bg-transparent border-[#1E2D4A] text-slate-400 hover:text-white'
                          }`}
                        >
                          All Rotation
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1.5 leading-normal">
                        {autoTradeMode === 'single' 
                          ? 'Only trades the currently selected symbol on the dashboard.' 
                          : 'Automatically rotates and triggers trades across all enabled stock & crypto markets.'}
                      </p>
                    </div>

                    {/* Manual Market Filter */}
                    <div className="border-t border-[#1E2D4A]/50 pt-3 pb-2">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-slate-400 font-bold">Allowed Auto-Trade Markets</span>
                        <div className="space-x-2 text-[10px]">
                          <button 
                            type="button" 
                            onClick={() => setEnabledAutoTradeMarkets(['NIFTY 50', 'SENSEX', 'RELIANCE', 'TCS', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'AAPL', 'MSFT', 'TSLA', 'NVDA'])}
                            className="text-cyan-400 hover:underline cursor-pointer"
                          >
                            All
                          </button>
                          <span className="text-slate-600">|</span>
                          <button 
                            type="button" 
                            onClick={() => setEnabledAutoTradeMarkets([])}
                            className="text-slate-400 hover:text-white hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-500 mb-2 leading-normal">
                        Manually select which markets the AI is permitted to execute auto trades on.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-[#090D1A] rounded-lg border border-[#1E2D4A]/60">
                        {['NIFTY 50', 'SENSEX', 'RELIANCE', 'TCS', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'AAPL', 'MSFT', 'TSLA', 'NVDA'].map((m) => {
                          const isChecked = enabledAutoTradeMarkets.includes(m);
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setEnabledAutoTradeMarkets(prev => 
                                  prev.includes(m) ? prev.filter(item => item !== m) : [...prev, m]
                                )
                              }}
                              className={`flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-mono-data transition-all cursor-pointer border ${
                                isChecked 
                                  ? 'bg-cyan-500/15 border-cyan-400/80 text-cyan-300 font-bold' 
                                  : 'bg-transparent border-[#1E2D4A]/50 text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              <span className="truncate">{m}</span>
                              <span className="text-[10px]">{isChecked ? '✓' : ''}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* AI Alert Dispatchers (WhatsApp & Telegram) */}
                    <div className="border-t border-[#1E2D4A]/50 pt-3 pb-2 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold">AI Alert Dispatchers</span>
                        <span className="text-[9px] text-cyan-400 font-mono-data font-bold">REAL-TIME ALERTS</span>
                      </div>
                      
                      {/* WhatsApp Alerts Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">WhatsApp Alerts</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={enableWhatsapp}
                            onChange={(e) => setEnableWhatsapp(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-[#162035] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner"></div>
                        </label>
                      </div>

                      {enableWhatsapp && (
                        <div className="space-y-1.5 pl-3 border-l border-green-500/30">
                          <div>
                            <label className="text-[9px] text-slate-500 uppercase font-bold">WhatsApp Phone Number</label>
                            <input 
                              type="text" 
                              placeholder="e.g. +919876543210"
                              value={whatsappNumber}
                              onChange={(e) => setWhatsappNumber(e.target.value)}
                              className="w-full bg-[#090D1A] border border-[#1E2D4A] rounded-lg px-2 py-1 text-[11px] text-white font-mono-data outline-none focus:border-green-400"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-500 uppercase font-bold">CallMeBot API Key</label>
                            <input 
                              type="text" 
                              placeholder="e.g. 123456"
                              value={callmebotApikey}
                              onChange={(e) => setCallmebotApikey(e.target.value)}
                              className="w-full bg-[#090D1A] border border-[#1E2D4A] rounded-lg px-2 py-1 text-[11px] text-white font-mono-data outline-none focus:border-green-400"
                            />
                            <p className="text-[8px] text-slate-500 mt-0.5">
                              Get free API key from <a href="https://www.callmebot.com" target="_blank" rel="noreferrer" className="text-green-400 underline">CallMeBot</a>.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Telegram Alerts Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Telegram Alerts</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={enableTelegram}
                            onChange={(e) => setEnableTelegram(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-[#162035] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner"></div>
                        </label>
                      </div>

                      {enableTelegram && (
                        <div className="space-y-1.5 pl-3 border-l border-cyan-500/30">
                          <div>
                            <label className="text-[9px] text-slate-500 uppercase font-bold">Telegram Bot Token</label>
                            <input 
                              type="password" 
                              placeholder="e.g. 123456789:ABCdefGhI..."
                              value={telegramBotToken}
                              onChange={(e) => setTelegramBotToken(e.target.value)}
                              className="w-full bg-[#090D1A] border border-[#1E2D4A] rounded-lg px-2 py-1 text-[11px] text-white font-mono-data outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-500 uppercase font-bold">Telegram Chat ID</label>
                            <input 
                              type="text" 
                              placeholder="e.g. 987654321"
                              value={telegramChatId}
                              onChange={(e) => setTelegramChatId(e.target.value)}
                              className="w-full bg-[#090D1A] border border-[#1E2D4A] rounded-lg px-2 py-1 text-[11px] text-white font-mono-data outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Institutional Broker API Gateway Panel */}
                    <div className="border-t border-[#1E2D4A]/50 pt-3 pb-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold">Institutional Broker API Gateway</span>
                        <span className="text-[9px] text-[#00E676] font-mono-data font-bold">0ms LAG SYNC</span>
                      </div>
                      <p className="text-[9px] text-slate-500 leading-normal">
                        Connect your zero-delay live broker API keys for real-time order placement.
                      </p>
                      
                      <div className="space-y-1.5">
                        <div>
                          <label className="text-[9px] text-slate-500 uppercase font-bold">Broker Provider</label>
                          <select 
                            value={brokerGateway}
                            onChange={(e) => setBrokerGateway(e.target.value)}
                            className="w-full bg-[#090D1A] border border-[#1E2D4A] rounded-lg px-2 py-1 text-[11px] text-cyan-400 font-mono-data outline-none"
                          >
                            <option value="Binance Exchange API (Spot Trading)">Binance Exchange API (Spot Trading)</option>
                            <option value="Angel One SmartAPI (100% FREE Lifetime Access)">Angel One SmartAPI (100% FREE Lifetime)</option>
                            <option value="Shoonya by Finvasia (100% FREE & Zero Brokerage)">Shoonya Finvasia (100% FREE & Zero Commission)</option>
                            <option value="Upstox v2 API (Free Developer Tier)">Upstox v2 API (Free Tier)</option>
                            <option value="Zerodha Kite Connect API">Zerodha Kite Connect (Paid Credits)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-500 uppercase font-bold">API Key / App Code</label>
                          <input 
                            type="text" 
                            placeholder="e.g. kite_live_9482a..."
                            value={brokerApiKey}
                            onChange={(e) => setBrokerApiKey(e.target.value)}
                            className="w-full bg-[#090D1A] border border-[#1E2D4A] rounded-lg px-2 py-1 text-[11px] text-white font-mono-data outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-500 uppercase font-bold">API Secret / Access Token</label>
                          <input 
                            type="password" 
                            placeholder="••••••••••••••••••••"
                            value={brokerApiSecret}
                            onChange={(e) => setBrokerApiSecret(e.target.value)}
                            className="w-full bg-[#090D1A] border border-[#1E2D4A] rounded-lg px-2 py-1 text-[11px] text-white font-mono-data outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={async () => {
                        localStorage.setItem('brokerGateway', brokerGateway)
                        localStorage.setItem('brokerApiKey', brokerApiKey)
                        localStorage.setItem('brokerApiSecret', brokerApiSecret)
                        try {
                          const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : window.location.origin
                          await fetch(`${apiBase}/api/v1/auth/settings`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': token ? `Bearer ${token}` : ''
                            },
                            body: JSON.stringify({
                              broker_gateway: brokerGateway,
                              broker_api_key: brokerApiKey,
                              broker_api_secret: brokerApiSecret,
                              max_open_positions: maxOpenPositions,
                              stop_loss_limit: stopLossLimit,
                              profit_target: profitTarget,
                              trade_pacing: tradePacing,
                              enable_whatsapp: enableWhatsapp,
                              whatsapp_number: whatsappNumber,
                              callmebot_apikey: callmebotApikey,
                              telegram_bot_token: telegramBotToken,
                              telegram_chat_id: telegramChatId,
                              enable_telegram: enableTelegram
                            })
                          })
                          updateUser({
                            whatsapp: whatsappNumber,
                            callmebot_apikey: callmebotApikey,
                            telegram_bot_token: telegramBotToken,
                            telegram_chat_id: telegramChatId
                          })
                          await fetchRealBalance()
                        } catch (e) {
                          console.error('Failed to sync settings to backend:', e)
                        }
                        setIsSettingsOpen(false)
                      }}
                      className="w-full py-2 bg-cyan-400 text-black font-bold uppercase tracking-wider text-[10px] rounded-lg hover:bg-cyan-300 transition-colors cursor-pointer text-center"
                    >
                      Save & Sync API Keys
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div onClick={logout} className="flex items-center space-x-3 group cursor-pointer" title="Click to log out">
              <span className="text-xs font-mono-data text-slate-400 group-hover:text-cyan-400 transition-colors">LOGOUT</span>
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[10px] font-bold text-cyan-400 group-hover:ring-2 ring-cyan-500/30">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'TE'}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Pages Switcher */}
        <div className="flex-1 md:overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 pb-36 md:pb-32">
          
          {/* TAB 1: MAIN DASHBOARD */}
          {currentTab === 'dashboard' && (
            <>
              {/* REAL Mode Active Live Banner */}
              {activeMode === 'real' && (
                <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                  <div className="flex items-center space-x-3">
                    <span className="material-symbols-outlined text-red-500 text-2xl font-bold animate-pulse">cell_tower</span>
                    <div>
                      <h4 className="text-sm font-headline font-bold text-red-400 flex items-center space-x-2">
                        <span>🔴 REAL CAPITAL LIVE TRADING ACTIVE</span>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                      </h4>
                      <p className="text-xs text-slate-400">Your AI directives are routing live orders directly to broker exchange liquidity pools.</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-red-500 text-white font-mono-data font-bold text-[10px] rounded-lg uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                    LIVE EXCHANGE SYNCED
                  </span>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 my-2">
                {/* AI Signal Card */}
                <div className="premium-card rounded-xl p-4 md:p-6 flex flex-col h-auto md:h-56 justify-between">
                  <div className="flex justify-between items-start mb-2 md:mb-0">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">AI Signal Pulse</p>
                      <div className="flex items-baseline space-x-2">
                        {isEmergencyStopped ? (
                          <>
                            <span className="text-2xl md:text-3xl font-headline font-bold text-[#FF3D57]">HALT</span>
                            <span className="text-xs md:text-sm font-headline text-slate-500">/ LOCKDOWN</span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl md:text-3xl font-headline font-bold text-[#00E676]">BUY</span>
                            <span className="text-xs md:text-sm font-headline text-slate-500">/ LONG</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                      isEmergencyStopped 
                        ? 'bg-red-500/10 border border-red-500/30 text-red-500'
                        : isMarketClosed
                        ? 'bg-slate-500/10 border border-slate-500/30 text-slate-400'
                        : autoTrade ? 'bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676]' : 'bg-[#FFB300]/10 border border-[#FFB300]/30 text-[#FFB300]'
                    }`}>
                      {isEmergencyStopped ? 'HALTED' : isMarketClosed ? 'MARKET CLOSED' : autoTrade ? 'ACTIVE' : 'PAUSED'}
                    </div>
                  </div>
                  <div className="my-2 flex items-center justify-center">
                    <div className="orb-container">
                      <div 
                        className={`orb-core ${isEmergencyStopped ? 'animate-pulse' : ''}`} 
                        style={{ 
                          backgroundColor: isEmergencyStopped ? '#FF3D57' : (autoTrade ? '#00E676' : '#FFB300'), 
                          boxShadow: isEmergencyStopped ? '0 0 20px #FF3D57' : (autoTrade ? '0 0 20px #00E676' : '0 0 20px #FFB300') 
                        }}
                      ></div>
                      <div className="orb-ring" style={{ borderColor: isEmergencyStopped ? '#FF3D57' : (autoTrade ? '#00E676' : '#FFB300') }}></div>
                      <div className="orb-ring orb-ring-2" style={{ borderColor: isEmergencyStopped ? '#FF3D57' : (autoTrade ? '#00E676' : '#FFB300') }}></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-end mt-auto pt-2 border-t border-[#1E2D4A]/40">
                    <div>
                      <p className="text-[9px] text-slate-500 font-mono-data mb-0.5">CONFIDENCE</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-mono-data text-white">{isEmergencyStopped ? '0%' : '87%'}</span>
                        <div className="w-16 h-1 bg-[#111827] rounded-full overflow-hidden">
                          <div className="h-full bg-[#00E676]" style={{ width: isEmergencyStopped ? '0%' : '87%', backgroundColor: isEmergencyStopped ? '#FF3D57' : '#00E676' }}></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[9px] font-mono-data text-[#445577]">{isEmergencyStopped ? 'LOCKDOWN' : '6/9 ALGOS'}</p>
                  </div>
                </div>

                {/* Portfolio Card */}
                <div className="premium-card rounded-xl p-4 md:p-6 flex flex-col h-auto md:h-56 justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Portfolio</p>
                    <button
                      onClick={resetWalletBalance}
                      className="text-[9px] font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center space-x-1"
                      title={`Reset Wallet Balance back to starting ${getCurrencySymbol()}${10000.00.toLocaleString(getCurrencySymbol() === '$' ? 'en-US' : 'en-IN')}`}
                    >
                      <span className="material-symbols-outlined text-[12px]">restart_alt</span>
                      <span>Reset</span>
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Total Balance</p>
                    <h2 className={`text-2xl md:text-3xl font-mono-data font-bold text-white tracking-tight ${isPriceFlashing ? 'price-flash' : ''}`}>
                      {getCurrencySymbol()}{balance.toLocaleString(getCurrencySymbol() === '$' ? 'en-US' : 'en-IN', { minimumFractionDigits: 2 })}
                    </h2>
                  </div>
                  <div className="my-3 grid grid-cols-2 gap-2">
                    <div className="p-2 md:p-3 rounded-lg border border-[#1E2D4A] bg-[#080C18]/40">
                      <p className="text-[8px] md:text-[9px] text-slate-500 uppercase font-bold mb-0.5">Today P&L</p>
                      <div className="flex items-center space-x-1">
                        <span className={`text-xs md:text-sm font-mono-data ${todayPnl >= 0 ? 'text-[#00E676]' : 'text-[#FF3D57]'}`}>
                          {todayPnl >= 0 ? '+' : '-'}{getCurrencySymbol()}{Math.abs(todayPnl).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 md:p-3 rounded-lg border border-[#1E2D4A] bg-[#080C18]/40">
                      <p className="text-[8px] md:text-[9px] text-slate-500 uppercase font-bold mb-0.5">Win Rate</p>
                      <p className="text-xs md:text-sm font-mono-data text-cyan-400">68.4%</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-[9px] font-mono-data text-slate-500 pt-1 border-t border-[#1E2D4A]/40">
                    <span>LEVERAGE: 10X</span>
                    <span>STATUS: OPTIMIZED</span>
                  </div>
                </div>

                {/* Target Card (Profit Targets 1.2X, 1.5X, 2.0X) */}
                <div className="premium-card rounded-xl p-4 md:p-6 flex flex-col h-auto md:h-56 justify-between sm:col-span-2 md:col-span-1">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Profit Targets</p>
                    <span className="material-symbols-outlined text-cyan-400 text-sm">track_changes</span>
                  </div>
                  <div className="flex space-x-2 mb-3 select-none">
                    {['1.2X', '1.5X', '2.0X'].map((target) => (
                      <button
                        key={target}
                        onClick={() => setProfitTarget(target)}
                        className={`flex-1 py-1.5 md:py-2 rounded-lg border text-[10px] md:text-[11px] font-bold cursor-pointer transition-all duration-300 ${
                          profitTarget === target
                            ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400 shadow-[0_0_15px_rgba(0,200,255,0.15)]'
                            : 'border-[#1E2D4A] text-slate-500 hover:text-white'
                        }`}
                      >
                        {target}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-400">BTC Position</span>
                        <span className="text-white font-mono-data">74%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#111827] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shimmer-sweep" style={{ width: '74%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-400">ETH Position</span>
                        <span className="text-white font-mono-data">42%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#111827] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shimmer-sweep" style={{ width: '42%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Ticker Selector Bar */}
              <div className="flex items-center space-x-2 overflow-x-auto py-1 my-2 no-scrollbar">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pr-1 flex items-center">
                  <span className="material-symbols-outlined text-xs mr-1 text-cyan-400">show_chart</span>
                  Markets:
                </span>
                {['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'NIFTY 50', 'RELIANCE', 'TCS'].map((pair) => (
                  <button
                    key={pair}
                    onClick={() => setSelectedSymbol(pair)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      selectedSymbol === pair
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,200,255,0.2)]'
                        : 'bg-[#0A0F1D] border-[#1E2D4A] text-slate-400 hover:text-white'
                    }`}
                  >
                    {pair}
                  </button>
                ))}
              </div>

              {/* Main Chart Section */}
              <section className="premium-card rounded-xl overflow-hidden h-[340px] md:h-[540px] flex flex-col my-2">
                <div className="h-14 flex items-center justify-between px-4 md:px-6 bg-[#0A0F1D] border-b border-[#1E2D4A] relative select-none">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] font-bold text-black font-headline">
                        {selectedSymbol.includes('BTC') ? '₿' : selectedSymbol.includes('ETH') ? 'Ξ' : selectedSymbol.includes('SOL') ? '◎' : 'S'}
                      </div>
                      <span className="text-sm font-bold text-white tracking-wide">{selectedSymbol}</span>
                      {isMarketClosed ? (
                        <span className="px-2 py-0.5 rounded bg-slate-500/20 text-slate-400 text-[9px] font-bold border border-slate-500/30 hidden sm:inline-block">
                          MARKET CLOSED (OFF-HOURS)
                        </span>
                      ) : (
                        <div className={`w-2 h-2 rounded-full animate-pulse ${isEmergencyStopped ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-[#00E676] shadow-[0_0_8px_#00E676]'}`}></div>
                      )}
                    </div>
                    
                    {/* Live OHLC hover indicators */}
                    {hoveredCandleData && (
                      <div className="flex items-center space-x-3 text-[11px] font-mono-data text-slate-400 pl-4 border-l border-[#1E2D4A] ml-4 hidden lg:flex">
                        <span>O: <span className={hoveredCandleData.close >= hoveredCandleData.open ? 'text-[#00E676]' : 'text-[#FF3D57]'}>{hoveredCandleData.open.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                        <span>H: <span className="text-white">{hoveredCandleData.high.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                        <span>L: <span className="text-white">{hoveredCandleData.low.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                        <span>C: <span className={hoveredCandleData.close >= hoveredCandleData.open ? 'text-[#00E676]' : 'text-[#FF3D57]'}>{hoveredCandleData.close.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 md:space-x-4 relative h-full">
                    {/* Zoom Buttons */}
                    <div className="flex items-center space-x-1 pr-2 md:pr-4 border-r border-[#1E2D4A] h-2/3">
                      <button 
                        onClick={() => setZoomLevel(prev => Math.max(15, prev - 5))}
                        className="w-7 h-7 rounded bg-[#162035] hover:bg-[#1E2D4A] flex items-center justify-center text-cyan-400 cursor-pointer transition-all"
                        title="Zoom In (Fewer Candles)"
                      >
                        <span className="material-symbols-outlined text-base">zoom_in</span>
                      </button>
                      <button 
                        onClick={() => setZoomLevel(prev => Math.min(80, prev + 5))}
                        className="w-7 h-7 rounded bg-[#162035] hover:bg-[#1E2D4A] flex items-center justify-center text-cyan-400 cursor-pointer transition-all"
                        title="Zoom Out (More Candles)"
                      >
                        <span className="material-symbols-outlined text-base">zoom_out</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-1 bg-[#111827] p-1 rounded-lg border border-[#1E2D4A] h-9 overflow-x-auto max-w-[160px] md:max-w-none">
                      {['1s', '1m', '5m', '15m', '1h', '1d'].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setTimeframe(tf)}
                          className={`px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] font-bold rounded transition-all cursor-pointer uppercase ${
                            timeframe === tf 
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                              : 'text-slate-400 hover:text-white hover:bg-[#162035]'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-1 chart-container relative overflow-hidden bg-[#080C18]">
                  <canvas 
                    ref={canvasRef} 
                    className="w-full h-full block cursor-crosshair"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onWheel={handleWheel}
                  />
                </div>

                <div className="h-10 bg-[#0A0F1D] border-t border-[#1E2D4A] px-4 md:px-6 flex items-center justify-between text-[10px] font-mono-data text-slate-500 select-none">
                  <div className="flex space-x-4 md:space-x-6">
                    {hoveredCandleData ? (
                      <>
                        <span>O: <span className="text-white">${hoveredCandleData.open.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                        <span>C: <span className="text-white">${hoveredCandleData.close.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                      </>
                    ) : (
                      <span>Live Real-Time Trading Stream</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${isEmergencyStopped ? 'bg-red-500' : 'bg-cyan-500'}`}></span>
                    <span>{isEmergencyStopped ? 'OFFLINE' : 'LIVE'}</span>
                  </div>
                </div>
              </section>

              {/* Emergency Stop Warning Banner */}
              {isEmergencyStopped && (
                <div className="bg-red-500/20 border border-red-500/50 px-6 py-3 rounded-xl text-xs font-bold text-red-400 flex items-center justify-between animate-pulse">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">warning</span>
                    EMERGENCY SHUTDOWN ACTIVE: Trading stream paused. Auto-buy/sell halted and open positions liquidated.
                  </span>
                  <button 
                    onClick={handleEmergencyStop}
                    className="px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer"
                  >
                    Reset System
                  </button>
                </div>
              )}

              {/* Bottom Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* AI Model Health */}
                <div className="premium-card rounded-xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Model Health</p>
                    <span className="text-[10px] text-[#00E676] font-bold bg-[#00E676]/10 px-2 py-0.5 rounded border border-[#00E676]/30">CONSENSUS BUY</span>
                  </div>
                  <div className="space-y-4">
                    {algoMetrics.map((item, idx) => (
                      <div key={idx} className="group hover:bg-[#162035] p-2 rounded transition-colors cursor-pointer">
                        <div className="flex justify-between items-center text-[11px] mb-2">
                          <span className="text-slate-300">{item.name}</span>
                          <span className="font-mono-data text-cyan-400 group-hover:text-white transition-colors">{item.val}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#111827] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-600/30 to-cyan-400 transition-all duration-[800ms] ease-out"
                            style={{ width: `${item.currentWidth}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trade Log */}
                <div className="premium-card rounded-xl p-6 h-[340px] flex flex-col">
                  <div className="flex justify-between items-center mb-6 select-none">
                    <div className="flex items-center space-x-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${autoTrade ? 'bg-[#00E676] animate-pulse' : 'bg-amber-500'}`}></div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Execution Log</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button onClick={clearLogs} className="text-[10px] text-red-400 hover:underline cursor-pointer">Clear Log</button>
                      <button onClick={exportHistoryToCSV} className="text-[10px] text-cyan-400 hover:underline cursor-pointer">Export CSV</button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className={`flex items-center justify-between p-3 bg-[#111827]/40 rounded border-l-2 ${
                          log.type === 'buy'
                            ? 'border-[#00E676]'
                            : log.type === 'sell'
                            ? 'border-red-500'
                            : 'border-yellow-500 bg-red-950/20'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <span className="text-[10px] text-slate-500 font-mono-data">{log.time}</span>
                          <div>
                            <p className={`text-[11px] font-bold uppercase ${log.type === 'emergency' ? 'text-red-500' : 'text-white'}`}>
                              {log.action}
                            </p>
                            <p className="text-[9px] text-slate-500">{log.qty}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-[11px] font-mono-data ${log.pnl.startsWith('+') ? 'text-[#00E676]' : log.pnl.startsWith('-') ? 'text-red-500' : 'text-slate-400'}`}>
                            {log.pnl}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB: DEDICATED GRAPH ANALYSIS */}
          {currentTab === 'chart' && (
            <div className="space-y-4">
              {/* Market Ticker Selector Bar */}
              <div className="flex items-center space-x-2 overflow-x-auto py-2 px-1 bg-[#0A0F1D] rounded-xl border border-[#1E2D4A] no-scrollbar">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center whitespace-nowrap">
                  <span className="material-symbols-outlined text-sm mr-1 text-cyan-400">show_chart</span>
                  Select Market:
                </span>
                {['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'NIFTY 50', 'RELIANCE', 'TCS'].map((pair) => (
                  <button
                    key={pair}
                    onClick={() => setSelectedSymbol(pair)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      selectedSymbol === pair
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,200,255,0.2)]'
                        : 'bg-[#111827] border-[#1E2D4A] text-slate-400 hover:text-white'
                    }`}
                  >
                    {pair}
                  </button>
                ))}
              </div>

              {/* Full-Screen Technical Analysis Chart */}
              <section className="premium-card rounded-xl overflow-hidden h-[480px] md:h-[620px] flex flex-col shadow-2xl">
                <div className="h-14 flex items-center justify-between px-4 md:px-6 bg-[#0A0F1D] border-b border-[#1E2D4A] relative select-none">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-black font-headline shadow-md">
                        {selectedSymbol.includes('BTC') ? '₿' : selectedSymbol.includes('ETH') ? 'Ξ' : selectedSymbol.includes('SOL') ? '◎' : 'S'}
                      </div>
                      <div>
                        <span className="text-base font-bold text-white tracking-wide">{selectedSymbol}</span>
                        <span className="text-[9px] text-slate-400 block font-mono-data">TECHNICAL ANALYSIS STREAM</span>
                      </div>
                    </div>
                    
                    {/* Live OHLC hover indicators */}
                    {hoveredCandleData && (
                      <div className="flex items-center space-x-3 text-[11px] font-mono-data text-slate-400 pl-4 border-l border-[#1E2D4A] ml-4 hidden lg:flex">
                        <span>O: <span className={hoveredCandleData.close >= hoveredCandleData.open ? 'text-[#00E676]' : 'text-[#FF3D57]'}>{hoveredCandleData.open.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                        <span>H: <span className="text-white">{hoveredCandleData.high.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                        <span>L: <span className="text-white">{hoveredCandleData.low.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                        <span>C: <span className={hoveredCandleData.close >= hoveredCandleData.open ? 'text-[#00E676]' : 'text-[#FF3D57]'}>{hoveredCandleData.close.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 md:space-x-4 relative h-full">
                    {/* Zoom Buttons */}
                    <div className="flex items-center space-x-1 pr-2 md:pr-4 border-r border-[#1E2D4A] h-2/3">
                      <button 
                        onClick={() => setZoomLevel(prev => Math.max(15, prev - 5))}
                        className="w-7 h-7 rounded bg-[#162035] hover:bg-[#1E2D4A] flex items-center justify-center text-cyan-400 cursor-pointer transition-all"
                        title="Zoom In (Fewer Candles)"
                      >
                        <span className="material-symbols-outlined text-base">zoom_in</span>
                      </button>
                      <button 
                        onClick={() => setZoomLevel(prev => Math.min(80, prev + 5))}
                        className="w-7 h-7 rounded bg-[#162035] hover:bg-[#1E2D4A] flex items-center justify-center text-cyan-400 cursor-pointer transition-all"
                        title="Zoom Out (More Candles)"
                      >
                        <span className="material-symbols-outlined text-base">zoom_out</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-1 bg-[#111827] p-1 rounded-lg border border-[#1E2D4A] h-9 overflow-x-auto max-w-[160px] md:max-w-none">
                      {['1s', '1m', '5m', '15m', '1h', '1d'].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setTimeframe(tf)}
                          className={`px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] font-bold rounded transition-all cursor-pointer uppercase ${
                            timeframe === tf 
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                              : 'text-slate-400 hover:text-white hover:bg-[#162035]'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-1 chart-container relative overflow-hidden bg-[#080C18]">
                  <canvas 
                    ref={canvasRef} 
                    className="w-full h-full block cursor-crosshair"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onWheel={handleWheel}
                  />
                </div>

                <div className="h-10 bg-[#0A0F1D] border-t border-[#1E2D4A] px-4 md:px-6 flex items-center justify-between text-[10px] font-mono-data text-slate-500 select-none">
                  <div className="flex space-x-4 md:space-x-6">
                    {hoveredCandleData ? (
                      <>
                        <span>O: <span className="text-white">${hoveredCandleData.open.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                        <span>C: <span className="text-white">${hoveredCandleData.close.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                      </>
                    ) : (
                      <span>Live Real-Time Candlestick Chart Stream</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${isEmergencyStopped ? 'bg-red-500' : 'bg-[#00E676]'}`}></span>
                    <span className="font-bold text-white">{isEmergencyStopped ? 'OFFLINE' : 'LIVE ACCURATE DATA'}</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: ALGORITHMS HUD */}
          {currentTab === 'algorithms' && (
            <div className="space-y-4">
              {/* Top Summary Card */}
              <div className="premium-card rounded-xl p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div>
                    <h2 className="text-lg md:text-xl font-headline font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-cyan-400 text-xl md:text-2xl">memory</span>
                      <span>9-Algo Consensus Engine</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Weighted neural networks aggregating real-time parameters.</p>
                  </div>
                  <button
                    onClick={startRetraining}
                    disabled={isRetraining}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider hover:bg-cyan-300 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">{isRetraining ? 'sync' : 'auto_mode'}</span>
                    <span>{isRetraining ? `Retraining (${retrainProgress}%)` : 'Retrain Ensemble'}</span>
                  </button>
                </div>

                {isRetraining && (
                  <div className="mb-4 h-2 w-full bg-[#111827] rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 transition-all duration-200" style={{ width: `${retrainProgress}%` }}></div>
                  </div>
                )}

                {/* Live Consensus Overview Stats */}
                <div className="grid grid-cols-3 gap-2 md:gap-4 my-3 p-3 rounded-xl border border-[#1E2D4A] bg-[#080C18]/60">
                  <div className="text-center">
                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold">Consensus</p>
                    <p className="text-xs md:text-sm font-bold text-[#00E676] font-mono-data mt-0.5">BUY / LONG</p>
                  </div>
                  <div className="text-center border-x border-[#1E2D4A] px-1">
                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold">Confidence</p>
                    <p className="text-xs md:text-sm font-bold text-white font-mono-data mt-0.5">87.4%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold">Active Models</p>
                    <p className="text-xs md:text-sm font-bold text-cyan-400 font-mono-data mt-0.5">9 / 9</p>
                  </div>
                </div>

                {/* 9-Algo Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                  {algoMetrics.map((algo, i) => (
                    <div key={i} className="p-3.5 rounded-xl border border-[#1E2D4A] bg-[#0F1629] hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="material-symbols-outlined text-cyan-400 text-lg">psychology</span>
                          <p className="text-xs font-bold text-white truncate max-w-[130px]">{algo.name}</p>
                        </div>
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border ${
                          algo.status === 'ACTIVE' 
                            ? 'bg-[#00E676]/10 border-[#00E676]/30 text-[#00E676]' 
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                        }`}>
                          {algo.status}
                        </span>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-[#1E2D4A]/40">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Voting Weight:</span>
                          <span className="font-mono-data text-white font-bold">{algo.weight}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Model Accuracy:</span>
                          <span className="font-mono-data text-cyan-400 font-bold">{algo.val}%</span>
                        </div>
                        <div className="h-1 w-full bg-[#111827] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${algo.val}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRADE HISTORY LOG */}
          {currentTab === 'history' && (
            <div className="premium-card rounded-xl p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-headline font-bold text-white">Realized Trade Ledger</h2>
                    <p className="text-xs text-slate-400 mt-1">Audit log of all processed auto-buys and auto-sells.</p>
                  </div>
                  <div className="flex items-center space-x-2 md:space-x-3 w-full sm:w-auto justify-end">
                    <button
                      onClick={clearTradeHistory}
                      className="flex items-center space-x-1 py-1.5 px-2.5 md:py-2 md:px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold uppercase tracking-wider text-[10px] md:text-[11px] rounded-lg transition-colors cursor-pointer"
                      title="Clear all trade history logs"
                    >
                      <span className="material-symbols-outlined text-xs md:text-sm font-bold">delete</span>
                      <span>Clear History</span>
                    </button>
                    <button
                      onClick={exportHistoryToCSV}
                      className="flex items-center space-x-1.5 py-1.5 px-3 md:py-2 md:px-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-wider text-[10px] md:text-[11px] rounded-lg transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs md:text-sm font-bold">download</span>
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl border border-[#1E2D4A] bg-[#080C18]/60 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Realized Net P&L Amount</p>
                      <p className={`text-xl font-mono-data font-bold mt-1 ${totalLedgerPnl >= 0 ? 'text-[#00E676]' : 'text-red-500'}`}>
                        {totalLedgerPnl >= 0 ? '+' : '-'}{getCurrencySymbol()}{Math.abs(totalLedgerPnl).toFixed(2)}
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${totalLedgerPnl >= 0 ? 'bg-[#00E676]/10 text-[#00E676]' : 'bg-red-500/10 text-red-500'}`}>
                      <span className="material-symbols-outlined">{totalLedgerPnl >= 0 ? 'trending_up' : 'trending_down'}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-[#1E2D4A] bg-[#080C18]/60 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Total Capital Invested</p>
                      <p className="text-xl font-mono-data font-bold text-cyan-400 mt-1">
                        {getCurrencySymbol()}{totalLedgerVolume.toLocaleString(getCurrencySymbol() === '$' ? 'en-US' : 'en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <span className="material-symbols-outlined">account_balance_wallet</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-[#1E2D4A] bg-[#080C18]/60 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Ledger Win Rate</p>
                      <p className="text-xl font-mono-data font-bold text-white mt-1">
                        {winRatePct}% <span className="text-xs text-slate-500 font-normal">({winCount}/{totalCount} wins)</span>
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
                      <span className="material-symbols-outlined">analytics</span>
                    </div>
                  </div>
                </div>

                {tradeHistory.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-[#1E2D4A] rounded-xl">
                    <span className="material-symbols-outlined text-slate-600 text-4xl mb-2">history</span>
                    <p className="text-sm font-bold text-slate-400">Trade Ledger is Clear</p>
                    <p className="text-xs text-slate-500 mt-1">New auto-trades for your allowed markets will be recorded here automatically.</p>
                  </div>
                ) : (
                  <>
                    {/* Top Pagination Controls */}
                    {tradeHistory.length > 0 && (() => {
                      const itemsPerPage = 10
                      const totalHistoryPages = Math.max(1, Math.ceil(tradeHistory.length / itemsPerPage))
                      return (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 px-2 sm:px-4 border-b border-[#1E2D4A] text-xs text-slate-400 mb-3">
                          <div className="text-[11px] sm:text-xs text-center sm:text-left font-mono-data">
                            Showing {tradeHistory.length > 0 ? (historyPage - 1) * itemsPerPage + 1 : 0} to {Math.min(historyPage * itemsPerPage, tradeHistory.length)} of {tradeHistory.length} trades
                          </div>
                          <div className="flex items-center space-x-1.5 sm:space-x-2">
                            <button
                              disabled={historyPage === 1}
                              onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                              className="px-2.5 py-1 text-xs bg-[#162035] border border-[#1E2D4A] rounded hover:bg-cyan-500/20 disabled:opacity-40 cursor-pointer text-slate-300 font-bold"
                            >
                              Prev
                            </button>
                            {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map(p => (
                              <button
                                key={p}
                                onClick={() => setHistoryPage(p)}
                                className={`px-2.5 py-1 text-xs rounded border font-bold font-mono-data cursor-pointer transition-all ${
                                  historyPage === p 
                                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                                    : 'bg-[#162035] border-[#1E2D4A] text-slate-300 hover:bg-cyan-500/20'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                            <button
                              disabled={historyPage === totalHistoryPages}
                              onClick={() => setHistoryPage(prev => Math.min(totalHistoryPages, prev + 1))}
                              className="px-2.5 py-1 text-xs bg-[#162035] border border-[#1E2D4A] rounded hover:bg-cyan-500/20 disabled:opacity-40 cursor-pointer text-slate-300 font-bold"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )
                    })()}

                    <div className="overflow-x-auto w-full max-w-full pb-4">
                      <table className="w-full text-left border-collapse min-w-[750px]">
                        <thead>
                          <tr className="border-b border-[#1E2D4A] text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                            <th className="py-4 px-6">Timestamp</th>
                            <th className="py-4 px-6">Asset Pair</th>
                            <th className="py-4 px-6">Position</th>
                            <th className="py-4 px-6">Investment</th>
                            <th className="py-4 px-6">Leverage</th>
                            <th className="py-4 px-6">Net Profit</th>
                            <th className="py-4 px-6">Return</th>
                            <th className="py-4 px-6">Trigger Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2D4A]/50 text-xs">
                          {(() => {
                            const itemsPerPage = 10
                            const currentPageHistory = tradeHistory.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage)
                            return currentPageHistory.map((trade) => (
                              <tr key={trade.id} className="hover:bg-[#162035] transition-colors">
                                <td className="py-4 px-6 font-mono-data text-slate-400">{trade.date}</td>
                                <td className="py-4 px-6 font-bold text-white">{trade.pair}</td>
                                <td className="py-4 px-6">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    trade.type === 'LONG' ? 'bg-[#00E676]/10 text-[#00E676]' : 'bg-red-500/10 text-red-500'
                                  }`}>
                                    {trade.type}
                                  </span>
                                </td>
                                <td className="py-4 px-6 font-mono-data text-cyan-400 font-bold">{trade.investment ? trade.investment : `${getCurrencySymbol(trade.pair)}${tradeInvestment.toLocaleString()}`}</td>
                                <td className="py-4 px-6 font-mono-data text-slate-400">{trade.leverage}</td>
                                <td className={`py-4 px-6 font-mono-data font-bold ${trade.profit.startsWith('+') ? 'text-[#00E676]' : 'text-red-500'}`}>
                                  {trade.profit ? trade.profit : '0.00'}
                                </td>
                                <td className={`py-4 px-6 font-mono-data ${trade.returnPct.startsWith('+') ? 'text-[#00E676]' : 'text-red-500'}`}>
                                  {trade.returnPct}
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    trade.status === 'TARGET HIT' 
                                      ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' 
                                      : trade.status === 'STOP LOSS'
                                      ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                  }`}>
                                    {trade.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          })()}
                        </tbody>
                      </table>
                    </div>
                    {/* Bottom Pagination Controls */}
                    {tradeHistory.length > 0 && (() => {
                      const itemsPerPage = 10
                      const totalHistoryPages = Math.max(1, Math.ceil(tradeHistory.length / itemsPerPage))
                      return (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 px-2 sm:px-4 border-t border-[#1E2D4A] text-xs text-slate-400 mt-2">
                          <div className="text-[11px] sm:text-xs text-center sm:text-left font-mono-data">
                            Showing {tradeHistory.length > 0 ? (historyPage - 1) * itemsPerPage + 1 : 0} to {Math.min(historyPage * itemsPerPage, tradeHistory.length)} of {tradeHistory.length} trades
                          </div>
                          <div className="flex items-center space-x-1.5 sm:space-x-2">
                            <button
                              disabled={historyPage === 1}
                              onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                              className="px-2.5 py-1 text-xs bg-[#162035] border border-[#1E2D4A] rounded hover:bg-cyan-500/20 disabled:opacity-40 cursor-pointer text-slate-300 font-bold"
                            >
                              Prev
                            </button>
                            {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map(p => (
                              <button
                                key={p}
                                onClick={() => setHistoryPage(p)}
                                className={`px-2.5 py-1 text-xs rounded border font-bold font-mono-data cursor-pointer transition-all ${
                                  historyPage === p 
                                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                                    : 'bg-[#162035] border-[#1E2D4A] text-slate-300 hover:bg-cyan-500/20'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                            <button
                              disabled={historyPage === totalHistoryPages}
                              onClick={() => setHistoryPage(prev => Math.min(totalHistoryPages, prev + 1))}
                              className="px-2.5 py-1 text-xs bg-[#162035] border border-[#1E2D4A] rounded hover:bg-cyan-500/20 disabled:opacity-40 cursor-pointer text-slate-300 font-bold"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )
                    })()}
                  </>
                )}
              </div>
          )}

          {/* TAB 4: LIVE AI SIGNALS */}
          {currentTab === 'signals' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 premium-card rounded-xl p-6">
                <h2 className="text-xl font-headline font-bold text-white mb-6">Recent Machine Learning Directives</h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-[#00E676]/30 bg-[#00E676]/5 flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 rounded-full bg-[#00E676] animate-ping"></span>
                        <p className="text-sm font-bold text-white">BTC / USDT BUY Directive</p>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">LSTM, XGBoost, and Transformer consensus hit 87% limit. Volatility parameter ATR is optimal at 2.1%.</p>
                      <span className="inline-block text-[9px] font-mono-data text-slate-500 mt-3">TRIGGERED AT: {new Date().toLocaleTimeString()}</span>
                    </div>
                    <span className="text-xs font-mono-data text-[#00E676] font-bold">+2.45% SIGNAL</span>
                  </div>

                  <div className="p-4 rounded-xl border border-[#1E2D4A] bg-[#0F1629] flex items-start justify-between opacity-70">
                    <div>
                      <p className="text-sm font-bold text-slate-300">ETH / USDT HOLD Directive</p>
                      <p className="text-xs text-slate-400 mt-2">Sentiment Analyzer indexes bearish macro news but LSTM signals local bounce. Waiting for consensus validation.</p>
                      <span className="inline-block text-[9px] font-mono-data text-slate-500 mt-3">TRIGGERED AT: 10:14:55 AM</span>
                    </div>
                    <span className="text-xs font-mono-data text-amber-500 font-bold">NEUTRAL HOLD</span>
                  </div>

                  <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/5 flex items-start justify-between opacity-60">
                    <div>
                      <p className="text-sm font-bold text-slate-300">SOL / USDT SELL Directive</p>
                      <p className="text-xs text-slate-400 mt-2">Monte Carlo distribution projects a 92% probability of short-term support breakdown. Order executed.</p>
                      <span className="inline-block text-[9px] font-mono-data text-slate-500 mt-3">TRIGGERED AT: 09:12:33 AM</span>
                    </div>
                    <span className="text-xs font-mono-data text-red-500 font-bold">-4.12% SIGNAL</span>
                  </div>
                </div>
              </div>

              <div className="premium-card rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-headline font-bold text-white mb-2">Consensus Gauge</h3>
                  <p className="text-xs text-slate-400 mb-6">AI consensus threshold rules mapping.</p>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-xs border-b border-[#1E2D4A] pb-2">
                      <span className="text-slate-400">Min Agreement</span>
                      <span className="text-white font-mono-data">6 / 9 Algos</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-[#1E2D4A] pb-2">
                      <span className="text-slate-400">Min Confidence</span>
                      <span className="text-white font-mono-data">70%</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-[#1E2D4A] pb-2">
                      <span className="text-slate-400">Max Volatility</span>
                      <span className="text-white font-mono-data">5.0% ATR</span>
                    </div>
                    <div className="flex justify-between text-xs pb-2">
                      <span className="text-slate-400">Stop Loss Limit</span>
                      <span className="text-red-400 font-mono-data">2.0%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-center">
                  <span className="material-symbols-outlined text-cyan-400 text-3xl mb-2">shield</span>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Risk Manager Active</p>
                  <p className="text-[10px] text-slate-400 mt-1">Live stop-loss and daily maximum drawdown monitoring is online.</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Action Bar Footer */}
        <footer className="h-20 glass-nav px-8 flex items-center justify-between fixed bottom-0 left-0 right-0 md:left-64 z-40 select-none">
          <div className="flex items-center space-x-12">
            <div className="relative" ref={symbolDropdownRef}>
              <button 
                onClick={() => setIsSymbolDropdownOpen(!isSymbolDropdownOpen)}
                className="flex items-center space-x-3 bg-[#0A0F1D] px-6 py-2.5 rounded-xl border border-[#1E2D4A] hover:border-cyan-400 transition-all cursor-pointer"
              >
                <span className="text-sm font-bold text-white">{selectedSymbol}</span>
                <span className={`material-symbols-outlined text-cyan-400 transition-transform ${isSymbolDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
              
              {isSymbolDropdownOpen && (
                <div className="absolute bottom-14 left-0 w-64 bg-[#0A0F1D] border border-[#1E2D4A] rounded-xl overflow-hidden shadow-2xl z-50 flex flex-col max-h-96">
                  {/* Search input field */}
                  <div className="p-3 border-b border-[#1E2D4A] bg-[#0E1527] flex flex-col gap-2">
                    <div className="flex items-center bg-[#111827] px-2 py-1.5 rounded border border-[#1E2D4A] focus-within:border-cyan-400">
                      <span className="material-symbols-outlined text-xs text-slate-500 mr-1 select-none">search</span>
                      <input 
                        type="text" 
                        placeholder="Search markets..." 
                        value={symbolSearchTerm}
                        onChange={(e) => setSymbolSearchTerm(e.target.value)}
                        className="w-full bg-transparent border-none text-[11px] text-white focus:ring-0 p-0"
                      />
                      {symbolSearchTerm && (
                        <button onClick={() => setSymbolSearchTerm('')} className="text-slate-500 hover:text-white cursor-pointer select-none">
                          <span className="material-symbols-outlined text-[10px]">close</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Add Custom Symbol input */}
                  <div className="p-3 border-b border-[#1E2D4A] bg-[#0E1527] flex flex-col gap-1.5">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Subscribe Ticker</div>
                    <div className="flex items-center gap-1 bg-[#111827] px-2 py-1 rounded border border-[#1E2D4A] focus-within:border-cyan-400">
                      <input 
                        type="text" 
                        placeholder="e.g. INFY.NS or BNB/USDT" 
                        value={customSymbolInput}
                        onChange={(e) => setCustomSymbolInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customSymbolInput.trim()) {
                            const sym = customSymbolInput.trim().toUpperCase()
                            setSelectedSymbol(sym)
                            setCustomSymbolInput('')
                            setSymbolSearchTerm('')
                            setIsSymbolDropdownOpen(false)
                          }
                        }}
                        className="w-full bg-transparent border-none text-[10px] text-white focus:ring-0 p-0"
                      />
                      <button 
                        onClick={() => {
                          if (customSymbolInput.trim()) {
                            const sym = customSymbolInput.trim().toUpperCase()
                            setSelectedSymbol(sym)
                            setCustomSymbolInput('')
                            setSymbolSearchTerm('')
                            setIsSymbolDropdownOpen(false)
                          }
                        }}
                        className="text-cyan-400 hover:text-white cursor-pointer select-none flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">add</span>
                      </button>
                    </div>
                  </div>

                  {/* Scrollable list items */}
                  <div className="overflow-y-auto flex-1 max-h-64">
                    {filteredCryptos.length > 0 && (
                      <>
                        <div className="p-2 border-b border-[#1E2D4A] bg-[#0E1527] text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">Cryptocurrencies</div>
                        {filteredCryptos.map((sym) => (
                          <button
                            key={sym}
                            onClick={() => {
                              setSelectedSymbol(sym)
                              setIsSymbolDropdownOpen(false)
                              setSymbolSearchTerm('')
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              selectedSymbol === sym ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-[#162035] hover:text-white'
                            }`}
                          >
                            <span>{sym}</span>
                            {selectedSymbol === sym && <span className="material-symbols-outlined text-xs">check</span>}
                          </button>
                        ))}
                      </>
                    )}
                    
                    {filteredIndianStocks.length > 0 && (
                      <>
                        <div className="p-2 border-b border-t border-[#1E2D4A] bg-[#0E1527] text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">Indian Stocks (NSE)</div>
                        {filteredIndianStocks.map((sym) => (
                          <button
                            key={sym}
                            onClick={() => {
                              setSelectedSymbol(sym)
                              setIsSymbolDropdownOpen(false)
                              setSymbolSearchTerm('')
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              selectedSymbol === sym ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-[#162035] hover:text-white'
                            }`}
                          >
                            <span>{sym}</span>
                            {selectedSymbol === sym && <span className="material-symbols-outlined text-xs">check</span>}
                          </button>
                        ))}
                      </>
                    )}

                    {filteredUSStocks.length > 0 && (
                      <>
                        <div className="p-2 border-b border-t border-[#1E2D4A] bg-[#0E1527] text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">US Stocks & Indices</div>
                        {filteredUSStocks.map((sym) => (
                          <button
                            key={sym}
                            onClick={() => {
                              setSelectedSymbol(sym)
                              setIsSymbolDropdownOpen(false)
                              setSymbolSearchTerm('')
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              selectedSymbol === sym ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-[#162035] hover:text-white'
                            }`}
                          >
                            <span>{sym}</span>
                            {selectedSymbol === sym && <span className="material-symbols-outlined text-xs">check</span>}
                          </button>
                        ))}
                      </>
                    )}

                    {filteredCryptos.length === 0 && filteredIndianStocks.length === 0 && filteredUSStocks.length === 0 && (
                      <div className="p-4 text-center text-[10px] text-slate-500">
                        No presets found.<br />Type name and click '+' above to subscribe dynamically.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-xs font-bold text-slate-400">Auto-Trade</span>
              <label className="relative inline-flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={autoTrade}
                  onChange={(e) => setAutoTrade(e.target.checked)}
                  className="sr-only peer"
                  disabled={isEmergencyStopped}
                />
                <div className="w-12 h-6 bg-[#162035] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner"></div>
                <div className="absolute -inset-2 rounded-full opacity-0 group-hover:opacity-100 peer-checked:bg-cyan-500/10 transition-all"></div>
              </label>
              <span className={`text-[10px] font-bold animate-pulse ${autoTrade ? 'text-cyan-400' : 'text-amber-500'}`}>
                {isEmergencyStopped ? 'HALTED' : (autoTrade ? 'ON-LINE' : 'PAUSED')}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-slate-500 font-bold">API STATUS</p>
              <p className="text-[11px] font-mono-data text-cyan-400">{isEmergencyStopped ? 'DISCONNECTED' : 'SYNCED (0.04s)'}</p>
            </div>
            <button
              onClick={handleEmergencyStop}
              className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center space-x-3 transition-all active:scale-95 shadow-lg cursor-pointer ${
                isEmergencyStopped
                  ? 'bg-[#00E676] hover:bg-[#00c868] text-black shadow-[#00E676]/20'
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 emergency-pulse hover:scale-[1.02]'
              }`}
              id="main-stop"
            >
              <span className="material-symbols-outlined text-lg">{isEmergencyStopped ? 'restart_alt' : 'gpp_maybe'}</span>
              <span>{isEmergencyStopped ? 'Restore System' : 'Emergency Stop'}</span>
            </button>
          </div>
        </footer>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0F1D]/95 backdrop-blur-md border-t border-[#1E2D4A] px-1 py-1.5 flex justify-around items-center">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex flex-col items-center space-y-0.5 py-1 px-2 rounded-lg transition-all cursor-pointer ${
              currentTab === 'dashboard' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span className="text-[9px] font-bold">Terminal</span>
          </button>

          <button
            onClick={() => setCurrentTab('chart')}
            className={`flex flex-col items-center space-y-0.5 py-1 px-2 rounded-lg transition-all cursor-pointer ${
              currentTab === 'chart' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-lg">show_chart</span>
            <span className="text-[9px] font-bold">Chart</span>
          </button>

          <button
            onClick={() => setCurrentTab('algorithms')}
            className={`flex flex-col items-center space-y-0.5 py-1 px-2 rounded-lg transition-all cursor-pointer ${
              currentTab === 'algorithms' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-lg">memory</span>
            <span className="text-[9px] font-bold">Algos</span>
          </button>

          <button
            onClick={() => setCurrentTab('history')}
            className={`flex flex-col items-center space-y-0.5 py-1 px-2 rounded-lg transition-all cursor-pointer ${
              currentTab === 'history' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-lg">list_alt</span>
            <span className="text-[9px] font-bold">History</span>
          </button>

          <button
            onClick={() => setCurrentTab('signals')}
            className={`flex flex-col items-center space-y-0.5 py-1 px-2 rounded-lg transition-all cursor-pointer ${
              currentTab === 'signals' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-lg">insights</span>
            <span className="text-[9px] font-bold">Signals</span>
          </button>
        </nav>

        {/* Mobile Settings Modal Drawer (Top-Level Portal to avoid header clipping) */}
        {isSettingsOpen && (
          <div ref={mobileSettingsRef} className="fixed inset-0 z-[10000] bg-[#0A0F1D] md:hidden overflow-y-auto p-4 flex flex-col justify-between pb-24">
            <div>
              <div className="flex justify-between items-center mb-4 border-b border-[#1E2D4A] pb-3 sticky top-0 bg-[#0A0F1D] z-10 py-2">
                <div>
                  <span className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-400">settings</span>
                    Terminal Parameters
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Customize risk manager metrics & market targets.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 text-white bg-red-500/20 hover:bg-red-500/40 rounded-xl border border-red-500/40 cursor-pointer flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-lg font-bold">close</span>
                </button>
              </div>

              <div className="space-y-5 text-xs">
                {/* Auto-Trade Switch */}
                <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A] flex justify-between items-center">
                  <div>
                    <span className="text-slate-300 font-bold block">Auto-Trade System</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Toggle automated bot execution on or off.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={autoTrade}
                      onChange={(e) => setAutoTrade(e.target.checked)}
                      className="sr-only peer"
                      disabled={isEmergencyStopped}
                    />
                    <div className="w-12 h-6 bg-[#162035] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner"></div>
                    <div className="absolute -inset-2 rounded-full opacity-0 group-hover:opacity-100 peer-checked:bg-cyan-500/10 transition-all"></div>
                  </label>
                </div>

                {/* Custom Demo Balance (Only visible in Demo mode) */}
                {activeMode === 'demo' && (
                  <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A]">
                    <div className="flex justify-between mb-2">
                      <div>
                        <span className="text-slate-300 font-bold block">Edit Demo Balance</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">Set a custom starting capital for testing.</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 font-bold">{getCurrencySymbol()}</span>
                      <input 
                        type="number"
                        min="1"
                        value={realizedBalance}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          setRealizedBalance(val)
                          setBalance(val)
                          localStorage.setItem('realizedBalance', val.toString())
                        }}
                        className="w-full bg-[#162035] text-white border border-[#1E2D4A] rounded-lg p-2 text-xs font-mono-data focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                )}

                {/* Max Open Positions */}
                <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A]">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300 font-bold">Max Open Positions</span>
                    <span className="text-cyan-400 font-bold font-mono-data">{maxOpenPositions}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={maxOpenPositions}
                    onChange={(e) => setMaxOpenPositions(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 rounded-lg appearance-none h-2 cursor-pointer"
                  />
                </div>

                {/* Stop Loss Limit */}
                <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A]">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300 font-bold">Stop Loss Limit</span>
                    <span className="text-red-400 font-bold font-mono-data">{stopLossLimit}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="5.0" 
                    step="0.1"
                    value={stopLossLimit}
                    onChange={(e) => setStopLossLimit(parseFloat(e.target.value))}
                    className="w-full accent-red-400 bg-slate-800 rounded-lg appearance-none h-2 cursor-pointer"
                  />
                </div>

                {/* Auto-Trade Pacing Speed */}
                <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A]">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300 font-bold">Auto-Trade Pacing Speed</span>
                    <span className="text-cyan-400 font-bold capitalize font-mono-data">{tradePacing}</span>
                  </div>
                  <select
                    value={tradePacing}
                    onChange={(e) => setTradePacing(e.target.value)}
                    className="w-full bg-[#162035] text-slate-200 border border-[#1E2D4A] rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer font-bold"
                  >
                    <option value="rapid">Rapid (Trades every 2-4 seconds - Testing)</option>
                    <option value="controlled">Controlled (Trades every 15-30 seconds - Demo)</option>
                    <option value="standard">Standard (Trades every 2-5 minutes - Live Pacing)</option>
                  </select>
                </div>

                {/* Desktop Notifications */}
                <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A]">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-slate-300 font-bold block">Trade Alert Notifications</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Push alerts when orders trigger</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableDesktopNotifications}
                        onChange={(e) => setEnableDesktopNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#162035] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window === 'undefined' || !('Notification' in window) || typeof Notification === 'undefined') {
                        setTestNotifStatus('❌ Not supported by mobile browser')
                        return
                      }
                      setTestNotifStatus('Sending...')
                      if (Notification.permission === 'denied') {
                        setTestNotifStatus('❌ Denied by browser settings')
                        return
                      }
                      if (Notification.permission !== 'granted') {
                        Notification.requestPermission().then(perm => {
                          if (perm === 'granted') {
                            new Notification("🔔 Notifications Enabled!", { body: "Direct trade alerts active!" })
                            setTestNotifStatus('✅ Sent!')
                          } else {
                            setTestNotifStatus('❌ Permission denied')
                          }
                        })
                      } else {
                        new Notification("🔔 Test Notification", { body: "Direct trade alerts working!" })
                        setTestNotifStatus('✅ Sent!')
                      }
                    }}
                    className="mt-3 w-full py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>🔔 Send Test Alert</span>
                    {testNotifStatus && <span className="text-[10px] text-cyan-300 ml-1">({testNotifStatus})</span>}
                  </button>
                </div>

                {/* Trade Size */}
                <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A]">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300 font-bold">Trade Size (Per Position)</span>
                    <span className="text-cyan-400 font-bold font-mono-data">{getCurrencySymbol()}{tradeInvestment}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 font-bold">{getCurrencySymbol()}</span>
                    <input 
                      type="number"
                      min="10"
                      max="100000"
                      value={tradeInvestment}
                      onChange={(e) => setTradeInvestment(Math.max(10, parseInt(e.target.value) || 0))}
                      className="w-full bg-[#162035] text-white border border-[#1E2D4A] rounded-lg p-2 text-xs font-mono-data focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 mt-3">
                    {[10, 25, 50, 100, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setTradeInvestment(amt)}
                        className={`py-1.5 text-[10px] font-mono-data font-bold rounded-lg border cursor-pointer transition-all ${
                          tradeInvestment === amt 
                            ? 'bg-cyan-500 text-black border-cyan-400' 
                            : 'bg-[#162035] text-slate-300 border-[#1E2D4A] hover:border-cyan-500/50'
                        }`}
                      >
                        {getCurrencySymbol()}{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selection Scope */}
                <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A]">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300 font-bold">Auto-Trade Selection Scope</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAutoTradeMode('single')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border cursor-pointer transition-all text-center ${
                        autoTradeMode === 'single'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                          : 'bg-[#162035] text-slate-400 border-[#1E2D4A] hover:text-white'
                      }`}
                    >
                      Single Asset ({selectedSymbol.split('/')[0]})
                    </button>
                    <button
                      onClick={() => setAutoTradeMode('rotation')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border cursor-pointer transition-all text-center ${
                        autoTradeMode === 'rotation'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                          : 'bg-[#162035] text-slate-400 border-[#1E2D4A] hover:text-white'
                      }`}
                    >
                      All Rotation ({enabledAutoTradeMarkets.length} active)
                    </button>
                  </div>
                </div>

                {/* Allowed Auto-Trade Markets */}
                <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300 font-bold">Allowed Auto-Trade Markets</span>
                    <span className="text-[10px] text-cyan-400 font-mono-data font-bold">{enabledAutoTradeMarkets.length} selected</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {['NIFTY 50', 'SENSEX', 'RELIANCE', 'TCS', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'AAPL', 'MSFT', 'TSLA', 'NVDA'].map((mkt) => (
                      <label 
                        key={mkt} 
                        className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all ${
                          enabledAutoTradeMarkets.includes(mkt) 
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-white' 
                            : 'bg-[#162035]/50 border-[#1E2D4A] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={enabledAutoTradeMarkets.includes(mkt)}
                          onChange={() => setEnabledAutoTradeMarkets(prev => prev.includes(mkt) ? prev.filter(x => x !== mkt) : [...prev, mkt])}
                          className="rounded border-[#1E2D4A] text-cyan-500 focus:ring-0 accent-cyan-400"
                        />
                        <span className="text-[11px] font-bold font-mono-data">{mkt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* AI Alert Dispatchers (WhatsApp & Telegram) */}
                <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A] space-y-3">
                  <span className="text-slate-300 font-bold block">AI Alert Dispatchers</span>
                  
                  {/* WhatsApp Alerts Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">WhatsApp Alerts</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={enableWhatsapp}
                        onChange={(e) => setEnableWhatsapp(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#162035] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner"></div>
                    </label>
                  </div>

                  {enableWhatsapp && (
                    <div className="space-y-2.5 pl-3 border-l border-green-500/30">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">WhatsApp Phone Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. +919876543210"
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                          className="w-full bg-[#162035] text-white border border-[#1E2D4A] rounded-lg p-2 text-xs font-mono-data focus:outline-none focus:border-green-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">CallMeBot API Key</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 123456"
                          value={callmebotApikey}
                          onChange={(e) => setCallmebotApikey(e.target.value)}
                          className="w-full bg-[#162035] text-white border border-[#1E2D4A] rounded-lg p-2 text-xs font-mono-data focus:outline-none focus:border-green-400"
                        />
                        <p className="text-[9px] text-slate-500 mt-1">
                          Get free API key from <a href="https://www.callmebot.com" target="_blank" rel="noreferrer" className="text-green-400 underline">CallMeBot</a>.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Telegram Alerts Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Telegram Alerts</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={enableTelegram}
                        onChange={(e) => setEnableTelegram(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#162035] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner"></div>
                    </label>
                  </div>

                  {enableTelegram && (
                    <div className="space-y-2.5 pl-3 border-l border-cyan-500/30">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Telegram Bot Token</label>
                        <input 
                          type="password" 
                          placeholder="e.g. 123456789:ABCdefGhI..."
                          value={telegramBotToken}
                          onChange={(e) => setTelegramBotToken(e.target.value)}
                          className="w-full bg-[#162035] text-white border border-[#1E2D4A] rounded-lg p-2 text-xs font-mono-data focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Telegram Chat ID</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 987654321"
                          value={telegramChatId}
                          onChange={(e) => setTelegramChatId(e.target.value)}
                          className="w-full bg-[#162035] text-white border border-[#1E2D4A] rounded-lg p-2 text-xs font-mono-data focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Institutional Broker API Gateway */}
                <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A]">
                  <span className="text-slate-300 font-bold block mb-2">Institutional Broker API Gateway</span>
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Exchange Brokerage</label>
                      <select
                        value={brokerGateway}
                        onChange={(e) => setBrokerGateway(e.target.value)}
                        className="w-full bg-[#162035] text-slate-200 border border-[#1E2D4A] rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-500 font-bold"
                      >
                        <option value="Binance Exchange API (Spot Trading)">Binance Exchange API (Spot Trading)</option>
                        <option value="Angel One SmartAPI (100% FREE Lifetime Access)">Angel One SmartAPI (100% FREE Lifetime)</option>
                        <option value="Shoonya by Finvasia (100% FREE & Zero Brokerage)">Shoonya Finvasia (100% FREE & Zero Commission)</option>
                        <option value="Upstox v2 API (Free Developer Tier)">Upstox v2 API (Free Tier)</option>
                        <option value="Zerodha Kite Connect API">Zerodha Kite Connect (Paid Credits)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">API Public Key</label>
                      <input 
                        type="text" 
                        placeholder="e.g. vmPUZE6mv9GFFin2..." 
                        value={brokerApiKey}
                        onChange={(e) => setBrokerApiKey(e.target.value)}
                        className="w-full bg-[#162035] text-white border border-[#1E2D4A] rounded-lg p-2 text-xs font-mono-data focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">API Secret / Token</label>
                      <input 
                        type="password" 
                        placeholder="••••••••••••••••" 
                        value={brokerApiSecret}
                        onChange={(e) => setBrokerApiSecret(e.target.value)}
                        className="w-full bg-[#162035] text-white border border-[#1E2D4A] rounded-lg p-2 text-xs font-mono-data focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token')
                      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : window.location.origin
                      await fetch(`${apiBase}/api/v1/auth/settings`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': token ? `Bearer ${token}` : ''
                        },
                        body: JSON.stringify({
                          broker_gateway: brokerGateway,
                          broker_api_key: brokerApiKey,
                          broker_api_secret: brokerApiSecret,
                          max_open_positions: maxOpenPositions,
                          stop_loss_limit: stopLossLimit,
                          profit_target: profitTarget,
                          trade_pacing: tradePacing,
                          enable_whatsapp: enableWhatsapp,
                          whatsapp_number: whatsappNumber,
                          callmebot_apikey: callmebotApikey,
                          telegram_bot_token: telegramBotToken,
                          telegram_chat_id: telegramChatId,
                          enable_telegram: enableTelegram
                        })
                      })
                      updateUser({
                        whatsapp: whatsappNumber,
                        callmebot_apikey: callmebotApikey,
                        telegram_bot_token: telegramBotToken,
                        telegram_chat_id: telegramChatId
                      })
                      await fetchRealBalance()
                    } catch (e) {
                      console.error('Failed to sync settings to backend:', e)
                    }
                    setIsSettingsOpen(false)
                  }}
                  className="w-full py-3 bg-cyan-400 text-black font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-cyan-300 transition-all cursor-pointer text-center shadow-lg active:scale-95"
                >
                  Save & Sync API Keys
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
