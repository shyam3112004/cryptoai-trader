import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'



export default function Dashboard() {
  const navigate = useNavigate()
  const { user, token, logout, setMode, updateUser } = useAuthStore()
  
  const [activeMode, setActiveMode] = useState(user?.mode || 'demo')
  const [currentTab, setCurrentTab] = useState('dashboard') // dashboard, algorithms, history, signals
  const [historySubTab, setHistorySubTab] = useState('sell') // sell (completed exits), buy (open/active entries)
  const [profitTarget, setProfitTarget] = useState(() => {
    const saved = localStorage.getItem('profitTarget')
    return saved ? saved : '1.5X'
  })
  const [timeframe, setTimeframe] = useState('15m')
  const [autoTrade, setAutoTrade] = useState(false)
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

  const [realizedBalanceUSD, setRealizedBalanceUSD] = useState(() => {
    const saved = localStorage.getItem('realizedBalanceUSD')
    return saved ? parseFloat(saved) : 10.00
  })
  const [realizedBalanceINR, setRealizedBalanceINR] = useState(() => {
    const saved = localStorage.getItem('realizedBalanceINR')
    return saved ? parseFloat(saved) : 100.00
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
  const [realAccountAsset, setRealAccountAsset] = useState(() => {
    return localStorage.getItem('realAccountAsset') || 'USDT'
  })

  const [balance, setBalance] = useState(() => {
    const currentSym = localStorage.getItem('selectedSymbol') || 'BTC/USDT'
    const isCrypto = (currentSym || '').toUpperCase().endsWith('USDT') || (currentSym || '').toUpperCase().includes('/') ? (currentSym || '').toUpperCase().includes('USDT') : true
    if (isCrypto) {
      const saved = localStorage.getItem('realizedBalanceUSD')
      return saved ? parseFloat(saved) : 10.00
    } else {
      const saved = localStorage.getItem('realizedBalanceINR')
      return saved ? parseFloat(saved) : 100.00
    }
  })
  const [todayPnl, setTodayPnl] = useState(realizedTodayPnl)
  
  const [tradeShares, setTradeShares] = useState(() => {
    const saved = localStorage.getItem('tradeShares')
    return saved ? parseFloat(saved) : 1.0
  })
  const [leverage, setLeverage] = useState(() => {
    const saved = localStorage.getItem('leverage')
    return saved ? parseInt(saved) : 10
  })
  const [useAlgorithms, setUseAlgorithms] = useState(() => {
    const saved = localStorage.getItem('useAlgorithms')
    return saved ? saved === 'true' : true
  })
  const [tradeInvestmentUSD, setTradeInvestmentUSD] = useState(() => {
    const saved = localStorage.getItem('tradeInvestmentUSD')
    return saved ? parseFloat(saved) : 100.00
  })
  const [tradeInvestmentINR, setTradeInvestmentINR] = useState(() => {
    const saved = localStorage.getItem('tradeInvestmentINR')
    return saved ? parseFloat(saved) : 10000.00
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
  const [tradeDirection, setTradeDirection] = useState(() => localStorage.getItem('tradeDirection') || 'BOTH')

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
  const [maxOpenPositions, setMaxOpenPositions] = useState(3)
  const [stopLossLimit, setStopLossLimit] = useState(2.0)
  const [tradePacing, setTradePacing] = useState('rapid')
  const [dailyProfitTargetUSD, setDailyProfitTargetUSD] = useState(() => {
    const val = localStorage.getItem('dailyProfitTargetUSD')
    return val !== null ? parseFloat(val) : 2.00
  })
  const [dailyProfitTargetINR, setDailyProfitTargetINR] = useState(() => {
    const val = localStorage.getItem('dailyProfitTargetINR')
    return val !== null ? parseFloat(val) : 20.00
  })
  const [dailyLossLimitUSD, setDailyLossLimitUSD] = useState(() => {
    const val = localStorage.getItem('dailyLossLimitUSD')
    return val !== null ? parseFloat(val) : 1.00
  })
  const [dailyLossLimitINR, setDailyLossLimitINR] = useState(() => {
    const val = localStorage.getItem('dailyLossLimitINR')
    return val !== null ? parseFloat(val) : 10.00
  })
  const [enableTrailingStop, setEnableTrailingStop] = useState(() => {
    const val = localStorage.getItem('enableTrailingStop')
    return val !== null ? val === 'true' : false
  })
  const [autoStartOnLogin, setAutoStartOnLogin] = useState(() => {
    const val = localStorage.getItem('autoStartOnLogin')
    return val !== null ? val === 'true' : false
  })
  const [dailyPnl, setDailyPnl] = useState(0.0)

  // AI-Powered Trading Intelligence States
  const [youtubeApiKey, setYoutubeApiKey] = useState('')
  const [claudeApiKey, setClaudeApiKey] = useState('')
  const [claudeModel, setClaudeModel] = useState('google/gemini-2.5-flash:free')
  const [aiConsultationMode, setAiConsultationMode] = useState('anomaly')
  const [aiDailyBudget, setAiDailyBudget] = useState(5.0)
  const [aiCandleInterval, setAiCandleInterval] = useState('30s')

  const handleTimeframeChange = async (newTf) => {
    console.log("[TIMEFRAME-SYNC] Syncing timeframe to AI interval:", newTf)
    setTimeframe(newTf)
    setAiCandleInterval(newTf)
    try {
      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : window.location.origin
      const activeToken = token || useAuthStore.getState().token
      await fetch(`${apiBase}/api/v1/ai/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          ai_candle_interval: newTf
        })
      })
    } catch (e) {
      console.error('Failed to sync chart timeframe to AI settings:', e)
    }
  }

  
  const [aiStatus, setAiStatus] = useState({
    youtube_connected: false,
    claude_connected: false,
    youtube_api_status: 'Demo',
    claude_api_status: 'Demo',
    budget_limit_usd: 5.0,
    strategies_count: 0,
    consultations_count: 0,
    today_cost_usd: 0.0,
    last_recommendation: 'N/A',
    last_consult_time: null
  })
  
  const [aiConsultResult, setAiConsultResult] = useState(null)
  const [aiConsulting, setAiConsulting] = useState(false)
  const [ytSearchQuery, setYtSearchQuery] = useState('scalping strategy')
  const [ytVideos, setYtVideos] = useState([])
  const [ytLoading, setYtLoading] = useState(false)
  const [ytLearningId, setYtLearningId] = useState(null)
  const [knowledgeBase, setKnowledgeBase] = useState([])
  const [backtestResult, setBacktestResult] = useState(null)
  const [isBacktesting, setIsBacktesting] = useState(false)
  const [showBacktestModal, setShowBacktestModal] = useState(false)
  const [consultationsLog, setConsultationsLog] = useState([])
  const [selectedConsultation, setSelectedConsultation] = useState(null)
  const [aiActiveSection, setAiActiveSection] = useState('advisor') // advisor, youtube, knowledge, log
  const [showKeysConfig, setShowKeysConfig] = useState(false)
  const [saveKeysStatus, setSaveKeysStatus] = useState('')

  // Chart, symbol selection & emergency stop states
  const [selectedSymbol, setSelectedSymbol] = useState(() => localStorage.getItem('selectedSymbol') || 'BTC/USDT')
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState(false)

  // Dynamic visible markets state for home page selectors
  const [visibleMarkets, setVisibleMarkets] = useState(() => {
    try {
      const saved = localStorage.getItem('visibleMarkets')
      return saved ? JSON.parse(saved) : ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'NIFTY 50', 'RELIANCE', 'TCS']
    } catch (e) {
      return ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'NIFTY 50', 'RELIANCE', 'TCS']
    }
  })
  const [marketSearchQuery, setMarketSearchQuery] = useState('')
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false)
  const marketSearchRef = useRef(null)

  const [marketSearchQuery2, setMarketSearchQuery2] = useState('')
  const [isSearchDropdownOpen2, setIsSearchDropdownOpen2] = useState(false)
  const marketSearchRef2 = useRef(null)

  useEffect(() => {
    localStorage.setItem('visibleMarkets', JSON.stringify(visibleMarkets))
  }, [visibleMarkets])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (marketSearchRef.current && !marketSearchRef.current.contains(event.target)) {
        setIsSearchDropdownOpen(false)
      }
      if (marketSearchRef2.current && !marketSearchRef2.current.contains(event.target)) {
        setIsSearchDropdownOpen2(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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

  // Unique ID generator to prevent React key collisions
  const generateUniqueId = () => {
    return Math.random().toString(36).substring(2, 9) + '-' + Date.now()
  }

  // Dynamic currency helpers
  const getCurrencySymbol = (sym) => {
    const target = sym || selectedSymbol
    if (!target) return '₹'
    const upper = target.toUpperCase()
    if (upper.includes('USDT') || upper.includes('BTC') || upper.includes('ETH') || upper.includes('SOL') || upper.includes('ADA') || upper.includes('USD')) {
      return '$'
    }
    return '₹'
  }

  const getPortfolioCurrencySymbol = () => {
    if (activeMode === 'real') {
      return isCryptoActive ? '$' : (realAccountAsset === 'INR' ? '₹' : '$')
    }
    return getCurrencySymbol()
  }

  const isCryptoActive = getCurrencySymbol(selectedSymbol) === '$'
  const realizedBalance = isCryptoActive ? realizedBalanceUSD : realizedBalanceINR
  const setRealizedBalance = (val) => {
    if (isCryptoActive) {
      setRealizedBalanceUSD(val)
      localStorage.setItem('realizedBalanceUSD', val.toString())
    } else {
      setRealizedBalanceINR(val)
      localStorage.setItem('realizedBalanceINR', val.toString())
    }
  }

  const tradeInvestment = isCryptoActive ? tradeInvestmentUSD : tradeInvestmentINR
  const setTradeInvestment = (val) => {
    if (isCryptoActive) {
      setTradeInvestmentUSD(val)
    } else {
      setTradeInvestmentINR(val)
    }
  }

  const dailyProfitTarget = isCryptoActive ? dailyProfitTargetUSD : dailyProfitTargetINR
  const setDailyProfitTarget = (val) => {
    if (isCryptoActive) {
      setDailyProfitTargetUSD(val)
      localStorage.setItem('dailyProfitTargetUSD', val.toString())
    } else {
      setDailyProfitTargetINR(val)
      localStorage.setItem('dailyProfitTargetINR', val.toString())
    }
  }

  const dailyLossLimit = isCryptoActive ? dailyLossLimitUSD : dailyLossLimitINR
  const setDailyLossLimit = (val) => {
    if (isCryptoActive) {
      setDailyLossLimitUSD(val)
      localStorage.setItem('dailyLossLimitUSD', val.toString())
    } else {
      setDailyLossLimitINR(val)
      localStorage.setItem('dailyLossLimitINR', val.toString())
    }
  }

  const realizedBalanceRef = useRef(realizedBalance)
  const realizedTodayPnlRef = useRef(realizedTodayPnl)
  const realAccountBalanceRef = useRef(realAccountBalance)
  const realAccountPnlRef = useRef(realAccountPnl)
  const activeModeRef = useRef(activeMode)
  const lastInteractionTimeRef = useRef(0)
  const isSettingsLoadedRef = useRef(false)

  const tradeInvestmentRef = useRef(null)
  const autoTradeModeRef = useRef(autoTradeMode)
  const enabledAutoTradeMarketsRef = useRef(enabledAutoTradeMarkets)
  const profitTargetRef = useRef(profitTarget)
  const maxOpenPositionsRef = useRef(maxOpenPositions)
  const stopLossLimitRef = useRef(stopLossLimit)
  const tradePacingRef = useRef(tradePacing)
  const autoTradeRef = useRef(autoTrade)
  
  const dailyProfitTargetRef = useRef(dailyProfitTarget)
  const dailyLossLimitRef = useRef(dailyLossLimit)
  const enableTrailingStopRef = useRef(enableTrailingStop)
  const autoStartOnLoginRef = useRef(autoStartOnLogin)

  useEffect(() => {
    const gateway = localStorage.getItem('brokerGateway')
    if (gateway && gateway.toLowerCase().includes('alpaca')) {
      localStorage.removeItem('brokerGateway')
      localStorage.removeItem('brokerApiKey')
      localStorage.removeItem('brokerApiSecret')
      setBrokerGateway('Angel One SmartAPI (100% FREE Lifetime Access)')
      setBrokerApiKey('FREE_SMARTAPI_LIVE_KEY_9482')
      setBrokerApiSecret('FREE_SMARTAPI_SECRET_7710')
    }
  }, [])

  useEffect(() => {
    maxOpenPositionsRef.current = 3
    stopLossLimitRef.current = 2.0
  }, [])

  useEffect(() => {
    tradePacingRef.current = 'rapid'
  }, [])

  useEffect(() => {
    localStorage.setItem('dailyProfitTarget', dailyProfitTarget.toString())
    dailyProfitTargetRef.current = dailyProfitTarget
  }, [dailyProfitTarget])

  useEffect(() => {
    localStorage.setItem('dailyLossLimit', dailyLossLimit.toString())
    dailyLossLimitRef.current = dailyLossLimit
  }, [dailyLossLimit])

  useEffect(() => {
    localStorage.setItem('enableTrailingStop', enableTrailingStop ? 'true' : 'false')
    enableTrailingStopRef.current = enableTrailingStop
  }, [enableTrailingStop])

  useEffect(() => {
    localStorage.setItem('autoStartOnLogin', autoStartOnLogin ? 'true' : 'false')
    autoStartOnLoginRef.current = autoStartOnLogin
  }, [autoStartOnLogin])

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
    localStorage.setItem('realizedBalance', realizedBalance.toString())
    realizedBalanceRef.current = realizedBalance
    setBalance(realizedBalance)
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
    localStorage.setItem('tradeShares', tradeShares.toString())
    setTradeInvestmentUSD(tradeShares * 100.0)
    setTradeInvestmentINR(tradeShares * 10000.0)
  }, [tradeShares])

  useEffect(() => {
    const isCrypto = getCurrencySymbol(selectedSymbol) === '$'
    tradeInvestmentRef.current = isCrypto ? tradeInvestmentUSD : tradeInvestmentINR
  }, [selectedSymbol, tradeInvestmentUSD, tradeInvestmentINR])

  // Save trade size settings to backend when updated by user (debounced)
  useEffect(() => {
    localStorage.setItem('leverage', leverage.toString())
  }, [leverage])

  useEffect(() => {
    localStorage.setItem('useAlgorithms', useAlgorithms.toString())
  }, [useAlgorithms])

  useEffect(() => {
    if (!isSettingsLoadedRef.current) return
    const saveTradeSize = async () => {
      try {
        const activeToken = token || useAuthStore.getState().token
        if (!activeToken) return
        const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : window.location.origin
        await fetch(`${apiBase}/api/v1/auth/settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify({
            trade_investment_usd: tradeInvestmentUSD,
            trade_investment_inr: tradeInvestmentINR,
            trade_shares: tradeShares,
            leverage: leverage,
            use_algorithms: useAlgorithms
          })
        })
      } catch (e) {
        console.error('Failed to sync trade size settings to backend:', e)
      }
    }
    const timeoutId = setTimeout(saveTradeSize, 1000)
    return () => clearTimeout(timeoutId)
  }, [tradeInvestmentUSD, tradeInvestmentINR, tradeShares, leverage, useAlgorithms])

  useEffect(() => {
    localStorage.setItem('autoTradeMode', autoTradeMode)
    autoTradeModeRef.current = autoTradeMode
  }, [autoTradeMode])

  useEffect(() => {
    localStorage.setItem('selectedSymbol', selectedSymbol)
  }, [selectedSymbol])

  const [isPriceFlashing, setIsPriceFlashing] = useState(false)
  const [redFlash, setRedFlash] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const handleToggleAutoTrade = async (enabled) => {
    lastInteractionTimeRef.current = Date.now()
    setAutoTrade(enabled)
    try {
      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : window.location.origin
      await fetch(`${apiBase}/api/v1/signals/auto-trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })
    } catch (e) {
      console.error('Failed to sync auto-trade status with backend:', e)
    }
  }

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
  const simPositionDirectionRef = useRef('LONG')
  const positionDirectionRef = useRef('LONG')
  const simPositionExtremePriceRef = useRef(null)
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

  const [activePositions, setActivePositions] = useState({})
  const [marketPrices, setMarketPrices] = useState({})

  const totalBlockedMargin = Object.values(activePositions).reduce((acc, pos) => {
    return acc + ((pos.qty * pos.entry_price) / leverage);
  }, 0);
  const displayedBalance = Math.max(0, balance - totalBlockedMargin);

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

  const [liveConsensus, setLiveConsensus] = useState('BUY')
  const [liveConfidence, setLiveConfidence] = useState(87.4)
  const [liveAgreeCount, setLiveAgreeCount] = useState(6)
  const [liveTotalAlgos, setLiveTotalAlgos] = useState(9)
  const [liveIndicators, setLiveIndicators] = useState({
    RSI: 42.5,
    EMA_9: 0.0,
    EMA_21: 0.0,
    VWAP: 0.0,
    ATR: '2.1%'
  })

  const fetchPredictionData = async () => {
    try {
      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : window.location.origin
      const resp = await fetch(`${apiBase}/api/v1/signals/prediction?symbol=${encodeURIComponent(selectedSymbol)}&mode=${activeMode}`)
      const data = await resp.json()
      if (data && data.consensus) {
        setLiveConsensus(data.consensus)
        setLiveConfidence(data.confidence)
        setLiveAgreeCount(data.agreeCount)
        setLiveTotalAlgos(data.totalAlgos)
        if (data.indicators) {
          setLiveIndicators(data.indicators)
        }
        if (data.metrics) {
          setAlgoMetrics(data.metrics.map(m => ({
            name: m.name,
            val: m.val,
            currentWidth: m.val,
            status: m.status,
            weight: m.weight
          })))
        }
      }
    } catch (err) {
      console.error('Error fetching prediction details:', err)
    }
  }

  useEffect(() => {
    fetchPredictionData()
    const timer = setInterval(fetchPredictionData, 5000)
    return () => clearInterval(timer)
  }, [selectedSymbol, activeMode])

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

  const pollAutoModeStatus = async () => {
    try {
      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : window.location.origin
      
      // Fetch all market prices in parallel
      fetch(`${apiBase}/api/v1/signals/prices`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setMarketPrices(d) })
        .catch(err => console.error('Failed to fetch live prices:', err))

      const res = await fetch(`${apiBase}/api/v1/signals/auto-mode?investment=${tradeInvestmentRef.current || 100.0}`)
      if (res.ok) {
        const data = await res.json()
        if (activeModeRef.current !== 'real') {
          const dailyVal = data.daily_pnl || 0.0
          realizedTodayPnlRef.current = dailyVal
          setRealizedTodayPnl(dailyVal)
          localStorage.setItem('realizedTodayPnl', dailyVal.toString())
          
          if (costBasisRef.current > 0) {
            const entryPriceVal = costBasisRef.current
            const currentPrice = chartDataRef.current && chartDataRef.current.length > 0 ? chartDataRef.current[chartDataRef.current.length - 1].close : entryPriceVal
            const priceDiffPct = entryPriceVal > 0 ? (currentPrice - entryPriceVal) / entryPriceVal : 0
            const leveragedPnl = tradeInvestmentRef.current * priceDiffPct * 10
            setTodayPnl(+(dailyVal + leveragedPnl).toFixed(2))
          } else {
            setTodayPnl(dailyVal)
          }
        }
        
        // Prevent polling updates from overriding user interaction immediately
        if (Date.now() - lastInteractionTimeRef.current > 5000) {
          setAutoTrade(data.enabled)
        }
      }
    } catch (e) {
      console.error('Failed to poll auto mode status:', e)
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
        if (data.profit_target) setProfitTarget(data.profit_target)
        if (data.trade_direction) {
          setTradeDirection(data.trade_direction)
          localStorage.setItem('tradeDirection', data.trade_direction)
        }
        
        const localShares = localStorage.getItem('tradeShares')
        if (localShares) {
          setTradeShares(parseFloat(localShares))
        } else if (data.trade_shares) {
          setTradeShares(data.trade_shares)
        } else {
          const usd = data.trade_investment_usd || 100.0
          setTradeShares(usd / 100.0)
        }
        
        if (data.trade_investment_usd) {
          setTradeInvestmentUSD(data.trade_investment_usd)
        }
        if (data.trade_investment_inr) {
          setTradeInvestmentINR(data.trade_investment_inr)
        }
        if (data.leverage) {
          setLeverage(data.leverage)
          localStorage.setItem('leverage', data.leverage.toString())
        }
        if (data.use_algorithms !== undefined) {
          setUseAlgorithms(data.use_algorithms)
          localStorage.setItem('useAlgorithms', data.use_algorithms.toString())
        }
        
        // Auto-mode settings
        if (data.daily_profit_target !== undefined) setDailyProfitTarget(data.daily_profit_target)
        if (data.daily_loss_limit !== undefined) setDailyLossLimit(data.daily_loss_limit)
        if (data.enable_trailing_stop !== undefined) setEnableTrailingStop(data.enable_trailing_stop)
        if (data.auto_start_on_login !== undefined) setAutoStartOnLogin(data.auto_start_on_login)
        
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
          telegram_chat_id: data.telegram_chat_id || '',
          mode: data.active_mode || 'demo'
        })
        
        if (data.active_mode) {
          setActiveMode(data.active_mode)
        }

        // Mark settings as successfully loaded to allow subsequent updates to sync to backend
        isSettingsLoadedRef.current = true
        
        // Auto-start trading if enabled on backend settings load
        if (data.auto_start_on_login) {
          setAutoTrade(true)
          fetch(`${apiBase}/api/v1/signals/auto-trade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: true })
          }).catch(err => console.error('Failed to auto-start trade status:', err))
        }
      }
    } catch (e) {
      console.error('Failed to fetch settings from backend:', e)
    }
  }
  const fetchTradeHistoryFromBackend = async () => {
    try {
      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : window.location.origin
      const res = await fetch(`${apiBase}/api/v1/signals/trade-history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setTradeHistory(data)
        }
      }
    } catch (e) {
      console.error('Failed to fetch trade history from database:', e)
    }
  }

  useEffect(() => {
    setIsMounted(true)
    generateChartData(timeframe, selectedSymbol)
    fetchSettingsFromBackend()
    fetchTradeHistoryFromBackend()
    pollAutoModeStatus()

    const autoModeInterval = setInterval(pollAutoModeStatus, 3000)

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
      clearInterval(autoModeInterval)
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

      // ─── Calculate Indicators (EMA 9, EMA 21, VWAP, Bollinger Bands) ───
      const fullData = chartDataRef.current
      
      const computeEMA_JS = (period) => {
        const ema = []
        if (fullData.length === 0) return ema
        const k = 2 / (period + 1)
        let val = fullData[0].close
        ema.push(val)
        for (let i = 1; i < fullData.length; i++) {
          val = fullData[i].close * k + val * (1 - k)
          ema.push(val)
        }
        return ema
      }

      const computeVWAP_JS = () => {
        const vwap = []
        let pvSum = 0
        let volSum = 0
        for (let i = 0; i < fullData.length; i++) {
          const high = fullData[i].high || fullData[i].close
          const low = fullData[i].low || fullData[i].close
          const close = fullData[i].close
          const vol = fullData[i].vol || 1
          const tp = (high + low + close) / 3
          pvSum += tp * vol
          volSum += vol
          vwap.push(pvSum / (volSum || 1))
        }
        return vwap
      }

      const computeBollinger_JS = (period = 20, devMult = 2) => {
        const upper = []
        const lower = []
        for (let i = 0; i < fullData.length; i++) {
          if (i < period - 1) {
            upper.push(fullData[i].close)
            lower.push(fullData[i].close)
            continue
          }
          const slice = fullData.slice(i - period + 1, i + 1)
          const mean = slice.reduce((sum, d) => sum + d.close, 0) / period
          const variance = slice.reduce((sum, d) => sum + Math.pow(d.close - mean, 2), 0) / period
          const std = Math.sqrt(variance)
          upper.push(mean + devMult * std)
          lower.push(mean - devMult * std)
        }
        return { upper, lower }
      }

      const ema9List = computeEMA_JS(9)
      const ema21List = computeEMA_JS(21)
      const vwapList = computeVWAP_JS()
      const { upper: bbUpperList, lower: bbLowerList } = computeBollinger_JS(20, 2)

      // ─── Draw Bollinger Bands Shaded Channel ───
      ctx.fillStyle = 'rgba(6, 182, 212, 0.04)'
      ctx.beginPath()
      visibleData.forEach((candle, idx) => {
        const fullIdx = Math.max(0, fullData.length - zoomLevel - panOffset) + idx
        const x = candleSpacing * idx + candleGap + candleBodyW / 2
        const y = scaleY(bbUpperList[fullIdx] || candle.close)
        if (idx === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      for (let idx = visibleData.length - 1; idx >= 0; idx--) {
        const fullIdx = Math.max(0, fullData.length - zoomLevel - panOffset) + idx
        const x = candleSpacing * idx + candleGap + candleBodyW / 2
        const y = scaleY(bbLowerList[fullIdx] || visibleData[idx].close)
        ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()

      // Upper and Lower band lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)'
      ctx.lineWidth = 1
      ctx.beginPath()
      visibleData.forEach((candle, idx) => {
        const fullIdx = Math.max(0, fullData.length - zoomLevel - panOffset) + idx
        const x = candleSpacing * idx + candleGap + candleBodyW / 2
        const y = scaleY(bbUpperList[fullIdx] || candle.close)
        if (idx === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      ctx.beginPath()
      visibleData.forEach((candle, idx) => {
        const fullIdx = Math.max(0, fullData.length - zoomLevel - panOffset) + idx
        const x = candleSpacing * idx + candleGap + candleBodyW / 2
        const y = scaleY(bbLowerList[fullIdx] || candle.close)
        if (idx === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

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

      // ─── Draw EMA 9 (Blue) ───
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      visibleData.forEach((candle, idx) => {
        const fullIdx = Math.max(0, fullData.length - zoomLevel - panOffset) + idx
        const x = candleSpacing * idx + candleGap + candleBodyW / 2
        const y = scaleY(ema9List[fullIdx] || candle.close)
        if (idx === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      // ─── Draw EMA 21 (Orange) ───
      ctx.strokeStyle = '#f97316'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      visibleData.forEach((candle, idx) => {
        const fullIdx = Math.max(0, fullData.length - zoomLevel - panOffset) + idx
        const x = candleSpacing * idx + candleGap + candleBodyW / 2
        const y = scaleY(ema21List[fullIdx] || candle.close)
        if (idx === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      // ─── Draw VWAP (Purple) ───
      ctx.strokeStyle = '#a855f7'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      visibleData.forEach((candle, idx) => {
        const fullIdx = Math.max(0, fullData.length - zoomLevel - panOffset) + idx
        const x = candleSpacing * idx + candleGap + candleBodyW / 2
        const y = scaleY(vwapList[fullIdx] || candle.close)
        if (idx === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      // ─── Draw Legends ───
      const latestFullIdx = fullData.length - 1
      const curEma9 = ema9List[latestFullIdx] || 0
      const curEma21 = ema21List[latestFullIdx] || 0
      const curVwap = vwapList[latestFullIdx] || 0
      
      ctx.fillStyle = 'rgba(10, 15, 30, 0.75)'
      ctx.fillRect(8, 8, 260, 18)
      ctx.strokeStyle = '#1e2d4a'
      ctx.lineWidth = 1
      ctx.strokeRect(8, 8, 260, 18)

      ctx.font = '9px monospace'
      ctx.textAlign = 'left'
      ctx.fillStyle = '#3b82f6'
      ctx.fillText(`EMA(9): ${curEma9.toFixed(2)}`, 14, 20)
      ctx.fillStyle = '#f97316'
      ctx.fillText(`EMA(21): ${curEma21.toFixed(2)}`, 98, 20)
      ctx.fillStyle = '#a855f7'
      ctx.fillText(`VWAP: ${curVwap.toFixed(2)}`, 182, 20)

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

      // ─── Draw Active Position Lines (Entry, Target, Stop Loss) ───
      const symNormalized = selectedSymbol.toUpperCase().replace('/', '').replace(' ', '')
      const activePos = activePositions[symNormalized]
      if (activePos) {
        const entryPrice = activePos.entry_price
        const targetPrice = activePos.target_price
        const slLimit = stopLossLimitRef?.current || stopLossLimit || 2.0
        const stopLossPrice = activePos.direction === 'SHORT'
          ? entryPrice * (1 + slLimit / 100)
          : entryPrice * (1 - slLimit / 100)

        const drawPositionLine = (price, color, labelText) => {
          const y = scaleY(price)
          ctx.strokeStyle = color
          ctx.lineWidth = 1
          ctx.setLineDash([4, 4])
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(chartW, y)
          ctx.stroke()
          ctx.setLineDash([])

          ctx.fillStyle = color
          ctx.font = 'bold 9px sans-serif'
          ctx.textAlign = 'left'
          const textW = ctx.measureText(labelText).width
          ctx.fillRect(4, y - 8, textW + 8, 16)
          ctx.fillStyle = '#080C18'
          ctx.fillText(labelText, 8, y + 3)

          ctx.fillStyle = color
          ctx.fillRect(chartW, y - 8, PRICE_AXIS_W, 16)
          ctx.fillStyle = '#080C18'
          ctx.font = 'bold 9px monospace'
          ctx.textAlign = 'left'
          ctx.fillText(price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), chartW + 6, y + 3)
        }

        if (stopLossPrice >= minP && stopLossPrice <= maxP) {
          drawPositionLine(stopLossPrice, '#FF3D57', `🛡️ SL: ${stopLossPrice.toFixed(2)}`)
        }
        if (targetPrice >= minP && targetPrice <= maxP) {
          drawPositionLine(targetPrice, '#00E676', `🎯 TP: ${targetPrice.toFixed(2)}`)
        }
        if (entryPrice >= minP && entryPrice <= maxP) {
          drawPositionLine(entryPrice, '#00E5FF', `📥 ENTRY: ${entryPrice.toFixed(2)}`)
        }
      }

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
      const wsHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '127.0.0.1:8000' : window.location.host
      ws = new WebSocket(`${wsProtocol}//${wsHost}/api/v1/signals/ws/live`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('Websocket connected successfully to live price stream')
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ action: 'subscribe', symbol: selectedSymbol }))
          } catch (err) {
            console.error('Failed to send subscribe packet:', err)
          }
        } else {
          const checkOpen = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              try {
                ws.send(JSON.stringify({ action: 'subscribe', symbol: selectedSymbol }))
              } catch (err) {
                console.error('Failed to send subscribe packet on retry:', err)
              }
              clearInterval(checkOpen)
            }
          }, 50)
          setTimeout(() => clearInterval(checkOpen), 1000)
        }
      }

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          
          if (payload.type === 'ai_consultation') {
            const newNotif = {
              id: generateUniqueId(),
              title: `🧠 AI Advisor: ${payload.symbol}`,
              desc: `Recommendation: ${payload.recommendation}. ${payload.response.slice(0, 100)}...`,
              time: payload.timestamp || 'Just now',
              action: 'AI_ADVISOR'
            }
            setNotifications(prev => [newNotif, ...prev.slice(0, 19)])
            setHasUnreadNotifications(true)
            triggerDesktopNotification(`🧠 AI Advisor: ${payload.symbol}`, `Recommendation: ${payload.recommendation}`)
            
            if (payload.symbol === selectedSymbolRef.current) {
              setAiConsultResult({
                success: true,
                recommendation: payload.recommendation,
                response: payload.response,
                simulated: payload.is_simulated,
                news: []
              })
            }
            fetchAiStatus()
            fetchConsultationsLog()
            return
          }

          // Handle incoming notifications (e.g. trade execution alerts)
          if (payload.type === 'notification') {
            if (!autoTradeRef.current) return
            
            const newNotif = {
              id: generateUniqueId(),
              title: payload.title,
              desc: payload.body,
              time: payload.timestamp || 'Just now',
              action: payload.action
            }
            setNotifications(prev => [newNotif, ...prev.slice(0, 19)])
            setHasUnreadNotifications(true)
            triggerDesktopNotification(payload.title, payload.body)

            const norm = (s) => s ? s.toUpperCase().replace('/', '').replace(' ', '') : ''
            const notifSym = payload.symbol || ''
            const notifNorm = norm(notifSym)
            const currentNorm = norm(selectedSymbolRef.current)

            // Strictly process trade state updates only if notification matches active screen symbol & is manually enabled
            if (notifNorm && notifNorm === currentNorm) {
              const isMarketAllowed = true // Always allow active symbol
              // if (!isMarketAllowed) return

              const isAiGating = payload.action && payload.action.startsWith('AI_')
              const isBuy = !isAiGating && (payload.title.includes('BUY') || payload.title.includes('LONG') || payload.title.includes('ORDER EXECUTED'))
              const isClosed = !isAiGating && (payload.title.includes('STOP LOSS') || payload.title.includes('TARGET HIT') || payload.title.includes('SELL'))
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
                  const entryPriceVal = payload.entry_price || costBasisRef.current || 0
                  const exitPriceVal = payload.exit_price || payload.close || lastCandle?.close || 0
                  const isShort = payload.direction === 'SHORT' || payload.title.includes('SHORT') || payload.body.toLowerCase().includes('short')
                  
                  const rawDiff = entryPriceVal > 0 ? (exitPriceVal - entryPriceVal) / entryPriceVal : 0
                  const priceDiffPct = isShort ? -rawDiff : rawDiff
                  const pnlPctVal = priceDiffPct * 10 * 100 // 10X leveraged return percentage

                  const directionMult = isShort ? -1 : 1
                  const finalPnl = tradeInvestmentRef.current * (pnlPctVal / 100) * directionMult

                  if (activeModeRef.current === 'real') {
                    // Real mode balance is determined strictly by broker API; do not add simulated P&L.
                    fetchRealBalance()
                    setRealAccountPnl(0.00)
                    setTodayPnl(0.00)
                  } else {
                    realizedBalanceRef.current = realizedBalanceRef.current + finalPnl
                    realizedTodayPnlRef.current = realizedTodayPnlRef.current + finalPnl
                    setRealizedBalance(realizedBalanceRef.current)
                    setRealizedTodayPnl(realizedTodayPnlRef.current)
                    setBalance(realizedBalanceRef.current)
                    setTodayPnl(realizedTodayPnlRef.current)
                  }

                  // Close position
                  costBasisRef.current = null
                  positionDirectionRef.current = 'LONG'

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
                  const formatPnl = Math.abs(finalPnl) > 0 && Math.abs(finalPnl) < 0.01
                    ? (finalPnl >= 0 ? `+${symb}${finalPnl.toFixed(4)}` : `-${symb}${Math.abs(finalPnl).toFixed(4)}`)
                    : (finalPnl >= 0 ? `+${symb}${finalPnl.toFixed(2)}` : `-${symb}${Math.abs(finalPnl).toFixed(2)}`)
                  const returnPctStr = pnlPctVal >= 0 ? `+${pnlPctVal.toFixed(2)}%` : `${pnlPctVal.toFixed(2)}%`

                  const exitStatus = payload.title.includes('STOP LOSS') ? 'STOP LOSS' : 'TARGET HIT'
                  setTradeHistory(prev => {
                    const updated = prev.map(t => {
                      if (t.pair === selectedSymbolRef.current && t.action === 'BUY' && t.status === 'OPEN') {
                        return {
                          ...t,
                          status: `CLOSED (${exitStatus})`,
                          exitPrice: exitPriceVal
                        }
                      }
                      return t
                    })
                    return [
                      {
                        id: generateUniqueId(),
                        date: formattedDate,
                        pair: selectedSymbolRef.current,
                        type: isShort ? 'SHORT' : 'LONG',
                        investment: `${symb}${tradeInvestmentRef.current.toLocaleString()}`,
                        leverage: '10X',
                        profit: formatPnl,
                        returnPct: returnPctStr,
                        status: exitStatus,
                        entryPrice: entryPriceVal,
                        highestPrice: payload.highest_price || payload.entry_price || exitPriceVal,
                        exitPrice: exitPriceVal,
                        action: 'SELL'
                      },
                      ...updated.slice(0, 999)
                    ]
                  })

                  const displayExitPrice = typeof exitPriceVal === 'number' ? exitPriceVal.toLocaleString() : exitPriceVal
                  setLogs(prev => [
                    {
                      id: generateUniqueId(),
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                      action: `CLOSE ${isShort ? 'SHORT' : 'LONG'} ${selectedSymbolRef.current}`,
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
                  fetchActivePositions()
                  fetchTradeHistoryFromBackend()
                } else if (isBuy) {
                  // Open new position
                  const entryVal = payload.entry_price || lastCandle?.close || 0
                  costBasisRef.current = entryVal
                  const displayEntryPrice = typeof entryVal === 'number' ? entryVal.toLocaleString() : entryVal
                  const symb = getCurrencySymbol(selectedSymbolRef.current)
                  const isShort = payload.direction === 'SHORT' || payload.title.includes('SHORT')
                  positionDirectionRef.current = isShort ? 'SHORT' : 'LONG'
                  
                  // Add to trade history logs as BUY entry
                  const formattedDate = new Date().toISOString().replace('T', ' ').slice(0, 19)
                  const slLimitVal = stopLossLimitRef.current || 2.0
                  const targetStrVal = profitTargetRef.current || '1.5X'
                  const multVal = targetStrVal === '1.2X' ? 1.2 : (targetStrVal === '2.0X' ? 2.0 : 1.5)
                  const targetUnleveragedVal = (slLimitVal * multVal) / 100.0
                  const localTargetPrice = isShort 
                    ? entryVal * (1.0 - targetUnleveragedVal)
                    : entryVal * (1.0 + targetUnleveragedVal)
                  
                  const targetPriceVal = payload.target_price || localTargetPrice

                  setTradeHistory(prev => [
                    {
                      id: generateUniqueId(),
                      date: formattedDate,
                      pair: selectedSymbolRef.current,
                      type: isShort ? 'SHORT' : 'LONG',
                      investment: `${symb}${tradeInvestmentRef.current.toLocaleString()}`,
                      leverage: '10X',
                      profit: '—',
                      returnPct: '—',
                      status: 'OPEN',
                      entryPrice: entryVal,
                      targetPrice: targetPriceVal,
                      highestPrice: entryVal,
                      exitPrice: null,
                      action: 'BUY'
                    },
                    ...prev.slice(0, 999)
                  ])

                  // Add to execution logs card
                  setLogs(prev => [
                    {
                      id: generateUniqueId(),
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                      action: `OPEN ${isShort ? 'SHORT' : 'LONG'} ${selectedSymbolRef.current}`,
                      qty: `10X @ ${symb}${displayEntryPrice}`,
                      pnl: '0.00',
                      type: isShort ? 'sell' : 'buy'
                    },
                    ...prev.slice(0, 7)
                  ])
                  triggerDesktopNotification(
                    isShort ? `🔴 SHORT EXECUTED: ${selectedSymbolRef.current}` : `🟢 BUY EXECUTED: ${selectedSymbolRef.current}`,
                    `10X ${isShort ? 'Short' : 'Long'} entry position opened at ${symb}${entryVal.toLocaleString()}`
                  )
                  fetchActivePositions()
                  fetchTradeHistoryFromBackend()
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
            
            // Determine if the active position is SHORT (using ref to avoid stale closures)
            const isShortPos = positionDirectionRef.current === 'SHORT';
            
            const rawDiff = entryPrice > 0 ? (currentPrice - entryPrice) / entryPrice : 0;
            const priceDiffPct = isShortPos ? -rawDiff : rawDiff;
            
            // Dynamically update the open position's extreme price (highest/lowest price) in tradeHistory
            setTradeHistory(prev => prev.map(t => {
              if (t.status === 'OPEN' && t.pair === selectedSymbolRef.current) {
                const isShortPosItem = t.type === 'SHORT';
                const currentExtreme = t.highestPrice || t.entryPrice || currentPrice;
                const newExtreme = isShortPosItem 
                  ? Math.min(currentExtreme, currentPrice)
                  : Math.max(currentExtreme, currentPrice);
                return { ...t, highestPrice: newExtreme };
              }
              return t;
            }));
            
            const leveragedPnl = tradeInvestmentRef.current * priceDiffPct * 10
            const isRealMode = activeModeRef.current === 'real'
            if (isRealMode) {
              setBalance(realAccountBalanceRef.current)
              setTodayPnl(0.00)
            } else {
              const curBase = realizedBalanceRef.current
              const curPnl = realizedTodayPnlRef.current
              setBalance(+(curBase + leveragedPnl).toFixed(2))
              setTodayPnl(+(curPnl + leveragedPnl).toFixed(2))
            }
          } else {
            const isRealMode = activeModeRef.current === 'real'
            if (isRealMode) {
              setBalance(realAccountBalanceRef.current)
              setTodayPnl(0.00)
            } else {
              setBalance(realizedBalanceRef.current)
              setTodayPnl(realizedTodayPnlRef.current)
            }
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

      const triggerReconnect = () => {
        if (isCleaningUp) return
        startFallback()
        if (reconnectTimeout) return
        console.log('Scheduling websocket reconnection in 3 seconds...')
        reconnectTimeout = setTimeout(() => {
          reconnectTimeout = null
          if (!isCleaningUp) {
            console.log('Attempting to reconnect websocket...')
            connectWebSocket()
          }
        }, 3000)
      }

      ws.onerror = (err) => {
        console.warn('Websocket error encountered, starting mock ticker fallback', err)
        triggerReconnect()
      }

      ws.onclose = () => {
        console.warn('Websocket stream closed, initiating fallback engine')
        triggerReconnect()
      }
    }

    function startFallback() {
      if (fallbackInterval) return
      console.log('Starting mock ticker fallback interval for: ' + selectedSymbolRef.current)
      
      fallbackInterval = setInterval(() => {
        const currentSym = selectedSymbolRef.current
        const symb = getCurrencySymbol(currentSym)
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
        if (autoTradeRef.current && activeModeRef.current !== 'real') {
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
                const isShortEntry = Math.random() < 0.5
                simPositionDirectionRef.current = isShortEntry ? 'SHORT' : 'LONG'
                simPositionExtremePriceRef.current = newClose

                // Add correct marker (buy for LONG, sell for SHORT)
                setChartMarkers(prev => [
                  ...prev,
                  {
                    time: chartDataRef.current[chartDataRef.current.length - 1]?.time || 0,
                    type: isShortEntry ? 'sell' : 'buy',
                    price: newClose,
                    label: isShortEntry ? 'SHORT' : 'BUY'
                  }
                ])

                // Add to trade history logs as BUY entry
                const formattedDate = new Date().toISOString().replace('T', ' ').slice(0, 19)
                const slLimitVal = stopLossLimitRef.current || 2.0
                const targetStrVal = profitTargetRef.current || '1.5X'
                const multVal = targetStrVal === '1.2X' ? 1.2 : (targetStrVal === '2.0X' ? 2.0 : 1.5)
                const targetUnleveragedVal = (slLimitVal * multVal) / 100.0
                const targetPriceVal = isShortEntry 
                  ? newClose * (1.0 - targetUnleveragedVal)
                  : newClose * (1.0 + targetUnleveragedVal)

                setTradeHistory(prev => [
                  {
                    id: generateUniqueId(),
                    date: formattedDate,
                    pair: currentSym,
                    type: isShortEntry ? 'SHORT' : 'LONG',
                    investment: `${symb}${tradeInvestmentRef.current.toLocaleString()}`,
                    leverage: '10X',
                    profit: '—',
                    returnPct: '—',
                    status: 'OPEN',
                    entryPrice: newClose,
                    targetPrice: targetPriceVal,
                    highestPrice: newClose, // Track extreme price so far
                    exitPrice: null,
                    action: 'BUY'
                  },
                  ...prev.slice(0, 999)
                ])

                // Add to logs
                setLogs(prev => [
                  {
                    id: generateUniqueId(),
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    action: `OPEN ${isShortEntry ? 'SHORT' : 'LONG'} ${currentSym}`,
                    qty: `10X @ ${symb}${newClose.toLocaleString()}`,
                    pnl: '0.00',
                    type: isShortEntry ? 'sell' : 'buy'
                  },
                  ...prev.slice(0, 7)
                ])
                triggerDesktopNotification(
                  isShortEntry ? `🔴 SHORT EXECUTED: ${currentSym}` : `🟢 BUY EXECUTED: ${currentSym}`,
                  `10X ${isShortEntry ? 'Short' : 'Long'} entry position opened at ${symb}${newClose.toLocaleString()}`
                )
              }
            } else {
              // Position is open, calculate active unrealized P&L
              const entryPrice = costBasisRef.current
              const isSimShort = simPositionDirectionRef.current === 'SHORT'
              const rawDiff = entryPrice > 0 ? (newClose - entryPrice) / entryPrice : 0
              const priceDiffPct = isSimShort ? -rawDiff : rawDiff
              
              if (isSimShort) {
                simPositionExtremePriceRef.current = Math.min(simPositionExtremePriceRef.current || newClose, newClose)
              } else {
                simPositionExtremePriceRef.current = Math.max(simPositionExtremePriceRef.current || newClose, newClose)
              }
              
              // Dynamically update the open position's extreme price (highest/lowest price) in tradeHistory
              setTradeHistory(prev => prev.map(t => {
                if (t.status === 'OPEN' && t.pair === currentSym) {
                  const isShortPos = t.type === 'SHORT';
                  const currentExtreme = t.highestPrice || t.entryPrice || newClose;
                  const newExtreme = isShortPos 
                    ? Math.min(currentExtreme, newClose)
                    : Math.max(currentExtreme, newClose);
                  return { ...t, highestPrice: newExtreme };
                }
                return t;
              }));
              
              const rawLeveragedPnl = tradeInvestmentRef.current * priceDiffPct * 10
              
              const isRealMode = activeModeRef.current === 'real'
              if (isRealMode) {
                setBalance(realAccountBalanceRef.current)
                setTodayPnl(0.00)
              } else {
                const curBase = realizedBalanceRef.current
                const curPnl = realizedTodayPnlRef.current
                setBalance(+(curBase + rawLeveragedPnl).toFixed(2))
                setTodayPnl(+(curPnl + rawLeveragedPnl).toFixed(2))
              }

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

              // Calculate actual target/stop thresholds for the simulation trade
              const slLimit = stopLossLimitRef.current || 2.0
              const targetStr = profitTargetRef.current || '1.5X'
              const mult = targetStr === '1.2X' ? 1.2 : (targetStr === '2.0X' ? 2.0 : 1.5)
              
              const target_unleveraged = (slLimit * mult) / 100.0
              const stop_unleveraged = slLimit / 100.0
              
              const highestPriceVal = simPositionExtremePriceRef.current || entryPrice
              
              let simStopLossPrice = isSimShort 
                ? entryPrice * (1.0 + stop_unleveraged)
                : entryPrice * (1.0 - stop_unleveraged)
                
              if (enableTrailingStopRef.current) {
                if (priceDiffPct >= target_unleveraged * 0.5) {
                  simStopLossPrice = entryPrice
                }
                if (priceDiffPct >= target_unleveraged * 0.75) {
                  simStopLossPrice = isSimShort
                    ? Math.min(simStopLossPrice, highestPriceVal * 1.01)
                    : Math.max(simStopLossPrice, highestPriceVal * 0.99)
                }
              }
              
              const targetHit = isSimShort 
                ? newClose <= entryPrice * (1.0 - target_unleveraged)
                : newClose >= entryPrice * (1.0 + target_unleveraged)
                
              const stopHit = isSimShort
                ? newClose >= simStopLossPrice
                : newClose <= simStopLossPrice
              
              const shouldClose = targetHit || stopHit || (Math.random() > (1.0 - pacingParams.exitChance))
              
              if (shouldClose) {
                const entryPriceVal = costBasisRef.current || 0
                const pnlPctVal = priceDiffPct * 10 * 100 // 10X leveraged return percentage

                const finalPnl = tradeInvestmentRef.current * (pnlPctVal / 100)
                if (activeModeRef.current === 'real') {
                  // Real mode balance is determined strictly by broker API; do not add simulated P&L.
                  fetchRealBalance()
                  setRealAccountPnl(0.00)
                  setTodayPnl(0.00)
                } else {
                  realizedBalanceRef.current = realizedBalanceRef.current + finalPnl
                  realizedTodayPnlRef.current = realizedTodayPnlRef.current + finalPnl
                  setRealizedBalance(realizedBalanceRef.current)
                  setRealizedTodayPnl(realizedTodayPnlRef.current)
                  setBalance(realizedBalanceRef.current)
                  setTodayPnl(realizedTodayPnlRef.current)
                }

                // Add correct close marker (buy/COVER for SHORT, sell/SELL for LONG)
                setChartMarkers(prev => [
                  ...prev,
                  {
                    time: chartDataRef.current[chartDataRef.current.length - 1]?.time || 0,
                    type: isSimShort ? 'buy' : 'sell',
                    price: newClose,
                    label: isSimShort ? 'COVER' : 'SELL'
                  }
                ])

                // Add to logs
                const symb = getCurrencySymbol(currentSym)
                const formatPnl = Math.abs(finalPnl) > 0 && Math.abs(finalPnl) < 0.01
                   ? (finalPnl >= 0 ? `+${symb}${finalPnl.toFixed(4)}` : `-${symb}${Math.abs(finalPnl).toFixed(4)}`)
                   : (finalPnl >= 0 ? `+${symb}${finalPnl.toFixed(2)}` : `-${symb}${Math.abs(finalPnl).toFixed(2)}`)
                setLogs(prev => [
                  {
                    id: generateUniqueId(),
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    action: `CLOSE ${isSimShort ? 'SHORT' : 'LONG'} ${currentSym}`,
                    qty: `10X @ ${symb}${newClose.toLocaleString()}`,
                    pnl: formatPnl,
                    type: finalPnl >= 0 ? 'buy' : 'sell'
                  },
                  ...prev.slice(0, 7)
                ])

                // Add to trade history
                const formattedDate = new Date().toISOString().replace('T', ' ').slice(0, 19)
                const returnPctStr = finalPnl >= 0 ? `+${pnlPctVal.toFixed(2)}%` : `${pnlPctVal.toFixed(2)}%`
                const extremePriceVal = simPositionExtremePriceRef.current
                 const exitStatus = finalPnl >= 0 ? 'TARGET HIT' : 'STOP LOSS'
                 setTradeHistory(prev => {
                   const updated = prev.map(t => {
                     if (t.pair === currentSym && t.action === 'BUY' && t.status === 'OPEN') {
                       return {
                         ...t,
                         status: `CLOSED (${exitStatus})`,
                         exitPrice: newClose || 0
                       }
                     }
                     return t
                   })
                   return [
                     {
                       id: generateUniqueId(),
                       date: formattedDate,
                       pair: currentSym,
                       type: isSimShort ? 'SHORT' : 'LONG',
                       investment: `${symb}${tradeInvestmentRef.current.toLocaleString()}`,
                       leverage: '10X',
                       profit: formatPnl,
                       returnPct: returnPctStr,
                       status: exitStatus,
                       entryPrice: entryPriceVal,
                       highestPrice: extremePriceVal || entryPriceVal,
                       exitPrice: newClose || 0,
                       action: 'SELL'
                     },
                     ...updated.slice(0, 999)
                   ]
                 })
                triggerDesktopNotification(
                  finalPnl >= 0 ? `🎯 TARGET HIT: ${currentSym}` : `⚠️ STOP LOSS: ${currentSym}`,
                  `${finalPnl >= 0 ? 'Profit' : 'Loss'} of ${formatPnl} (${returnPctStr}) at ${symb}${newClose.toLocaleString()}`
                )

                // Close the position and reset simulation indicators
                costBasisRef.current = null
                simPositionExtremePriceRef.current = null
                
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
          id: generateUniqueId(),
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
          id: generateUniqueId(),
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
      const sym = selectedSymbolRef.current || selectedSymbol || '';
      const res = await fetch(`/api/v1/signals/account-balance?symbol=${encodeURIComponent(sym)}`)
      const data = await res.json()
      if (data && typeof data.balance === 'number') {
        setRealAccountBalance(data.balance)
        realAccountBalanceRef.current = data.balance
        if (activeModeRef.current === 'real') {
          setBalance(data.balance)
        }
        if (data.asset) {
          setRealAccountAsset(data.asset)
          localStorage.setItem('realAccountAsset', data.asset)
        }
      }
    } catch (e) {
      console.error('Error fetching real account balance:', e)
    }
  }

  const fetchActivePositions = async () => {
    try {
      const res = await fetch('/api/v1/signals/active-positions')
      const data = await res.json()
      if (data) {
        setActivePositions(data)
      }
    } catch (e) {
      console.error('Error fetching active positions:', e)
    }
  }

  const handleForceClearPositions = async () => {
    if (window.confirm("Are you sure you want to force clear the bot's active positions? Only do this if you have already manually exited the trade on Angel One.")) {
      try {
        const res = await fetch('/api/v1/signals/clear-active-positions', { method: 'POST' })
        const data = await res.json()
        if (data.status === 'success') {
          setActivePositions({})
          triggerDesktopNotification("Positions Cleared", "The bot's active positions have been force cleared.")
        }
      } catch (e) {
        console.error('Error clearing active positions:', e)
      }
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
      fetchActivePositions()

      const balInterval = setInterval(() => {
        fetchRealBalance()
        fetchActivePositions()
      }, 5000)

      return () => clearInterval(balInterval)
    } else {
      setBalance(realizedBalance)
      setTodayPnl(realizedTodayPnl)
    }
  }, [activeMode, selectedSymbol])

  const handleModeSwitch = (mode) => {
    // Sync mode change to backend database settings
    const syncModeToBackend = async () => {
      try {
        const activeToken = token || useAuthStore.getState().token;
        if (activeToken) {
          const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : window.location.origin;
          await fetch(`${apiBase}/api/v1/auth/settings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeToken}`
            },
            body: JSON.stringify({
              active_mode: mode
            })
          });
        }
      } catch (e) {
        console.error('Failed to sync mode change to backend settings:', e);
      }
    };
    syncModeToBackend();

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
        fetchActivePositions()
      }, 500)
    } else {
      setActiveMode('demo')
      setMode('demo')
      setBalance(realizedBalance)
      setTodayPnl(realizedTodayPnl)
    }
  }

  // AI-Powered Trading Intelligence Functions
  const getApiBase = () => {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : window.location.origin
  }

  const fetchAiSettings = async () => {
    try {
      const activeToken = token || useAuthStore.getState().token
      const res = await fetch(`${getApiBase()}/api/v1/ai/settings?t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        console.log("[SETTINGS-FETCH] Loaded settings from backend. AI candle interval:", data.ai_candle_interval)
        setYoutubeApiKey(data.youtube_api_key)
        setClaudeApiKey(data.claude_api_key)
        setClaudeModel(data.claude_model || 'google/gemini-2.5-flash:free')
        setAiConsultationMode(data.ai_consultation_mode)
        setAiDailyBudget(data.ai_daily_budget)
        setAiCandleInterval(data.ai_candle_interval || '30s')
      }
    } catch (e) {
      console.error('Error fetching AI settings:', e)
    }
  }

  const fetchAiStatus = async () => {
    try {
      const activeToken = token || useAuthStore.getState().token
      const res = await fetch(`${getApiBase()}/api/v1/ai/status?t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAiStatus(data)
      }
    } catch (e) {
      console.error('Error fetching AI status:', e)
    }
  }

  const saveAiSettings = async () => {
    setSaveKeysStatus('Saving...')
    try {
      const activeToken = token || useAuthStore.getState().token
      const res = await fetch(`${getApiBase()}/api/v1/ai/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          youtube_api_key: youtubeApiKey,
          claude_api_key: claudeApiKey,
          claude_model: claudeModel,
          ai_consultation_mode: aiConsultationMode,
          ai_daily_budget: parseFloat(aiDailyBudget),
          ai_candle_interval: aiCandleInterval
        })
      })
      if (res.ok) {
        setSaveKeysStatus('Success! Settings saved.')
        setTimeout(() => setSaveKeysStatus(''), 3000)
        fetchAiStatus()
      } else {
        setSaveKeysStatus('Failed to save settings.')
      }
    } catch (e) {
      console.error('Error saving AI settings:', e)
      setSaveKeysStatus('Error saving settings.')
    }
  }


  const handleAiConsult = async () => {
    setAiConsulting(true)
    setAiConsultResult(null)
    try {
      const res = await fetch(`${getApiBase()}/api/v1/ai/consult`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          symbol: selectedSymbol,
          issue_type: 'manual'
        })
      })
      if (res.ok) {
        const data = await res.json()
        setAiConsultResult(data)
        fetchAiStatus()
        fetchConsultationsLog()
      } else {
        const err = await res.json()
        setAiConsultResult({ success: false, response: err.detail || 'Consultation failed.' })
      }
    } catch (e) {
      console.error('Error during AI consult:', e)
      setAiConsultResult({ success: false, response: 'Error during consultation. Ensure backend is running.' })
    } finally {
      setAiConsulting(false)
    }
  }

  const searchYouTube = async () => {
    setYtLoading(true)
    try {
      const res = await fetch(`${getApiBase()}/api/v1/ai/youtube/search?q=${encodeURIComponent(ytSearchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setYtVideos(data)
      }
    } catch (e) {
      console.error('Error searching YouTube:', e)
    } finally {
      setYtLoading(false)
    }
  }

  const learnFromVideo = async (video) => {
    setYtLearningId(video.video_id)
    try {
      const res = await fetch(`${getApiBase()}/api/v1/ai/youtube/learn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          video_id: video.video_id,
          title: video.title,
          channel: video.channel,
          description: video.description
        })
      })
      if (res.ok) {
        fetchAiStatus()
        fetchKnowledgeBase()
        alert(`Successfully extracted rules for: "${video.title}". It has been saved to the Strategy Knowledge Base!`)
      }
    } catch (e) {
      console.error('Error learning from video:', e)
    } finally {
      setYtLearningId(null)
    }
  }

  const fetchKnowledgeBase = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/v1/ai/knowledge`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setKnowledgeBase(data)
      }
    } catch (e) {
      console.error('Error fetching knowledge base:', e)
    }
  }

  const fetchConsultationsLog = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/v1/ai/consultations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setConsultationsLog(data)
      }
    } catch (e) {
      console.error('Error fetching consultations log:', e)
    }
  }

  const handleRunBacktest = async (strategyId) => {
    setIsBacktesting(true)
    setBacktestResult(null)
    setShowBacktestModal(true)
    try {
      const res = await fetch(`${getApiBase()}/api/v1/ai/backtest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          strategy_id: strategyId,
          symbol: selectedSymbol,
          mode: 'demo'
        })
      })
      if (res.ok) {
        const data = await res.json()
        setBacktestResult(data)
        // Refresh knowledge base to update confidence ratings
        fetchKnowledgeBase()
      } else {
        const errData = await res.json()
        setBacktestResult({ success: false, error: errData.error || 'Failed to complete backtest' })
      }
    } catch (e) {
      console.error('Error running backtest:', e)
      setBacktestResult({ success: false, error: 'Network error occurred during backtest execution.' })
    } finally {
      setIsBacktesting(false)
    }
  }

  // Load AI data when tab is active
  useEffect(() => {
    if (currentTab === 'aibrain') {
      fetchAiSettings()
      fetchAiStatus()
      fetchKnowledgeBase()
      fetchConsultationsLog()
      searchYouTube()
    }
  }, [currentTab])

  const startRetraining = async () => {
    if (isRetraining) return
    setIsRetraining(true)
    setRetrainProgress(0)

    const progressInterval = setInterval(() => {
      setRetrainProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 150)

    try {
      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : window.location.origin
      const response = await fetch(`${apiBase}/api/v1/signals/retrain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: selectedSymbol,
          mode: activeMode
        })
      })
      const result = await response.json()
      
      clearInterval(progressInterval)
      setRetrainProgress(100)
      
      setTimeout(() => {
        setIsRetraining(false)
        if (result.status === 'success' && result.metrics) {
          const updated = result.metrics.map(m => ({
            name: m.name,
            val: m.val,
            currentWidth: m.val,
            status: m.status || 'ACTIVE',
            weight: m.weight
          }))
          setAlgoMetrics(updated)
          fetchPredictionData()
        } else {
          console.error('Retraining failed:', result.message)
        }
      }, 500)
    } catch (error) {
      clearInterval(progressInterval)
      setRetrainProgress(100)
      setTimeout(() => {
        setIsRetraining(false)
        console.error('Error retraining models:', error)
      }, 500)
    }
  }

  const exportHistoryToCSV = () => {
    const headers = ['Timestamp', 'Asset Pair', 'Position', 'Investment', 'Leverage', 'Entry Price', 'Exit Price', 'Net Profit', 'Return', 'Trigger Reason']
    const rows = tradeHistory.map(trade => [
      trade.date,
      trade.pair,
      trade.type,
      trade.investment || `${getCurrencySymbol(trade.pair)}${tradeInvestment.toLocaleString()}`,
      trade.leverage,
      trade.entryPrice ? `${getCurrencySymbol(trade.pair)}${trade.entryPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '—',
      trade.exitPrice ? `${getCurrencySymbol(trade.pair)}${trade.exitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '—',
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

  const clearTradeHistory = async () => {
    if (window.confirm('Are you sure you want to clear all trade history entries?')) {
      setTradeHistory([])
      setChartMarkers([])
      localStorage.setItem('tradeHistory', JSON.stringify([]))
      try {
        const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : window.location.origin
        await fetch(`${apiBase}/api/v1/signals/clear-trade-history`, { 
          method: 'POST',
          headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
        })
        await fetch(`${apiBase}/api/v1/signals/clear-active-positions`, { 
          method: 'POST',
          headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
        })
        setActivePositions({})
        pollAutoModeStatus()
      } catch (e) {
        console.error('Failed to clear trade history on backend:', e)
      }
    }
  }

  const resetWalletBalance = async () => {
    if (activeMode === 'real') {
      if (window.confirm('Reset simulated Real Mode P&L back to zero? (Your actual broker account balance will not be affected)')) {
        realAccountPnlRef.current = 0.00
        setRealAccountPnl(0.00)
        setTodayPnl(0.00)
        setChartMarkers([])
        fetchRealBalance()
        try {
          const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : window.location.origin
          await fetch(`${apiBase}/api/v1/signals/clear-trade-history`, { method: 'POST' })
        } catch (e) {
          console.error(e)
        }
      }
    } else {
      const startingAmt = isCryptoActive ? 10.00 : 100.00
      const startingSymbol = isCryptoActive ? '$' : '₹'
      if (window.confirm(`Reset wallet total balance back to starting ${startingSymbol}${startingAmt.toLocaleString()}?`)) {
        realizedBalanceRef.current = startingAmt
        realizedTodayPnlRef.current = 0.00
        setRealizedBalance(startingAmt)
        setRealizedTodayPnl(0.00)
        setBalance(startingAmt)
        setTodayPnl(0.00)
        setChartMarkers([])
        try {
          const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : window.location.origin
          await fetch(`${apiBase}/api/v1/signals/clear-trade-history`, { method: 'POST' })
          await fetch(`${apiBase}/api/v1/signals/clear-active-positions`, { method: 'POST' })
          setActivePositions({})
        } catch (e) {
          console.error(e)
        }
      }
    }
  }

  const clearLogs = () => {
    setLogs([])
    localStorage.setItem('tradeLogs', JSON.stringify([]))
  }

  const completedTrades = tradeHistory.filter(t => t.action !== 'BUY')

  const totalLedgerPnl = completedTrades.reduce((acc, t) => {
    const val = parseFloat(t.profit.replace(/[+₹$\s,]/g, '')) || 0
    return acc + val
  }, 0)

  const totalLedgerVolume = completedTrades.reduce((acc, t) => {
    const val = parseFloat((t.investment || '0').replace(/[₹$\s,]/g, '')) || 0
    return acc + val
  }, 0)

  const winCount = completedTrades.filter(t => t.status === 'TARGET HIT' || t.profit.startsWith('+')).length
  const totalCount = completedTrades.length
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
          
          {/* Algorithms tab removed to support 100% pure Full AI Mode navigation */}
          
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

          <button
            onClick={() => setCurrentTab('aibrain')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              currentTab === 'aibrain' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-[#162035]'
            }`}
          >
            <span className="material-symbols-outlined text-xl">psychology</span>
            <span className="text-sm font-semibold">AI Brain</span>
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
      <main className="md:ml-64 flex flex-col min-h-screen md:h-screen md:min-h-0 md:overflow-hidden flex-1 min-w-0">
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
              <span className="font-bold text-cyan-400">
                {getPortfolioCurrencySymbol()}{
                  (displayedBalance * 100) % 1 !== 0
                    ? displayedBalance.toLocaleString(getPortfolioCurrencySymbol() === '$' ? 'en-US' : 'en-IN', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
                    : displayedBalance.toLocaleString(getPortfolioCurrencySymbol() === '$' ? 'en-US' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                }
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 md:space-x-4">
            <div className="flex items-center space-x-0.5 md:space-x-3 pr-1 md:pr-4 md:border-r border-[#1E2D4A]">
              {/* Notifications Popover */}
              <div className="static md:relative" ref={notificationsRef}>
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
                <div className={`absolute right-4 left-4 md:left-auto md:right-0 md:w-80 top-16 md:top-full mt-2 rounded-xl border border-[#1E2D4A] bg-[#0F1629] p-4 shadow-2xl transition-all duration-200 z-50 ${
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
                      notifications.map(n => {
                        let cardClass = "text-xs border-b border-[#1E2D4A]/40 pb-2 last:border-0 last:pb-0";
                        if (n.action === 'AI_APPROVED') {
                          cardClass = "text-xs bg-emerald-500/5 border-l-2 border-emerald-500 pl-2.5 py-1.5 rounded-r border-b border-[#1E2D4A]/20 last:border-0 my-1 first:mt-0";
                        } else if (n.action === 'AI_REJECTED') {
                          cardClass = "text-xs bg-red-500/5 border-l-2 border-red-500 pl-2.5 py-1.5 rounded-r border-b border-[#1E2D4A]/20 last:border-0 my-1 first:mt-0";
                        } else if (n.action === 'AI_ANALYZING') {
                          cardClass = "text-xs bg-cyan-500/5 border-l-2 border-cyan-400 pl-2.5 py-1.5 rounded-r border-b border-[#1E2D4A]/20 last:border-0 my-1 first:mt-0 animate-pulse";
                        } else if (n.action === 'BUY') {
                          cardClass = "text-xs bg-emerald-500/5 border-l-2 border-emerald-500/50 pl-2.5 py-1.5 rounded-r border-b border-[#1E2D4A]/20 last:border-0 my-1 first:mt-0";
                        } else if (n.action === 'CLOSE') {
                          const isWin = n.title.includes('TARGET') || n.title.includes('PROFIT');
                          cardClass = isWin 
                            ? "text-xs bg-emerald-500/5 border-l-2 border-emerald-500/50 pl-2.5 py-1.5 rounded-r border-b border-[#1E2D4A]/20 last:border-0 my-1 first:mt-0"
                            : "text-xs bg-red-500/5 border-l-2 border-red-500/50 pl-2.5 py-1.5 rounded-r border-b border-[#1E2D4A]/20 last:border-0 my-1 first:mt-0";
                        }
                        
                        return (
                          <div key={n.id} className={cardClass}>
                            <p className="font-bold text-white mb-0.5">{n.title}</p>
                            <p className="text-slate-400 text-[11px] leading-relaxed">{n.desc}</p>
                            <span className="text-[10px] text-slate-500 mt-1 block">{n.time}</span>
                          </div>
                        );
                      })
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
                          onChange={(e) => handleToggleAutoTrade(e.target.checked)}
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
                          <span className="text-slate-500 font-bold">{getPortfolioCurrencySymbol()}</span>
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



                    {/* Daily Profit Target */}
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-slate-400">Daily Profit Target</span>
                        <span className="text-cyan-400 font-bold">{getPortfolioCurrencySymbol()}{dailyProfitTarget}</span>
                      </div>
                      <input 
                        type="number" 
                        min="0" 
                        step="10"
                        value={dailyProfitTarget}
                        onChange={(e) => setDailyProfitTarget(parseFloat(e.target.value) || 0.0)}
                        className="w-full bg-[#162035] text-white border border-[#1E2D4A] rounded-lg p-2 text-xs font-mono-data focus:outline-none focus:border-cyan-400"
                        placeholder="0 = Disabled"
                      />
                    </div>

                    {/* Daily Loss Limit */}
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-slate-400">Daily Loss Limit</span>
                        <span className="text-red-400 font-bold">{getPortfolioCurrencySymbol()}{dailyLossLimit}</span>
                      </div>
                      <input 
                        type="number" 
                        min="0" 
                        step="10"
                        value={dailyLossLimit}
                        onChange={(e) => setDailyLossLimit(parseFloat(e.target.value) || 0.0)}
                        className="w-full bg-[#162035] text-white border border-[#1E2D4A] rounded-lg p-2 text-xs font-mono-data focus:outline-none focus:border-cyan-400"
                        placeholder="0 = Disabled"
                      />
                    </div>

                    {/* Trailing Stop Loss Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-200 font-bold block">Trailing Stop-Loss</span>
                        <p className="text-[9px] text-slate-500 mt-0.5">Move SL to breakeven & trail profit steps.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={enableTrailingStop}
                          onChange={(e) => setEnableTrailingStop(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#162035] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner"></div>
                      </label>
                    </div>

                    {/* Auto-Start on Login Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-200 font-bold block">Auto-Start on Login</span>
                        <p className="text-[9px] text-slate-500 mt-0.5">Auto-run bot when app finishes loading.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={autoStartOnLogin}
                          onChange={(e) => setAutoStartOnLogin(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#162035] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner"></div>
                      </label>
                    </div>

                    {/* Allowed Trade Direction dropdown select */}
                    <div className="border-t border-[#1E2D4A]/50 pt-3">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-slate-400">Allowed Trade Direction</span>
                      </div>
                      <select 
                        value={tradeDirection}
                        onChange={(e) => setTradeDirection(e.target.value)}
                        className="w-full bg-[#162035] text-cyan-400 border border-[#1E2D4A] rounded-lg p-2 text-xs font-bold focus:outline-none"
                      >
                        <option value="BOTH">BOTH (LONG & SHORT Trades)</option>
                        <option value="LONG_ONLY">LONG ONLY (Recommended for Nifty 50)</option>
                        <option value="SHORT_ONLY">SHORT ONLY (Bearish Trades Only)</option>
                      </select>
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
                        <span className="text-slate-400">Auto-Trade Shares</span>
                        <span className="text-cyan-400 font-bold">
                          {tradeShares} {isCryptoActive ? 'Units' : 'Shares'}
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min={isCryptoActive ? 0.001 : 1} 
                        max={isCryptoActive ? 10 : 1000} 
                        step={isCryptoActive ? 0.001 : 1}
                        value={tradeShares}
                        onChange={(e) => setTradeShares(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 bg-slate-800 rounded-lg appearance-none h-1 cursor-pointer mb-2.5"
                      />
                      <div className="grid grid-cols-6 gap-1">
                        {(isCryptoActive ? [0.001, 0.01, 0.1, 0.5, 1.0, 5.0] : [1, 2, 5, 10, 50, 100]).map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setTradeShares(amt)}
                            className={`py-1 rounded text-[9px] font-mono-data border cursor-pointer transition-all text-center ${
                              tradeShares === amt ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'bg-[#162035] border-[#1E2D4A] text-slate-400 hover:text-white'
                            }`}
                          >
                            {amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-[#1E2D4A]/50 pt-3">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-slate-400">Position Leverage</span>
                        <span className="text-cyan-400 font-bold">
                          {leverage}X
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min={1} 
                        max={100} 
                        step={1}
                        value={leverage}
                        onChange={(e) => setLeverage(parseInt(e.target.value))}
                        className="w-full accent-cyan-400 bg-slate-800 rounded-lg appearance-none h-1 cursor-pointer mb-2.5"
                      />
                      <div className="grid grid-cols-6 gap-1">
                        {[1, 5, 10, 25, 50, 100].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setLeverage(amt)}
                            className={`py-1 rounded text-[9px] font-mono-data border cursor-pointer transition-all text-center ${
                              leverage === amt ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'bg-[#162035] border-[#1E2D4A] text-slate-400 hover:text-white'
                            }`}
                          >
                            {amt}X
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Algorithm (Technical Indicators) Toggle */}
                    <div className="border-t border-[#1E2D4A]/50 pt-3 pb-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-400">Technical Algorithms</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={useAlgorithms}
                            onChange={(e) => setUseAlgorithms(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-[#162035] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner"></div>
                        </label>
                      </div>
                      <p className="text-[9px] text-slate-500 leading-normal">
                        {useAlgorithms 
                          ? "Hybrid Mode: Bot triggers on technical indicators (RSI, MACD) first, then gets AI confirmation." 
                          : "Full AI Mode: Technical indicators are bypassed. The AI scans and makes entry decisions directly."}
                      </p>
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
                        
                        <div>
                          <label className="text-[9px] text-slate-500 uppercase font-bold">Allowed Trade Direction</label>
                          <select 
                            value={tradeDirection}
                            onChange={(e) => setTradeDirection(e.target.value)}
                            className="w-full bg-[#090D1A] border border-[#1E2D4A] rounded-lg px-2 py-1 text-[11px] text-cyan-400 font-mono-data outline-none"
                          >
                            <option value="BOTH">BOTH (LONG & SHORT Trades)</option>
                            <option value="LONG_ONLY">LONG ONLY (Recommended for Nifty 50)</option>
                            <option value="SHORT_ONLY">SHORT ONLY (Bearish Trades Only)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={async () => {
                        localStorage.setItem('brokerGateway', brokerGateway)
                        localStorage.setItem('brokerApiKey', brokerApiKey)
                        localStorage.setItem('brokerApiSecret', brokerApiSecret)
                        localStorage.setItem('tradeDirection', tradeDirection)
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
                              enable_telegram: enableTelegram,
                              daily_profit_target: parseFloat(dailyProfitTarget) || 0.0,
                              daily_loss_limit: parseFloat(dailyLossLimit) || 0.0,
                              enable_trailing_stop: enableTrailingStop,
                              auto_start_on_login: autoStartOnLogin,
                              trade_investment_usd: tradeInvestmentUSD,
                              trade_investment_inr: tradeInvestmentINR,
                              trade_shares: tradeShares,
                              trade_direction: tradeDirection,
                              leverage: leverage,
                              use_algorithms: useAlgorithms
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
            <div className="flex items-center space-x-3 group">
              <button 
                onClick={logout} 
                className="text-xs font-mono-data text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer" 
                title="Click to log out"
              >
                LOGOUT
              </button>
              <div 
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setIsSettingsOpen(true);
                  } else {
                    setIsSettingsOpen(prev => !prev);
                    setIsNotificationsOpen(false);
                  }
                }}
                className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[10px] font-bold text-cyan-400 cursor-pointer hover:ring-2 ring-cyan-500/30"
                title="Open Settings"
              >
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'TE'}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Pages Switcher */}
        <div className="flex-1 md:h-[calc(100vh-4rem)] md:overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 pb-36 md:pb-32">
          
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
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 gap-3 md:gap-4 my-2">
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
                      title={`Reset Wallet Balance back to starting ${getPortfolioCurrencySymbol()}${(getPortfolioCurrencySymbol() === '$' ? 10.00 : 100.00).toLocaleString(getPortfolioCurrencySymbol() === '$' ? 'en-US' : 'en-IN')}`}
                    >
                      <span className="material-symbols-outlined text-[12px]">restart_alt</span>
                      <span>Reset</span>
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Total Balance</p>
                    <h2 className={`text-2xl md:text-3xl font-mono-data font-bold text-white tracking-tight ${isPriceFlashing ? 'price-flash' : ''}`}>
                      {getPortfolioCurrencySymbol()}{
                        (displayedBalance * 100) % 1 !== 0
                          ? displayedBalance.toLocaleString(getPortfolioCurrencySymbol() === '$' ? 'en-US' : 'en-IN', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
                          : displayedBalance.toLocaleString(getPortfolioCurrencySymbol() === '$' ? 'en-US' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      }
                    </h2>
                  </div>
                  <div className="my-3 grid grid-cols-2 gap-2">
                    <div className="p-2 md:p-3 rounded-lg border border-[#1E2D4A] bg-[#080C18]/40">
                      <p className="text-[8px] md:text-[9px] text-slate-500 uppercase font-bold mb-0.5">Today P&L</p>
                      <div className="flex items-center space-x-1">
                        <span className={`text-xs md:text-sm font-mono-data ${todayPnl >= 0 ? 'text-[#00E676]' : 'text-[#FF3D57]'}`}>
                          {todayPnl >= 0 ? '+' : '-'}{getPortfolioCurrencySymbol()}{
                            Math.abs(todayPnl) > 0 && Math.abs(todayPnl) < 0.01
                              ? Math.abs(todayPnl).toFixed(4)
                              : Math.abs(todayPnl).toFixed(2)
                          }
                        </span>
                      </div>
                    </div>
                    <div className="p-2 md:p-3 rounded-lg border border-[#1E2D4A] bg-[#080C18]/40">
                      <p className="text-[8px] md:text-[9px] text-slate-500 uppercase font-bold mb-0.5">Win Rate</p>
                      <p className="text-xs md:text-sm font-mono-data text-cyan-400">68.4%</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-[9px] font-mono-data text-slate-500 pt-1 border-t border-[#1E2D4A]/40">
                    <span>LEVERAGE: {leverage}X</span>
                    <span>STATUS: OPTIMIZED</span>
                  </div>
                </div>


                {/* Auto-Mode Command Center Card */}
                <div className="premium-card rounded-xl p-4 md:p-6 flex flex-col h-auto md:h-56 justify-between border border-cyan-500/20 bg-[#080C18]/60 shadow-[0_0_15px_rgba(0,180,255,0.05)]">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Auto-Mode Control</p>
                    <span className={`w-2 h-2 rounded-full ${autoTrade ? 'bg-[#00E676] animate-pulse shadow-[0_0_8px_#00E676]' : 'bg-amber-500'}`}></span>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Daily Goal Progress</span>
                      <span className="text-[10px] text-cyan-400 font-mono-data font-bold">
                        {dailyProfitTarget > 0 ? `${Math.min(100, Math.max(0, (dailyPnl / dailyProfitTarget) * 100)).toFixed(0)}%` : 'INACTIVE'}
                      </span>
                    </div>
                    {dailyProfitTarget > 0 ? (
                      <div className="h-1.5 w-full bg-[#111827] rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-[#00E676] transition-all duration-500" 
                          style={{ width: `${Math.min(100, Math.max(0, (dailyPnl / dailyProfitTarget) * 100))}%` }}
                        ></div>
                      </div>
                    ) : (
                      <div className="text-[8px] text-slate-500 italic mb-2">Set target to track goal.</div>
                    )}
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono-data">
                      <span>METRIC: {getPortfolioCurrencySymbol()}{dailyPnl.toFixed(2)}</span>
                      <span>TARGET: {getPortfolioCurrencySymbol()}{dailyProfitTarget.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 space-y-1.5">
                    <button
                      onClick={() => handleToggleAutoTrade(!autoTrade)}
                      className={`w-full py-1.5 rounded-lg text-[9px] font-bold cursor-pointer transition-all uppercase tracking-wider text-center ${
                        autoTrade 
                          ? 'bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20'
                          : 'bg-cyan-500/10 border border-cyan-400/40 text-cyan-400 hover:bg-cyan-500/20'
                      }`}
                    >
                      {autoTrade ? 'Stop Auto-Mode' : 'Start Auto-Mode'}
                    </button>
                    {isCryptoActive ? (
                      brokerGateway.toLowerCase().includes('binance') ? (
                        <div className="flex items-center justify-center space-x-1.5 py-1 px-2 rounded-lg bg-[#00E676]/10 border border-[#00E676]/20 text-[9px] text-[#00E676] font-sans font-bold tracking-wider uppercase">
                          <span className="material-symbols-outlined text-[11px]">check_circle</span>
                          <span>Binance Live Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-1.5 py-1 px-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[9px] text-[#FF3D57] font-sans font-bold tracking-wider uppercase animate-pulse">
                          <span className="material-symbols-outlined text-[11px] text-red-400">warning</span>
                          <span>Binance Required for Crypto</span>
                        </div>
                      )
                    ) : (
                      brokerGateway.toLowerCase().includes('angel') ? (
                        <div className="flex items-center justify-center space-x-1.5 py-1 px-2 rounded-lg bg-[#00E676]/10 border border-[#00E676]/20 text-[9px] text-[#00E676] font-sans font-bold tracking-wider uppercase">
                          <span className="material-symbols-outlined text-[11px]">check_circle</span>
                          <span>Angel One Live Active</span>
                        </div>
                      ) : brokerGateway.toLowerCase().includes('upstox') ? (
                        <div className="flex items-center justify-center space-x-1.5 py-1 px-2 rounded-lg bg-[#00E676]/10 border border-[#00E676]/20 text-[9px] text-[#00E676] font-sans font-bold tracking-wider uppercase">
                          <span className="material-symbols-outlined text-[11px]">check_circle</span>
                          <span>Upstox Live Active</span>
                        </div>
                      ) : brokerGateway.toLowerCase().includes('shoonya') ? (
                        <div className="flex items-center justify-center space-x-1.5 py-1 px-2 rounded-lg bg-[#00E676]/10 border border-[#00E676]/20 text-[9px] text-[#00E676] font-sans font-bold tracking-wider uppercase">
                          <span className="material-symbols-outlined text-[11px]">check_circle</span>
                          <span>Shoonya Live Active</span>
                        </div>
                      ) : brokerGateway.toLowerCase().includes('zerodha') ? (
                        <div className="flex items-center justify-center space-x-1.5 py-1 px-2 rounded-lg bg-[#00E676]/10 border border-[#00E676]/20 text-[9px] text-[#00E676] font-sans font-bold tracking-wider uppercase">
                          <span className="material-symbols-outlined text-[11px]">check_circle</span>
                          <span>Zerodha Live Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-1.5 py-1 px-2 rounded-lg bg-slate-500/10 border border-slate-500/20 text-[9px] text-slate-400 font-sans font-bold tracking-wider uppercase">
                          <span className="material-symbols-outlined text-[11px]">info</span>
                          <span>Live Account Active</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Open Positions Card (Show in both Demo and Real modes) */}
              {true && (
                <div className="premium-card rounded-xl p-6 my-4 border border-cyan-500/20 bg-[#080C18]/60 shadow-[0_0_15px_rgba(0,180,255,0.05)]">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#1E2D4A]/50">
                    <div className="flex items-center space-x-2">
                      <span className="material-symbols-outlined text-[#00E676] animate-pulse">radar</span>
                      <h3 className="text-sm font-headline font-bold text-white uppercase tracking-wider">Active Open Positions</h3>
                    </div>
                    <div className="flex items-center space-x-3">
                      {Object.keys(activePositions).length > 0 && (
                        <button
                          onClick={handleForceClearPositions}
                          className="px-2 py-0.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 text-[10px] font-bold rounded cursor-pointer transition-colors flex items-center space-x-1"
                          title="Force clear bot positions if manually exited on broker"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                          <span>Force Clear Bot</span>
                        </button>
                      )}
                      <span className="px-2 py-0.5 bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] rounded text-[10px] font-bold">
                        {Object.keys(activePositions).length} RUNNING
                      </span>
                    </div>
                  </div>

                  {Object.keys(activePositions).length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-500 font-medium">No active real positions on your broker.</p>
                      <p className="text-[10px] text-slate-600 mt-1">Auto-trade bot is online and scanning markets for directives.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#1E2D4A] text-slate-500 text-[9px] uppercase font-bold tracking-wider">
                            <th className="pb-2">Market</th>
                            <th className="pb-2">Type</th>
                            <th className="pb-2">Size / Investment</th>
                            <th className="pb-2">Entry Price</th>
                            <th className="pb-2">Current Price</th>
                            <th className="pb-2">Target (Exit SL)</th>
                            <th className="pb-2 text-right">Est. Win / Loss</th>
                            <th className="pb-2 text-right">Unrealized P&L</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2D4A]/40 text-xs font-mono-data">
                          {Object.entries(activePositions).map(([sym, pos]) => {
                            // Find matching tick price from chartData
                            const lastCandle = chartData && chartData.length > 0 ? chartData[chartData.length - 1] : null;
                            const currentPrice = sym === selectedSymbol && lastCandle ? lastCandle.close : pos.entry_price;
                            
                            const direction = pos.direction === 'SHORT' ? 'SHORT' : 'LONG';
                            const diffPct = ((currentPrice - pos.entry_price) / pos.entry_price) * 100;
                            const rawLeveragedPnlPct = diffPct * 10; // 10X Leverage
                            const leveragedPnlPct = direction === 'SHORT' ? -rawLeveragedPnlPct : rawLeveragedPnlPct;
                            const pnlAmount = (pos.qty * pos.entry_price) * (leveragedPnlPct / 100);
                            const isProfit = leveragedPnlPct >= 0;

                            // Calculate Target and Stop Loss values
                            const slLimit = stopLossLimit || 2.0;
                            const target_str = profitTarget || '1.5X';
                            const mult = target_str === '1.2X' ? 1.2 : (target_str === '2.0X' ? 2.0 : 1.5);
                            const targetPct = slLimit * mult;
                            
                            const targetPrice = pos.target_price || (direction === 'SHORT'
                              ? pos.entry_price * (1 - targetPct / 100)
                              : pos.entry_price * (1 + targetPct / 100));
                            const stopLossPrice = pos.stop_loss_price || (direction === 'SHORT'
                              ? pos.entry_price * (1 + slLimit / 100)
                              : pos.entry_price * (1 - slLimit / 100));
                            
                            const possibleWin = Math.abs(targetPrice - pos.entry_price) * pos.qty;
                            const possibleLoss = Math.abs(stopLossPrice - pos.entry_price) * pos.qty;
                            const currencySym = getCurrencySymbol(sym);

                            return (
                              <tr key={sym} className="text-white hover:bg-slate-500/5">
                                <td className="py-2.5 font-sans font-bold text-cyan-400">{sym}</td>
                                <td className="py-2.5">
                                  <span className={`px-1.5 py-0.5 border rounded text-[9px] font-bold ${
                                    direction === 'SHORT'
                                      ? 'bg-[#FF3D57]/10 border-[#FF3D57]/20 text-[#FF3D57]'
                                      : 'bg-[#00E676]/10 border-[#00E676]/20 text-[#00E676]'
                                  }`}>
                                    {direction === 'SHORT' ? 'SELL / SHORT' : 'BUY / LONG'}
                                  </span>
                                </td>
                                <td className="py-2.5 text-slate-300">
                                  {(() => {
                                    const isCrypto = sym.includes('BTC') || sym.includes('ETH') || sym.includes('SOL') || sym.includes('ADA');
                                    const marginBlocked = (pos.qty * pos.entry_price) / leverage;
                                    const totalValue = pos.qty * pos.entry_price;
                                    return (
                                      <>
                                        <div className="font-bold">{pos.qty} {isCrypto ? 'Units' : 'Shares'}</div>
                                        <div className="text-[10px] text-slate-400 font-sans" title="Blocked margin (actual investment)">Margin: {currencySym}{marginBlocked.toFixed(2)}</div>
                                        <div className="text-[8px] text-slate-500 font-sans" title="Total position size">Total: {currencySym}{totalValue.toFixed(2)}</div>
                                      </>
                                    );
                                  })()}
                                </td>
                                <td className="py-2.5 text-slate-300">{currencySym}{pos.entry_price.toFixed(2)}</td>
                                <td className="py-2.5 text-slate-300">{currencySym}{currentPrice.toFixed(2)}</td>
                                <td className="py-2.5 text-slate-300">
                                  <div className="text-[11px] text-[#00E676] font-bold">🎯 {currencySym}{targetPrice.toFixed(2)}</div>
                                  <div className="text-[9px] text-[#FF3D57]">🛡️ {currencySym}{stopLossPrice.toFixed(2)}</div>
                                </td>
                                <td className="py-2.5 text-right font-semibold">
                                  <div className="text-[11px] text-[#00E676] font-bold">+{currencySym}{possibleWin.toFixed(2)}</div>
                                  <div className="text-[9px] text-[#FF3D57]">-{currencySym}{possibleLoss.toFixed(2)}</div>
                                </td>
                                <td className={`py-2.5 text-right font-bold ${isProfit ? 'text-[#00E676]' : 'text-red-500'}`}>
                                  {isProfit ? '+' : ''}{currencySym}{pnlAmount.toFixed(2)} ({isProfit ? '+' : ''}{leveragedPnlPct.toFixed(2)}%)
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Market Ticker Selector Bar */}
              <div className="flex items-center space-x-2 overflow-x-auto py-1 my-2 no-scrollbar">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pr-1 flex items-center whitespace-nowrap">
                  <span className="material-symbols-outlined text-xs mr-1 text-cyan-400">show_chart</span>
                  Markets:
                </span>
                {visibleMarkets.map((pair) => {
                  const pairKey = pair.replace('/', '').replace(' ', '').toUpperCase()
                  const priceVal = marketPrices[pairKey]
                  const isCrypto = pair.includes('BTC') || pair.includes('ETH') || pair.includes('SOL') || pair.includes('ADA')
                  const marginVal = priceVal ? (priceVal / leverage) : null
                  return (
                    <div key={pair} className="relative flex items-center">
                      <button
                        onClick={() => setSelectedSymbol(pair)}
                        className={`pl-3 pr-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap border flex items-center space-x-1.5 ${
                          selectedSymbol === pair
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,200,255,0.2)]'
                            : 'bg-[#0A0F1D] border-[#1E2D4A] text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>
                          {pair}
                          {priceVal ? (
                            <span className="text-[9px] text-slate-400 ml-1">
                              {getCurrencySymbol(pair)}{priceVal.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}
                              <span className="text-cyan-400 ml-1">
                                (Margin: {getCurrencySymbol(pair)}{marginVal.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})})
                              </span>
                            </span>
                          ) : ''}
                        </span>
                      {visibleMarkets.length > 1 && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            const nextMarkets = visibleMarkets.filter((m) => m !== pair)
                            setVisibleMarkets(nextMarkets)
                            if (selectedSymbol === pair) {
                              setSelectedSymbol(nextMarkets[0])
                            }
                          }}
                          className="text-slate-500 hover:text-red-400 text-[11px] font-bold px-0.5 cursor-pointer"
                          title="Remove from list"
                        >
                          ×
                        </span>
                      )}
                    </button>
                  </div>
                  )
                })}
                
                {/* Search & Add Market input */}
                <div ref={marketSearchRef} className="relative flex items-center z-50">
                  <div className="flex items-center bg-[#090D1A] border border-[#1E2D4A]/80 hover:border-cyan-500/40 rounded-lg px-2 py-1 text-xs text-slate-300 transition-colors">
                    <span className="material-symbols-outlined text-xs mr-1 text-slate-500">search</span>
                    <input
                      type="text"
                      placeholder="Add market..."
                      value={marketSearchQuery}
                      onChange={(e) => {
                        setMarketSearchQuery(e.target.value)
                        setIsSearchDropdownOpen(true)
                      }}
                      onFocus={() => setIsSearchDropdownOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && marketSearchQuery.trim()) {
                          e.preventDefault()
                          const q = marketSearchQuery.trim().toUpperCase()
                          const allAvailableMarkets = ['NIFTY 50', 'SENSEX', 'RELIANCE', 'TCS', 'RPOWER', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'AAPL', 'MSFT', 'TSLA', 'NVDA', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'TATAMOTORS', 'WIPRO']
                          const matched = allAvailableMarkets.find(m => m.toUpperCase() === q || m.toUpperCase().includes(q)) || q
                          if (!visibleMarkets.includes(matched)) {
                            setVisibleMarkets(prev => [...prev, matched])
                          }
                          setSelectedSymbol(matched)
                          setMarketSearchQuery('')
                          setIsSearchDropdownOpen(false)
                        }
                      }}
                      className="bg-transparent border-none outline-none text-[10px] text-white w-20 focus:w-28 transition-all duration-200 placeholder:text-slate-600 font-bold"
                    />
                    {marketSearchQuery ? (
                      <button
                        onClick={() => {
                          const q = marketSearchQuery.trim().toUpperCase()
                          const allAvailableMarkets = ['NIFTY 50', 'SENSEX', 'RELIANCE', 'TCS', 'RPOWER', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'AAPL', 'MSFT', 'TSLA', 'NVDA', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'TATAMOTORS', 'WIPRO']
                          const matched = allAvailableMarkets.find(m => m.toUpperCase() === q || m.toUpperCase().includes(q)) || q
                          if (!visibleMarkets.includes(matched)) {
                            setVisibleMarkets(prev => [...prev, matched])
                          }
                          setSelectedSymbol(matched)
                          setMarketSearchQuery('')
                          setIsSearchDropdownOpen(false)
                        }}
                        className="bg-cyan-500 hover:bg-cyan-400 text-black text-[9px] font-bold px-1.5 py-0.5 rounded ml-1 cursor-pointer"
                        title="Add symbol"
                      >
                        + ADD
                      </button>
                    ) : null}
                  </div>
                  
                  {isSearchDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-44 bg-[#0A0F1D] border border-[#1E2D4A] rounded-lg shadow-2xl z-[100] max-h-48 overflow-y-auto py-1">
                      {(() => {
                        const allAvailableMarkets = ['NIFTY 50', 'SENSEX', 'RELIANCE', 'TCS', 'RPOWER', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'AAPL', 'MSFT', 'TSLA', 'NVDA', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'TATAMOTORS', 'WIPRO']
                        const filtered = allAvailableMarkets.filter(
                          (m) =>
                            !visibleMarkets.includes(m) &&
                            m.toLowerCase().includes(marketSearchQuery.toLowerCase())
                        )
                        if (filtered.length === 0) {
                          if (marketSearchQuery.trim()) {
                            const customSym = marketSearchQuery.trim().toUpperCase()
                            return (
                              <button
                                onClick={() => {
                                  if (!visibleMarkets.includes(customSym)) {
                                    setVisibleMarkets(prev => [...prev, customSym])
                                  }
                                  setSelectedSymbol(customSym)
                                  setMarketSearchQuery('')
                                  setIsSearchDropdownOpen(false)
                                }}
                                className="w-full text-left px-3 py-1.5 text-[10px] text-cyan-400 hover:bg-cyan-500/10 transition-colors font-bold cursor-pointer"
                              >
                                + Add "{customSym}"
                              </button>
                            )
                          }
                          return (
                            <div className="px-3 py-1.5 text-[9px] text-slate-500 font-bold">
                              All markets added
                            </div>
                          )
                        }
                        return filtered.map((m) => (
                          <button
                            key={m}
                            onClick={() => {
                              setVisibleMarkets((prev) => [...prev, m])
                              setSelectedSymbol(m)
                              setMarketSearchQuery('')
                              setIsSearchDropdownOpen(false)
                            }}
                            className="w-full text-left px-3 py-1.5 text-[10px] text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors font-bold cursor-pointer"
                          >
                            + {m}
                          </button>
                        ))
                      })()}
                    </div>
                  )}
                </div>
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
                          onClick={() => handleTimeframeChange(tf)}
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
              <div className="w-full">
                {/* Trade Log */}
                <div className="premium-card rounded-xl p-6 h-[340px] flex flex-col w-full">
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
                {visibleMarkets.map((pair) => {
                  const pairKey = pair.replace('/', '').replace(' ', '').toUpperCase()
                  const priceVal = marketPrices[pairKey]
                  const isCrypto = pair.includes('BTC') || pair.includes('ETH') || pair.includes('SOL') || pair.includes('ADA')
                  const marginVal = priceVal ? (priceVal / leverage) : null
                  return (
                    <div key={pair} className="relative flex items-center">
                      <button
                        onClick={() => setSelectedSymbol(pair)}
                        className={`pl-3 pr-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap border flex items-center space-x-1.5 ${
                          selectedSymbol === pair
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,200,255,0.2)]'
                            : 'bg-[#111827] border-[#1E2D4A] text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>
                          {pair}
                          {priceVal ? (
                            <span className="text-[9px] text-slate-400 ml-1">
                              {getCurrencySymbol(pair)}{priceVal.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}
                              <span className="text-cyan-400 ml-1">
                                (Margin: {getCurrencySymbol(pair)}{marginVal.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})})
                              </span>
                            </span>
                          ) : ''}
                        </span>
                      {visibleMarkets.length > 1 && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            const nextMarkets = visibleMarkets.filter((m) => m !== pair)
                            setVisibleMarkets(nextMarkets)
                            if (selectedSymbol === pair) {
                              setSelectedSymbol(nextMarkets[0])
                            }
                          }}
                          className="text-slate-500 hover:text-red-400 text-[11px] font-bold px-0.5 cursor-pointer"
                          title="Remove from list"
                        >
                          ×
                        </span>
                      )}
                    </button>
                  </div>
                  )
                })}

                {/* Search & Add Market input */}
                <div ref={marketSearchRef2} className="relative flex items-center z-50">
                  <div className="flex items-center bg-[#090D1A] border border-[#1E2D4A]/80 hover:border-cyan-500/40 rounded-lg px-2 py-1 text-xs text-slate-300 transition-colors">
                    <span className="material-symbols-outlined text-xs mr-1 text-slate-500">search</span>
                    <input
                      type="text"
                      placeholder="Add market..."
                      value={marketSearchQuery2}
                      onChange={(e) => {
                        setMarketSearchQuery2(e.target.value)
                        setIsSearchDropdownOpen2(true)
                      }}
                      onFocus={() => setIsSearchDropdownOpen2(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && marketSearchQuery2.trim()) {
                          e.preventDefault()
                          const q = marketSearchQuery2.trim().toUpperCase()
                          const allAvailableMarkets = ['NIFTY 50', 'SENSEX', 'RELIANCE', 'TCS', 'RPOWER', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'AAPL', 'MSFT', 'TSLA', 'NVDA', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'TATAMOTORS', 'WIPRO']
                          const matched = allAvailableMarkets.find(m => m.toUpperCase() === q || m.toUpperCase().includes(q)) || q
                          if (!visibleMarkets.includes(matched)) {
                            setVisibleMarkets(prev => [...prev, matched])
                          }
                          setSelectedSymbol(matched)
                          setMarketSearchQuery2('')
                          setIsSearchDropdownOpen2(false)
                        }
                      }}
                      className="bg-transparent border-none outline-none text-[10px] text-white w-20 focus:w-28 transition-all duration-200 placeholder:text-slate-600 font-bold"
                    />
                    {marketSearchQuery2 ? (
                      <button
                        onClick={() => {
                          const q = marketSearchQuery2.trim().toUpperCase()
                          const allAvailableMarkets = ['NIFTY 50', 'SENSEX', 'RELIANCE', 'TCS', 'RPOWER', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'AAPL', 'MSFT', 'TSLA', 'NVDA', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'TATAMOTORS', 'WIPRO']
                          const matched = allAvailableMarkets.find(m => m.toUpperCase() === q || m.toUpperCase().includes(q)) || q
                          if (!visibleMarkets.includes(matched)) {
                            setVisibleMarkets(prev => [...prev, matched])
                          }
                          setSelectedSymbol(matched)
                          setMarketSearchQuery2('')
                          setIsSearchDropdownOpen2(false)
                        }}
                        className="bg-cyan-500 hover:bg-cyan-400 text-black text-[9px] font-bold px-1.5 py-0.5 rounded ml-1 cursor-pointer"
                        title="Add symbol"
                      >
                        + ADD
                      </button>
                    ) : null}
                  </div>
                  
                  {isSearchDropdownOpen2 && (
                    <div className="absolute left-0 top-full mt-1.5 w-44 bg-[#0A0F1D] border border-[#1E2D4A] rounded-lg shadow-2xl z-[100] max-h-48 overflow-y-auto py-1">
                      {(() => {
                        const allAvailableMarkets = ['NIFTY 50', 'SENSEX', 'RELIANCE', 'TCS', 'RPOWER', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'AAPL', 'MSFT', 'TSLA', 'NVDA', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'TATAMOTORS', 'WIPRO']
                        const filtered = allAvailableMarkets.filter(
                          (m) =>
                            !visibleMarkets.includes(m) &&
                            m.toLowerCase().includes(marketSearchQuery2.toLowerCase())
                        )
                        if (filtered.length === 0) {
                          if (marketSearchQuery2.trim()) {
                            const customSym = marketSearchQuery2.trim().toUpperCase()
                            return (
                              <button
                                onClick={() => {
                                  if (!visibleMarkets.includes(customSym)) {
                                    setVisibleMarkets(prev => [...prev, customSym])
                                  }
                                  setSelectedSymbol(customSym)
                                  setMarketSearchQuery2('')
                                  setIsSearchDropdownOpen2(false)
                                }}
                                className="w-full text-left px-3 py-1.5 text-[10px] text-cyan-400 hover:bg-cyan-500/10 transition-colors font-bold cursor-pointer"
                              >
                                + Add "{customSym}"
                              </button>
                            )
                          }
                          return (
                            <div className="px-3 py-1.5 text-[9px] text-slate-500 font-bold">
                              All markets added
                            </div>
                          )
                        }
                        return filtered.map((m) => (
                          <button
                            key={m}
                            onClick={() => {
                              setVisibleMarkets((prev) => [...prev, m])
                              setSelectedSymbol(m)
                              setMarketSearchQuery2('')
                              setIsSearchDropdownOpen2(false)
                            }}
                            className="w-full text-left px-3 py-1.5 text-[10px] text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors font-bold cursor-pointer"
                          >
                            + {m}
                          </button>
                        ))
                      })()}
                    </div>
                  )}
                </div>
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
                          onClick={() => handleTimeframeChange(tf)}
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
                    <p className={`text-xs md:text-sm font-bold font-mono-data mt-0.5 ${
                      liveConsensus === 'BUY' ? 'text-[#00E676]' : (liveConsensus === 'SELL' ? 'text-[#FF3D57]' : 'text-amber-500')
                    }`}>{liveConsensus === 'BUY' ? 'BUY / LONG' : (liveConsensus === 'SELL' ? 'SELL / SHORT' : 'HOLD')}</p>
                  </div>
                  <div className="text-center border-x border-[#1E2D4A] px-1">
                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold">Confidence</p>
                    <p className="text-xs md:text-sm font-bold text-white font-mono-data mt-0.5">{liveConfidence.toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold">Agreement</p>
                    <p className="text-xs md:text-sm font-bold text-cyan-400 font-mono-data mt-0.5">{liveAgreeCount} / {liveTotalAlgos} Algos</p>
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

                {/* Open Positions Card (Show in both Demo and Real modes) */}
                {true && (
                  <div className="premium-card rounded-xl p-6 mb-6 border border-cyan-500/20 bg-[#080C18]/60 shadow-[0_0_15px_rgba(0,180,255,0.05)]">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#1E2D4A]/50">
                      <div className="flex items-center space-x-2">
                        <span className="material-symbols-outlined text-[#00E676] animate-pulse">radar</span>
                        <h3 className="text-sm font-headline font-bold text-white uppercase tracking-wider">Active Open Positions</h3>
                      </div>
                      <div className="flex items-center space-x-3">
                        {Object.keys(activePositions).length > 0 && (
                          <button
                            onClick={handleForceClearPositions}
                            className="px-2 py-0.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 text-[10px] font-bold rounded cursor-pointer transition-colors flex items-center space-x-1"
                            title="Force clear bot positions if manually exited on broker"
                          >
                            <span className="material-symbols-outlined text-xs">close</span>
                            <span>Force Clear Bot</span>
                          </button>
                        )}
                        <span className="px-2 py-0.5 bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] rounded text-[10px] font-bold">
                          {Object.keys(activePositions).length} RUNNING
                        </span>
                      </div>
                    </div>

                    {Object.keys(activePositions).length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-xs text-slate-500 font-medium">No active real positions on your broker.</p>
                        <p className="text-[10px] text-slate-600 mt-1">Auto-trade bot is online and scanning markets for directives.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#1E2D4A] text-slate-500 text-[9px] uppercase font-bold tracking-wider">
                              <th className="pb-2">Market</th>
                              <th className="pb-2">Type</th>
                              <th className="pb-2">Size / Investment</th>
                              <th className="pb-2">Entry Price</th>
                              <th className="pb-2">Current Price</th>
                              <th className="pb-2">Target (Exit SL)</th>
                              <th className="pb-2 text-right">Est. Win / Loss</th>
                              <th className="pb-2 text-right">Unrealized P&L</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1E2D4A]/40 text-xs font-mono-data">
                            {Object.entries(activePositions).map(([sym, pos]) => {
                              // Find matching tick price from chartData
                              const lastCandle = chartData && chartData.length > 0 ? chartData[chartData.length - 1] : null;
                              const currentPrice = sym === selectedSymbol && lastCandle ? lastCandle.close : pos.entry_price;
                              
                              const direction = pos.direction === 'SHORT' ? 'SHORT' : 'LONG';
                              const diffPct = ((currentPrice - pos.entry_price) / pos.entry_price) * 100;
                              const rawLeveragedPnlPct = diffPct * 10; // 10X Leverage
                              const leveragedPnlPct = direction === 'SHORT' ? -rawLeveragedPnlPct : rawLeveragedPnlPct;
                              const pnlAmount = (pos.qty * pos.entry_price) * (leveragedPnlPct / 100);
                              const isProfit = leveragedPnlPct >= 0;

                              // Calculate Target and Stop Loss values
                              const slLimit = stopLossLimit || 2.0;
                              const target_str = profitTarget || '1.5X';
                              const mult = target_str === '1.2X' ? 1.2 : (target_str === '2.0X' ? 2.0 : 1.5);
                              const targetPct = slLimit * mult;
                              
                              const targetPrice = pos.target_price || (direction === 'SHORT'
                                ? pos.entry_price * (1 - targetPct / 100)
                                : pos.entry_price * (1 + targetPct / 100));
                              const stopLossPrice = pos.stop_loss_price || (direction === 'SHORT'
                                ? pos.entry_price * (1 + slLimit / 100)
                                : pos.entry_price * (1 - slLimit / 100));
                              
                              const possibleWin = Math.abs(targetPrice - pos.entry_price) * pos.qty;
                              const possibleLoss = Math.abs(stopLossPrice - pos.entry_price) * pos.qty;
                              const currencySym = getCurrencySymbol(sym);

                              return (
                                <tr key={sym} className="text-white hover:bg-slate-500/5">
                                  <td className="py-2.5 font-sans font-bold text-cyan-400">{sym}</td>
                                  <td className="py-2.5">
                                    <span className={`px-1.5 py-0.5 border rounded text-[9px] font-bold ${
                                      direction === 'SHORT'
                                        ? 'bg-[#FF3D57]/10 border-[#FF3D57]/20 text-[#FF3D57]'
                                        : 'bg-[#00E676]/10 border-[#00E676]/20 text-[#00E676]'
                                    }`}>
                                      {direction === 'SHORT' ? 'SELL / SHORT' : 'BUY / LONG'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 text-slate-300">
                                    {(() => {
                                      const isCrypto = sym.includes('BTC') || sym.includes('ETH') || sym.includes('SOL') || sym.includes('ADA');
                                      const marginBlocked = (pos.qty * pos.entry_price) / leverage;
                                      const totalValue = pos.qty * pos.entry_price;
                                      return (
                                        <>
                                          <div className="font-bold">{pos.qty} {isCrypto ? 'Units' : 'Shares'}</div>
                                          <div className="text-[10px] text-slate-400 font-sans" title="Blocked margin (actual investment)">Margin: {currencySym}{marginBlocked.toFixed(2)}</div>
                                          <div className="text-[8px] text-slate-500 font-sans" title="Total position size">Total: {currencySym}{totalValue.toFixed(2)}</div>
                                        </>
                                      );
                                    })()}
                                  </td>
                                  <td className="py-2.5 text-slate-300">{currencySym}{pos.entry_price.toFixed(2)}</td>
                                  <td className="py-2.5 text-slate-300">{currencySym}{currentPrice.toFixed(2)}</td>
                                  <td className="py-2.5 text-slate-300">
                                    <div className="text-[11px] text-[#00E676] font-bold">🎯 {currencySym}{targetPrice.toFixed(2)}</div>
                                    <div className="text-[9px] text-[#FF3D57]">🛡️ {currencySym}{stopLossPrice.toFixed(2)}</div>
                                  </td>
                                  <td className="py-2.5 text-right font-semibold">
                                    <div className="text-[11px] text-[#00E676] font-bold">+{currencySym}{possibleWin.toFixed(2)}</div>
                                    <div className="text-[9px] text-[#FF3D57]">-{currencySym}{possibleLoss.toFixed(2)}</div>
                                  </td>
                                  <td className={`py-2.5 text-right font-bold ${isProfit ? 'text-[#00E676]' : 'text-red-500'}`}>
                                    {isProfit ? '+' : ''}{currencySym}{pnlAmount.toFixed(2)} ({isProfit ? '+' : ''}{leveragedPnlPct.toFixed(2)}%)
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl border border-[#1E2D4A] bg-[#080C18]/60 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Realized Net P&L Amount</p>
                      <p className={`text-xl font-mono-data font-bold mt-1 ${totalLedgerPnl >= 0 ? 'text-[#00E676]' : 'text-red-500'}`}>
                        {totalLedgerPnl >= 0 ? '+' : '-'}{getPortfolioCurrencySymbol()}{Math.abs(totalLedgerPnl).toFixed(2)}
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
                        {getPortfolioCurrencySymbol()}{totalLedgerVolume.toLocaleString(getPortfolioCurrencySymbol() === '$' ? 'en-US' : 'en-IN', { minimumFractionDigits: 2 })}
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
                    {/* Buy vs Sell Sub-Tabs Toggle */}
                    <div className="flex border-b border-[#1E2D4A]/60 mb-6 space-x-6">
                      <button
                        onClick={() => setHistorySubTab('buy')}
                        className={`pb-3 text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          historySubTab === 'buy'
                            ? 'text-cyan-400 border-b-2 border-cyan-400'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        📥 Buy Orders (Entries)
                      </button>
                      <button
                        onClick={() => setHistorySubTab('sell')}
                        className={`pb-3 text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          historySubTab === 'sell'
                            ? 'text-cyan-400 border-b-2 border-cyan-400'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        📤 Sell Orders (Exits)
                      </button>
                    </div>

                    {(() => {
                      const activeTradesList = historySubTab === 'buy'
                        ? tradeHistory.filter(t => t.action === 'BUY')
                        : tradeHistory.filter(t => t.action === 'SELL' || !t.action);

                      if (activeTradesList.length === 0) {
                        return (
                          <div className="text-center py-12 border border-dashed border-[#1E2D4A]/60 rounded-xl my-4">
                            <span className="material-symbols-outlined text-slate-600 text-3xl mb-2">info</span>
                            <p className="text-xs font-bold text-slate-400">
                              {historySubTab === 'buy' ? 'No active buy orders recorded yet.' : 'No closed sell orders recorded yet.'}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <>
                          {/* Desktop View: Table Layout */}
                          <div className="hidden md:block overflow-x-auto w-full max-w-full pb-4">
                            {historySubTab === 'buy' ? (
                              <table className="w-full text-left border-collapse min-w-[750px]">
                                <thead>
                                  <tr className="border-b border-[#1E2D4A] text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                    <th className="py-4 px-6">Timestamp</th>
                                    <th className="py-4 px-6">Asset Pair</th>
                                    <th className="py-4 px-6">Position</th>
                                    <th className="py-4 px-6">Investment</th>
                                    <th className="py-4 px-6">Leverage</th>
                                    <th className="py-4 px-6">Buy Price</th>
                                    <th className="py-4 px-6">Sell Target Price</th>
                                    <th className="py-4 px-6">Sell Target Profit</th>
                                    <th className="py-4 px-6">Highest/Lowest Price</th>
                                    <th className="py-4 px-6">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1E2D4A]/50 text-xs">
                                  {activeTradesList.map((trade) => (
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
                                      <td className="py-4 px-6 font-mono-data text-cyan-400 font-bold">{trade.investment}</td>
                                      <td className="py-4 px-6 font-mono-data text-slate-400">{trade.leverage}</td>
                                      <td className="py-4 px-6 font-mono-data text-slate-300">
                                        {trade.entryPrice ? `${getCurrencySymbol(trade.pair)}${trade.entryPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '—'}
                                      </td>
                                      <td className="py-4 px-6 font-mono-data text-yellow-400 font-bold">
                                        {trade.targetPrice ? `${getCurrencySymbol(trade.pair)}${trade.targetPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '—'}
                                      </td>
                                      <td className="py-4 px-6 font-mono-data text-[#00E676] font-bold">
                                        {(() => {
                                          if (!trade.entryPrice || !trade.targetPrice) return '—'
                                          const isShort = trade.type === 'SHORT'
                                          const rawDiff = isShort 
                                            ? (trade.entryPrice - trade.targetPrice) / trade.entryPrice 
                                            : (trade.targetPrice - trade.entryPrice) / trade.entryPrice
                                          const pnlPct = rawDiff * 10 * 100 // 10X leverage
                                          const investNum = parseFloat(trade.investment.replace(/[^0-9.]/g, '')) || 0
                                          const profitAmt = investNum * (pnlPct / 100)
                                          return `+${getCurrencySymbol(trade.pair)}${profitAmt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (+${pnlPct.toFixed(2)}%)`
                                        })()}
                                      </td>
                                      <td className="py-4 px-6 font-mono-data text-emerald-400 font-bold">
                                        <div className="flex flex-col">
                                          <span>{trade.highestPrice ? `${getCurrencySymbol(trade.pair)}${trade.highestPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '—'}</span>
                                          {trade.highestPrice && (
                                            <span className="text-[9px] text-slate-500 font-normal uppercase tracking-wider mt-0.5">
                                              {trade.type === 'LONG' ? 'Highest' : 'Lowest'}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-4 px-6">
                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30 animate-pulse">
                                          {trade.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <table className="w-full text-left border-collapse min-w-[750px]">
                                <thead>
                                  <tr className="border-b border-[#1E2D4A] text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                    <th className="py-4 px-6">Timestamp</th>
                                    <th className="py-4 px-6">Asset Pair</th>
                                    <th className="py-4 px-6">Position</th>
                                    <th className="py-4 px-6">Investment</th>
                                    <th className="py-4 px-6">Leverage</th>
                                    <th className="py-4 px-6">Buy Price</th>
                                    <th className="py-4 px-6">Highest/Lowest Price</th>
                                    <th className="py-4 px-6">Sell Price</th>
                                    <th className="py-4 px-6">Net Profit</th>
                                    <th className="py-4 px-6">Return</th>
                                    <th className="py-4 px-6">Trigger Reason</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1E2D4A]/50 text-xs">
                                  {activeTradesList.map((trade) => (
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
                                      <td className="py-4 px-6 font-mono-data text-cyan-400 font-bold">{trade.investment}</td>
                                      <td className="py-4 px-6 font-mono-data text-slate-400">{trade.leverage}</td>
                                      <td className="py-4 px-6 font-mono-data text-slate-300">
                                        {trade.entryPrice ? `${getCurrencySymbol(trade.pair)}${trade.entryPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '—'}
                                      </td>
                                      <td className="py-4 px-6 font-mono-data text-emerald-400 font-bold">
                                        <div className="flex flex-col">
                                          <span>{trade.highestPrice ? `${getCurrencySymbol(trade.pair)}${trade.highestPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '—'}</span>
                                          {trade.highestPrice && (
                                            <span className="text-[9px] text-slate-500 font-normal uppercase tracking-wider mt-0.5">
                                              {trade.type === 'LONG' ? 'Highest' : 'Lowest'}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-4 px-6 font-mono-data text-slate-300">
                                        {trade.exitPrice ? `${getCurrencySymbol(trade.pair)}${trade.exitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '—'}
                                      </td>
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
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>

                          {/* Mobile View: Clean Card List Layout */}
                          <div className="block md:hidden space-y-3 pb-4">
                            {activeTradesList.map((trade) => (
                              <div key={trade.id} className="bg-[#111827] p-4 rounded-xl border border-[#1E2D4A] space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-slate-500 font-mono-data">{trade.date}</span>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    trade.type === 'LONG' ? 'bg-[#00E676]/10 text-[#00E676]' : 'bg-red-500/10 text-red-500'
                                  }`}>
                                    {trade.type} {trade.leverage || '10X'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-white font-bold text-xs">{trade.pair}</span>
                                  {historySubTab === 'buy' ? (
                                    <div className="flex flex-col items-end space-y-0.5">
                                      <span className="text-xs font-mono-data text-slate-300">
                                        Buy Price: {trade.entryPrice ? `${getCurrencySymbol(trade.pair)}${trade.entryPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '—'}
                                      </span>
                                      {trade.targetPrice && (
                                        <span className="text-[10px] font-mono-data text-yellow-400 font-bold">
                                          Target: {getCurrencySymbol(trade.pair)}{trade.targetPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                        </span>
                                      )}
                                      {trade.entryPrice && trade.targetPrice && (
                                        <span className="text-[10px] font-mono-data text-[#00E676] font-bold">
                                          Target Profit: {(() => {
                                            const isShort = trade.type === 'SHORT'
                                            const rawDiff = isShort 
                                              ? (trade.entryPrice - trade.targetPrice) / trade.entryPrice 
                                              : (trade.targetPrice - trade.entryPrice) / trade.entryPrice
                                            const pnlPct = rawDiff * 10 * 100
                                            const investNum = parseFloat(trade.investment.replace(/[^0-9.]/g, '')) || 0
                                            const profitAmt = investNum * (pnlPct / 100)
                                            return `+${getCurrencySymbol(trade.pair)}${profitAmt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (+${pnlPct.toFixed(1)}%)`
                                          })()}
                                        </span>
                                      )}
                                      {trade.highestPrice && (
                                        <span className="text-[10px] font-mono-data text-emerald-400">
                                          {trade.type === 'LONG' ? 'Highest' : 'Lowest'}: {getCurrencySymbol(trade.pair)}{trade.highestPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className={`text-xs font-mono-data font-bold ${trade.profit.startsWith('+') ? 'text-[#00E676]' : 'text-red-500'}`}>
                                      {trade.profit} ({trade.returnPct})
                                    </span>
                                  )}
                                </div>
                                {historySubTab === 'sell' && trade.entryPrice && trade.exitPrice && (
                                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 flex-wrap gap-2">
                                    <span>Buy Price: <span className="font-mono-data text-slate-300">{getCurrencySymbol(trade.pair)}{trade.entryPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
                                    {trade.highestPrice && (
                                      <span>Highest: <span className="font-mono-data text-emerald-400">{getCurrencySymbol(trade.pair)}{trade.highestPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
                                    )}
                                    <span>Sell Price: <span className="font-mono-data text-slate-300">{getCurrencySymbol(trade.pair)}{trade.exitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
                                  </div>
                                )}
                                <div className="flex justify-between items-center text-[10px] pt-2 border-t border-[#1E2D4A]/50">
                                  <span className="text-slate-500">Capital: <span className="text-cyan-400 font-mono-data font-bold">{trade.investment}</span></span>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    historySubTab === 'buy'
                                      ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30'
                                      : trade.status === 'TARGET HIT' 
                                      ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' 
                                      : trade.status === 'STOP LOSS'
                                      ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                  }`}>
                                    {trade.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      );
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
                  {/* Active Ticker Directive */}
                  <div className={`p-4 rounded-xl border flex items-start justify-between ${
                    liveConsensus === 'BUY' 
                      ? 'border-[#00E676]/30 bg-[#00E676]/5 text-[#00E676]' 
                      : (liveConsensus === 'SELL' ? 'border-red-500/30 bg-red-950/5 text-red-500' : 'border-amber-500/30 bg-amber-500/5 text-amber-500')
                  }`}>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`h-2 w-2 rounded-full animate-ping ${
                          liveConsensus === 'BUY' ? 'bg-[#00E676]' : (liveConsensus === 'SELL' ? 'bg-red-500' : 'bg-amber-500')
                        }`}></span>
                        <p className="text-sm font-bold text-white">{selectedSymbol} {liveConsensus} Directive</p>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        LSTM, XGBoost, and Transformer consensus hit {liveConfidence.toFixed(1)}% limit. Volatility parameter ATR is optimal at {liveIndicators.ATR}.
                      </p>
                      <span className="inline-block text-[9px] font-mono-data text-slate-500 mt-3">TRIGGERED AT: {new Date().toLocaleTimeString()}</span>
                    </div>
                    <span className={`text-xs font-mono-data font-bold uppercase`}>
                      {liveConsensus === 'BUY' ? '🟢 BUY DIRECTIVE' : (liveConsensus === 'SELL' ? '🔴 SELL DIRECTIVE' : '🟡 NEUTRAL HOLD')}
                    </span>
                  </div>

                  {/* Secondary/Static directive for context */}
                  <div className="p-4 rounded-xl border border-[#1E2D4A] bg-[#0F1629] flex items-start justify-between opacity-70">
                    <div>
                      <p className="text-sm font-bold text-slate-300">Market Macro Indicators</p>
                      <p className="text-xs text-slate-400 mt-2">
                        Sentiment Analyzer indexes local news parameters. Volume averages are currently at stable levels relative to the 20-period moving average.
                      </p>
                      <span className="inline-block text-[9px] font-mono-data text-slate-500 mt-3">SYSTEM REPORTING STATUS: ACTIVE</span>
                    </div>
                    <span className="text-xs font-mono-data text-cyan-400 font-bold uppercase">Consensus Synced</span>
                  </div>

                  {/* Risk metric alert */}
                  <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/5 flex items-start justify-between opacity-80">
                    <div>
                      <p className="text-sm font-bold text-slate-300">Intraday Statistical Prediction</p>
                      <p className="text-xs text-slate-400 mt-2">
                        Monte Carlo simulation projects a {liveConfidence.toFixed(1)}% probability of support levels holding at current pricing bounds.
                      </p>
                      <span className="inline-block text-[9px] font-mono-data text-slate-500 mt-3">EVALUATION METRIC: 9/9 SUITE</span>
                    </div>
                    <span className="text-xs font-mono-data text-cyan-400 font-bold">MONTE CARLO PASSED</span>
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
                      <span className="text-white font-mono-data">{liveAgreeCount} / {liveTotalAlgos} Algos</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-[#1E2D4A] pb-2">
                      <span className="text-slate-400">Current Confidence</span>
                      <span className="text-white font-mono-data">{liveConfidence.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-[#1E2D4A] pb-2">
                      <span className="text-slate-400">ATR Volatility</span>
                      <span className="text-white font-mono-data">{liveIndicators.ATR}</span>
                    </div>
                    <div className="flex justify-between text-xs pb-2">
                      <span className="text-slate-400">Stop Loss Target</span>
                      <span className="text-red-400 font-mono-data">{stopLossLimit.toFixed(1)}%</span>
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

          {/* TAB 5: AI BRAIN INTELLIGENCE */}
          {currentTab === 'aibrain' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Column - Navigation and Summary stats */}
              <div className="lg:col-span-1 space-y-6">
                <div className="premium-card rounded-xl p-5 border border-[#1E2D4A] bg-[#0A0F1D]/80 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">AI Sub-Terminal</h3>
                  <div className="space-y-2">
                    {[
                      { id: 'advisor', name: 'Live AI Advisor', icon: 'support_agent' },
                      { id: 'youtube', name: 'YouTube AI Learning', icon: 'smart_display' },
                      { id: 'knowledge', name: 'Strategy Knowledge', icon: 'menu_book' },
                      { id: 'log', name: 'Consultation Log', icon: 'receipt_long' },
                      { id: 'config', name: 'AI API Parameters', icon: 'tune' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setAiActiveSection(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer text-left ${
                          aiActiveSection === tab.id
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-[#162035]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                        <span className="text-xs font-semibold">{tab.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Stats Card */}
                <div className="premium-card rounded-xl p-5 border border-[#1E2D4A] bg-[#0A0F1D]/80">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">AI Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">OpenRouter Status</span>
                      <span className={`text-xs font-bold ${aiStatus.claude_connected ? 'text-green-400 animate-pulse' : 'text-purple-400'}`}>
                        {aiStatus.claude_api_status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">YouTube Status</span>
                      <span className={`text-xs font-bold ${aiStatus.youtube_connected ? 'text-green-400 animate-pulse' : 'text-purple-400'}`}>
                        {aiStatus.youtube_api_status}
                      </span>
                    </div>
                    <div className="border-t border-[#1E2D4A] my-2 pt-2"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Today's Token Spend</span>
                      <span className="text-xs font-bold text-cyan-400 font-mono-data">
                        ${aiStatus.today_cost_usd?.toFixed(4)} / ${aiStatus.budget_limit_usd?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Learned Concepts</span>
                      <span className="text-xs font-bold text-white font-mono-data">{aiStatus.strategies_count}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Total Consultations</span>
                      <span className="text-xs font-bold text-white font-mono-data">{aiStatus.consultations_count}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Main Active View */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* 1. LIVE AI ADVISOR */}
                {aiActiveSection === 'advisor' && (
                  <div className="premium-card rounded-xl p-6 border border-[#1E2D4A] bg-[#0A0F1D]/80">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-purple-400">psychology</span>
                          AI Advisor Consultant (OpenRouter)
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">Real-time trade auditing and technical market advisory feed for {selectedSymbol}.</p>
                      </div>
                      <button
                        onClick={handleAiConsult}
                        disabled={aiConsulting}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center space-x-2"
                      >
                        <span className="material-symbols-outlined text-sm">rotate_right</span>
                        <span>{aiConsulting ? 'Consulting...' : 'Request Advice Now'}</span>
                      </button>
                    </div>

                    {aiConsulting && (
                      <div className="py-16 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
                        <p className="text-xs text-slate-400 animate-pulse">AI is parsing indicators, ticker history and global finance feeds...</p>
                      </div>
                    )}

                    {!aiConsulting && aiConsultResult && (
                      <div className="space-y-6">
                        <div className="p-4 rounded-xl border flex items-start justify-between border-purple-500/30 bg-purple-950/10 text-purple-400">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="h-2 w-2 rounded-full bg-purple-400 animate-ping"></span>
                              <p className="text-sm font-bold text-white">Advisory Recommendation: {aiConsultResult.recommendation}</p>
                            </div>
                            <div className="mt-4 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {aiConsultResult.response}
                            </div>
                            {aiConsultResult.simulated && (
                              <span className="inline-block text-[9px] font-mono-data text-slate-500 mt-4 uppercase tracking-wider">
                                ℹ️ SIMULATED RESPONSE (No OpenRouter Key configured)
                              </span>
                            )}
                          </div>
                        </div>

                        {aiConsultResult.news && aiConsultResult.news.length > 0 && (
                          <div className="mt-6 border-t border-[#1E2D4A] pt-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                              <span className="material-symbols-outlined text-xs">newspaper</span>
                              Global Market News Context
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {aiConsultResult.news.map((item, idx) => (
                                <a
                                  key={idx}
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-3 bg-[#131B2E]/60 border border-[#1E2D4A] rounded-xl hover:border-cyan-400/40 transition-colors flex flex-col justify-between"
                                >
                                  <div>
                                    <h4 className="text-xs font-bold text-white line-clamp-2">{item.title}</h4>
                                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{item.summary}</p>
                                  </div>
                                  <div className="flex justify-between items-center mt-3 text-[9px] text-slate-500">
                                    <span>{item.source}</span>
                                    <span>{item.published ? new Date(item.published).toLocaleDateString() : ''}</span>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {!aiConsulting && !aiConsultResult && (
                      <div className="py-12 text-center border-2 border-dashed border-[#1E2D4A] rounded-xl">
                        <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">insights</span>
                        <p className="text-xs font-bold text-slate-400">No active consultation report loaded.</p>
                        <p className="text-[10px] text-slate-500 mt-1">Click the button above to request a real-time AI Advisor audit.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. YOUTUBE AI LEARNING */}
                {aiActiveSection === 'youtube' && (
                  <div className="premium-card rounded-xl p-6 border border-[#1E2D4A] bg-[#0A0F1D]/80">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#FF0000]">smart_display</span>
                          YouTube AI Strategy Learner
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">Discover expert strategy videos. The AI Advisor will extract and structure exact indicators, triggers, and SL/TP rules.</p>
                      </div>
                    </div>

                    <div className="flex space-x-3 mb-6">
                      <input
                        type="text"
                        value={ytSearchQuery}
                        onChange={(e) => setYtSearchQuery(e.target.value)}
                        placeholder="e.g. scalping strategy, vwap breakout, rsi trading"
                        className="flex-1 bg-[#090D1A] border border-[#1E2D4A] rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors"
                      />
                      <button
                        onClick={searchYouTube}
                        disabled={ytLoading}
                        className="px-5 py-2 bg-[#1E2D4A] hover:bg-[#2C3F66] text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center space-x-2"
                      >
                        <span className="material-symbols-outlined text-sm">search</span>
                        <span>{ytLoading ? 'Searching...' : 'Search'}</span>
                      </button>
                    </div>

                    {ytLoading && (
                      <div className="py-12 flex justify-center">
                        <div className="w-10 h-10 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
                      </div>
                    )}

                    {!ytLoading && ytVideos.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ytVideos.map((video) => (
                          <div key={video.video_id} className="bg-[#131B2E]/60 border border-[#1E2D4A] rounded-xl overflow-hidden flex flex-col justify-between hover:border-purple-500/30 transition-colors">
                            <div className="relative aspect-video bg-[#090D1A] flex items-center justify-center overflow-hidden">
                              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-80" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-slate-400 font-bold">{video.view_count}</span>
                              <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-600 rounded text-[9px] text-white font-bold">YouTube</span>
                            </div>
                            <div className="p-4 flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">{video.title}</h4>
                                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{video.description}</p>
                                <div className="flex items-center space-x-2 mt-2 text-[9px] text-slate-500">
                                  <span className="font-bold text-cyan-400">{video.channel}</span>
                                  <span>•</span>
                                  <span>{new Date(video.published_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => learnFromVideo(video)}
                                disabled={ytLearningId === video.video_id}
                                className="w-full mt-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-white font-bold text-xs rounded-xl border border-purple-500/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
                              >
                                <span className="material-symbols-outlined text-sm">{ytLearningId === video.video_id ? 'hourglass_top' : 'psychology'}</span>
                                <span>{ytLearningId === video.video_id ? 'Extracting...' : 'AI Extract Strategy'}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!ytLoading && ytVideos.length === 0 && (
                      <div className="py-12 text-center border-2 border-dashed border-[#1E2D4A] rounded-xl">
                        <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">smart_display</span>
                        <p className="text-xs font-bold text-slate-400">No strategy videos loaded.</p>
                        <p className="text-[10px] text-slate-500 mt-1">Enter a strategy keyword and search.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. STRATEGY KNOWLEDGE BASE */}
                {aiActiveSection === 'knowledge' && (
                  <div className="premium-card rounded-xl p-6 border border-[#1E2D4A] bg-[#0A0F1D]/80">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-cyan-400">menu_book</span>
                          Extracted Strategy Library
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">Structured trading systems learned from YouTube and stored inside the SQLite knowledge base.</p>
                      </div>
                    </div>

                    {knowledgeBase.length > 0 ? (
                      <div className="space-y-6">
                        {knowledgeBase.map((strategy) => (
                          <div key={strategy.id} className="p-5 border border-[#1E2D4A] rounded-xl bg-[#131B2E]/60 hover:border-cyan-400/30 transition-all">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] uppercase font-bold rounded-lg">
                                  {strategy.strategy_type}
                                </span>
                                <h3 className="text-sm font-bold text-white mt-2">{strategy.title}</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">Source Channel: {strategy.channel} • Extracted at {new Date(strategy.date).toLocaleDateString()}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className="text-xs font-bold text-green-400 font-mono-data">AI Confidence: {strategy.confidence}%</span>
                                <button
                                  onClick={() => handleRunBacktest(strategy.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 rounded-lg text-[10px] font-bold transition-all"
                                >
                                  <span className="material-symbols-outlined text-[12px]">analytics</span>
                                  Run Backtest
                                </button>
                              </div>
                            </div>

                            <div className="mt-4 border-t border-[#1E2D4A] pt-4">
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Derived Trading Rules:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(() => {
                                  const rules = strategy.rules;
                                  
                                  // 1. If rules is a non-empty array
                                  if (Array.isArray(rules) && rules.length > 0) {
                                    return rules.map((rule, rIdx) => (
                                      <div key={rIdx} className="p-3 bg-[#090D1A] rounded-lg border border-[#1E2D4A]/50">
                                        <span className="text-[9px] text-cyan-400 font-bold uppercase">{rule.rule || 'Rule'}</span>
                                        <p className="text-[11px] text-slate-300 mt-1 leading-normal">{rule.detail}</p>
                                      </div>
                                    ));
                                  }
                                  
                                  // 2. If rules is an object and has keys
                                  if (typeof rules === 'object' && rules !== null && Object.keys(rules).length > 0) {
                                    // Check if all values in the object are empty arrays/strings (like the empty structure)
                                    const isEmptyObj = Object.values(rules).every(v => 
                                      v === null || v === '' || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && Object.keys(v).length === 0)
                                    );
                                    
                                    if (!isEmptyObj) {
                                      return Object.entries(rules).map(([key, val], rIdx) => {
                                        let displayVal = '';
                                        if (Array.isArray(val)) {
                                          displayVal = val.length > 0 ? val.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ') : 'None extracted';
                                        } else if (typeof val === 'object' && val !== null) {
                                          displayVal = JSON.stringify(val);
                                        } else {
                                          displayVal = String(val);
                                        }
                                        return (
                                          <div key={rIdx} className="p-3 bg-[#090D1A] rounded-lg border border-[#1E2D4A]/50">
                                            <span className="text-[9px] text-cyan-400 font-bold uppercase">{key.replace(/_/g, ' ')}</span>
                                            <p className="text-[11px] text-slate-300 mt-1 leading-normal">{displayVal}</p>
                                          </div>
                                        );
                                      });
                                    }
                                  }
                                  
                                  // 3. Fallback for empty array/object or string
                                  return (
                                    <div className="col-span-full p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start space-x-3 text-left">
                                      <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5">warning</span>
                                      <div>
                                        <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">No Mechanical Rules Extracted</h5>
                                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                                          This video overview did not contain enough detailed mechanical triggers (e.g. entry, exit, stop loss) or is a short clip. Try searching for a different comprehensive trading strategy video tutorial.
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })()}


                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center border-2 border-dashed border-[#1E2D4A] rounded-xl">
                        <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">menu_book</span>
                        <p className="text-xs font-bold text-slate-400">Library is empty.</p>
                        <p className="text-[10px] text-slate-500 mt-1">Go to the YouTube AI Learning tab to extract strategy logic.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. AI CONSULTATION LOG */}
                {aiActiveSection === 'log' && (
                  <div className="premium-card rounded-xl p-6 border border-[#1E2D4A] bg-[#0A0F1D]/80">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-purple-400">receipt_long</span>
                          AI Advisory Logs
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">History of all auto-consultations and manual audits conducted by AI Advisor.</p>
                      </div>
                    </div>

                    {consultationsLog.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-[#131B2E] text-slate-400 font-bold uppercase text-[9px] border-b border-[#1E2D4A]">
                            <tr>
                              <th className="p-3">Timestamp</th>
                              <th className="p-3">Symbol</th>
                              <th className="p-3">Type</th>
                              <th className="p-3">Recommendation</th>
                              <th className="p-3">Advisory Snippet</th>
                              <th className="p-3">Cost</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1E2D4A]">
                            {consultationsLog.map((log) => (
                              <tr 
                                key={log.id} 
                                onClick={() => setSelectedConsultation(log)}
                                className="hover:bg-[#131B2E]/60 transition-colors cursor-pointer"
                              >
                                <td className="p-3 font-mono-data text-[10px] text-slate-400">
                                  {new Date(log.date).toLocaleString()}
                                </td>
                                <td className="p-3 font-bold text-white">{log.symbol}</td>
                                <td className="p-3 uppercase">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                    log.issue_type === 'anomaly' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                  }`}>
                                    {log.issue_type}
                                  </span>
                                </td>
                                <td className="p-3 font-bold">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                    log.recommendation === 'BUY' ? 'text-green-400 bg-green-500/10' : (log.recommendation === 'SELL' ? 'text-red-400 bg-red-500/10' : 'text-amber-500 bg-amber-500/10')
                                  }`}>
                                    {log.recommendation}
                                  </span>
                                </td>
                                <td className="p-3 truncate max-w-[200px] text-slate-400">{log.response}</td>
                                <td className="p-3 font-mono-data text-[10px] text-cyan-400">
                                  {log.cost > 0 ? `$${log.cost.toFixed(4)}` : '$0.00'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-12 text-center border-2 border-dashed border-[#1E2D4A] rounded-xl">
                        <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">receipt_long</span>
                        <p className="text-xs font-bold text-slate-400">Log is empty.</p>
                        <p className="text-[10px] text-slate-500 mt-1">No AI consultation history matches this account yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. API KEYS CONFIG */}
                {aiActiveSection === 'config' && (
                  <div className="premium-card rounded-xl p-6 border border-[#1E2D4A] bg-[#0A0F1D]/80">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-cyan-400">tune</span>
                          AI API Key Configurator
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">Provide your credentials to activate real-time OpenRouter and YouTube connections.</p>
                      </div>
                    </div>

                    <div className="space-y-4 max-w-xl">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase">OpenRouter API Key</label>
                        <input
                          type="password"
                          value={claudeApiKey}
                          onChange={(e) => setClaudeApiKey(e.target.value)}
                          placeholder={claudeApiKey ? '••••••••••••••••••••••••••••••••' : 'sk-or-ap-...'}
                          className="w-full mt-1.5 bg-[#090D1A] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400 transition-colors"
                        />
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                          Stored securely on your server. Leave blank to run in mock simulation mode.
                        </p>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase">OpenRouter Model</label>
                        <select
                          value={
                            ['google/gemini-2.5-flash:free', 'meta-llama/llama-3.1-8b-instruct:free', 'mistralai/mistral-7b-instruct:free', 'openrouter/consensus'].includes(claudeModel)
                              ? claudeModel
                              : 'custom'
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== 'custom') {
                              setClaudeModel(val);
                            } else {
                              setClaudeModel('');
                            }
                          }}
                          className="w-full mt-1.5 bg-[#090D1A] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400 transition-colors"
                        >
                          <optgroup label="OpenRouter Free Models">
                            <option value="google/gemini-2.5-flash:free">Gemini 2.5 Flash (google/gemini-2.5-flash:free)</option>
                            <option value="meta-llama/llama-3.1-8b-instruct:free">Llama 3.1 8B (meta-llama/llama-3.1-8b-instruct:free)</option>
                            <option value="mistralai/mistral-7b-instruct:free">Mistral 7B (mistralai/mistral-7b-instruct:free)</option>
                            <option value="openrouter/consensus">All Free Models Consensus (Gemini + Llama + Mistral)</option>
                          </optgroup>
                          <option value="custom">Custom Model ID...</option>
                        </select>
                        
                        {!['google/gemini-2.5-flash:free', 'meta-llama/llama-3.1-8b-instruct:free', 'mistralai/mistral-7b-instruct:free', 'openrouter/consensus'].includes(claudeModel) && (
                          <input
                            type="text"
                            value={claudeModel}
                            onChange={(e) => setClaudeModel(e.target.value)}
                            placeholder="Enter custom Model ID (e.g. google/gemini-2.5-flash:free)"
                            className="w-full mt-2 bg-[#090D1A] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400 transition-colors font-mono-data"
                          />
                        )}
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                          Select the OpenRouter model for AI Brain predictions. Custom model IDs are supported.
                        </p>
                      </div>


                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase">YouTube Data API v3 Key</label>
                        <input
                          type="password"
                          value={youtubeApiKey}
                          onChange={(e) => setYoutubeApiKey(e.target.value)}
                          placeholder={youtubeApiKey ? '••••••••••••••••••••••••••••••••' : 'AIzaSy...'}
                          className="w-full mt-1.5 bg-[#090D1A] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400 transition-colors"
                        />
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                          Used to fetch video descriptions and metadata for strategy scanning.
                        </p>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Consultation Trigger Frequency</label>
                        <select
                          value={aiConsultationMode}
                          onChange={(e) => setAiConsultationMode(e.target.value)}
                          className="w-full mt-1.5 bg-[#090D1A] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-cyan-400 outline-none"
                        >
                          <option value="anomaly">Anomaly Detected (On SL hit, high volatility) [Recommended]</option>
                          <option value="every_trade">Predict & Trade Every Candle (High API cost / Active AI Mode)</option>
                          <option value="manual">Manual Trigger Only (Advisory feed only)</option>
                        </select>
                      </div>

                      {aiConsultationMode === 'every_trade' && (
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold uppercase">AI Prediction Interval (Candle Time)</label>
                          <select
                            value={
                              ['1s', '1m', '5m', '15m', '1h', '1d'].includes(aiCandleInterval)
                                ? aiCandleInterval
                                : 'custom'
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val !== 'custom') {
                                setAiCandleInterval(val);
                              } else {
                                setAiCandleInterval('');
                              }
                            }}
                            className="w-full mt-1.5 bg-[#090D1A] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400 transition-colors"
                          >
                            <option value="1s">1 Second (1S)</option>
                            <option value="1m">1 Minute (1M)</option>
                            <option value="5m">5 Minutes (5M)</option>
                            <option value="15m">15 Minutes (15M)</option>
                            <option value="1h">1 Hour (1H)</option>
                            <option value="1d">1 Day (1D)</option>
                            <option value="custom">Custom Interval...</option>
                          </select>
                          
                          {!['1s', '1m', '5m', '15m', '1h', '1d'].includes(aiCandleInterval) && (
                            <input
                              type="text"
                              value={aiCandleInterval}
                              onChange={(e) => setAiCandleInterval(e.target.value)}
                              placeholder="Enter custom interval (e.g. 10s, 30s, 2m)"
                              className="w-full mt-2 bg-[#090D1A] border border-[#1E2D4A] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400 transition-colors font-mono-data"
                            />
                          )}
                          <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                            How often the AI Brain will predict the next candle. Clicking buttons on the live chart will automatically sync this setting!
                          </p>
                        </div>
                      )}

                      <div>
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">OpenRouter Daily Budget limit (USD)</label>
                          <span className="text-xs font-bold text-cyan-400 font-mono-data">${aiDailyBudget}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          step="1"
                          value={aiDailyBudget}
                          onChange={(e) => setAiDailyBudget(parseFloat(e.target.value))}
                          className="w-full mt-2 accent-cyan-400"
                        />
                        <p className="text-[9px] text-slate-500 leading-normal mt-1">
                          Safety limit. If today's token cost exceeds this amount, auto-consultations will be skipped.
                        </p>
                      </div>

                      <div className="pt-4 flex items-center space-x-3">
                        <button
                          onClick={saveAiSettings}
                          className="px-6 py-2.5 bg-[#00E676] hover:bg-[#00c868] text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95"
                        >
                          Save AI Settings
                        </button>
                        {saveKeysStatus && (
                          <span className={`text-xs font-bold ${saveKeysStatus.includes('Success') ? 'text-green-400' : 'text-slate-400 animate-pulse'}`}>
                            {saveKeysStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                  onChange={(e) => handleToggleAutoTrade(e.target.checked)}
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

          {/* Algorithms tab removed to support 100% pure Full AI Mode navigation */}

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

          <button
            onClick={() => setCurrentTab('aibrain')}
            className={`flex flex-col items-center space-y-0.5 py-1 px-2 rounded-lg transition-all cursor-pointer ${
              currentTab === 'aibrain' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-lg">psychology</span>
            <span className="text-[9px] font-bold">AI Brain</span>
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
                      onChange={(e) => handleToggleAutoTrade(e.target.checked)}
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
                      <span className="text-slate-500 font-bold">{getPortfolioCurrencySymbol()}</span>
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



                {/* Daily Profit Target */}
                <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A]">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300 font-bold">Daily Profit Target</span>
                    <span className="text-cyan-400 font-bold font-mono-data">{getPortfolioCurrencySymbol()}{dailyProfitTarget}</span>
                  </div>
                  <input 
                    type="number" 
                    min="0" 
                    step="10"
                    value={dailyProfitTarget}
                    onChange={(e) => setDailyProfitTarget(parseFloat(e.target.value) || 0.0)}
                    className="w-full bg-[#162035] text-white border border-[#1E2D4A] rounded-lg p-2 text-xs font-mono-data focus:outline-none focus:border-cyan-400"
                    placeholder="0 = Disabled"
                  />
                </div>

                {/* Daily Loss Limit */}
                <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A]">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300 font-bold">Daily Loss Limit</span>
                    <span className="text-red-400 font-bold font-mono-data">{getPortfolioCurrencySymbol()}{dailyLossLimit}</span>
                  </div>
                  <input 
                    type="number" 
                    min="0" 
                    step="10"
                    value={dailyLossLimit}
                    onChange={(e) => setDailyLossLimit(parseFloat(e.target.value) || 0.0)}
                    className="w-full bg-[#162035] text-white border border-[#1E2D4A] rounded-lg p-2 text-xs font-mono-data focus:outline-none focus:border-cyan-400"
                    placeholder="0 = Disabled"
                  />
                </div>

                {/* Trailing Stop Loss Toggle */}
                <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A] flex items-center justify-between">
                  <div>
                    <span className="text-slate-300 font-bold block">Trailing Stop-Loss</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Adjust stop loss to lock profit</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={enableTrailingStop}
                      onChange={(e) => setEnableTrailingStop(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#162035] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner"></div>
                  </label>
                </div>

                {/* Auto-Start Toggle */}
                <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A] flex items-center justify-between">
                  <div>
                    <span className="text-slate-300 font-bold block">Auto-Start on Login</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Toggle auto-trading on load</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={autoStartOnLogin}
                      onChange={(e) => setAutoStartOnLogin(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#162035] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner"></div>
                  </label>
                </div>

                {/* Allowed Trade Direction dropdown select */}
                <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A]">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300 font-bold">Allowed Trade Direction</span>
                  </div>
                  <select 
                    value={tradeDirection}
                    onChange={(e) => setTradeDirection(e.target.value)}
                    className="w-full bg-[#162035] text-cyan-400 border border-[#1E2D4A] rounded-lg p-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="BOTH">BOTH (LONG & SHORT Trades)</option>
                    <option value="LONG_ONLY">LONG ONLY (Recommended for Nifty 50)</option>
                    <option value="SHORT_ONLY">SHORT ONLY (Bearish Trades Only)</option>
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

                {/* Trade Shares */}
                <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A]">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300 font-bold">Auto-Trade Shares</span>
                    <span className="text-cyan-400 font-bold font-mono-data">{tradeShares} {isCryptoActive ? 'Units' : 'Shares'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number"
                      min={isCryptoActive ? "0.001" : "1"}
                      max="100000"
                      step={isCryptoActive ? "0.001" : "1"}
                      value={tradeShares}
                      onChange={(e) => setTradeShares(Math.max(isCryptoActive ? 0.001 : 1, parseFloat(e.target.value) || 0))}
                      className="w-full bg-[#162035] text-white border border-[#1E2D4A] rounded-lg p-2 text-xs font-mono-data focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 mt-3">
                    {(isCryptoActive ? [0.001, 0.01, 0.1, 0.5, 1.0, 5.0] : [1, 2, 5, 10, 50, 100]).map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setTradeShares(amt)}
                        className={`py-1.5 text-[10px] font-mono-data font-bold rounded-lg border cursor-pointer transition-all ${
                          tradeShares === amt 
                            ? 'bg-cyan-500 text-black border-cyan-400' 
                            : 'bg-[#162035] text-slate-300 border-[#1E2D4A] hover:border-cyan-500/50'
                        }`}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trade Leverage */}
                <div className="bg-[#111827] p-3.5 rounded-xl border border-[#1E2D4A]">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300 font-bold">Auto-Trade Leverage</span>
                    <span className="text-cyan-400 font-bold font-mono-data">{leverage}X</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      value={leverage}
                      onChange={(e) => setLeverage(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))}
                      className="w-full bg-[#162035] text-white border border-[#1E2D4A] rounded-lg p-2 text-xs font-mono-data focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 mt-3">
                    {[1, 5, 10, 25, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setLeverage(amt)}
                        className={`py-1.5 text-[10px] font-mono-data font-bold rounded-lg border cursor-pointer transition-all ${
                          leverage === amt 
                            ? 'bg-[#06B6D4] text-black border-[#06B6D4]' 
                            : 'bg-[#162035] text-slate-300 border-[#1E2D4A] hover:border-[#06B6D4]/50'
                        }`}
                      >
                        {amt}X
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
                      <label className="text-[10px] text-slate-400 block mb-1">
                        {brokerGateway.includes('Angel') ? 'Client ID | Password | TOTP Secret (separated by |)' : 'API Secret / Token'}
                      </label>
                      <input 
                        type="password" 
                        placeholder={brokerGateway.includes('Angel') ? 'e.g. S123456|1234|MYTOTPSECRETKEY' : '••••••••••••••••'} 
                        value={brokerApiSecret}
                        onChange={(e) => setBrokerApiSecret(e.target.value)}
                        className="w-full bg-[#162035] text-white border border-[#1E2D4A] rounded-lg p-2 text-xs font-mono-data focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Allowed Trade Direction</label>
                      <select 
                        value={tradeDirection}
                        onChange={(e) => setTradeDirection(e.target.value)}
                        className="w-full bg-[#162035] text-slate-200 border border-[#1E2D4A] rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-500 font-bold"
                      >
                        <option value="BOTH">BOTH (LONG & SHORT Trades)</option>
                        <option value="LONG_ONLY">LONG ONLY (Recommended for Nifty 50)</option>
                        <option value="SHORT_ONLY">SHORT ONLY (Bearish Trades Only)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      const activeToken = token || useAuthStore.getState().token
                      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : window.location.origin
                      await fetch(`${apiBase}/api/v1/auth/settings`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': activeToken ? `Bearer ${activeToken}` : ''
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
                          enable_telegram: enableTelegram,
                          daily_profit_target: parseFloat(dailyProfitTarget) || 0.0,
                          daily_loss_limit: parseFloat(dailyLossLimit) || 0.0,
                          enable_trailing_stop: enableTrailingStop,
                          auto_start_on_login: autoStartOnLogin,
                          trade_investment_usd: tradeInvestmentUSD,
                          trade_investment_inr: tradeInvestmentINR,
                          trade_shares: tradeShares,
                          trade_direction: tradeDirection,
                          leverage: leverage,
                          use_algorithms: useAlgorithms
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

        {/* Strategy Backtesting Modal Overlay */}
        {showBacktestModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030712]/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#0b1329] border border-[#1E2D4A] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
              <div className="flex justify-between items-center px-6 py-4 border-b border-[#1E2D4A] bg-[#111A30]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-400">analytics</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Strategy Backtest Engine</h3>
                </div>
                <button 
                  onClick={() => setShowBacktestModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 text-left">
                {isBacktesting ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin"></div>
                    </div>
                    <p className="text-xs font-bold text-cyan-400 animate-pulse uppercase tracking-wider">Simulating walk-forward trades on historical data...</p>
                  </div>
                ) : backtestResult ? (
                  <div className="space-y-6">
                    {/* Header Details */}
                    <div>
                      <h4 className="text-sm font-bold text-white">{backtestResult.strategy_title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Backtested Symbol: <span className="text-slate-200 font-bold">{selectedSymbol}</span> • Interval: 15m</p>
                    </div>

                    {/* Stats Dashboard Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-[#131E35] border border-[#1E2D4A]/50 rounded-xl p-3.5 text-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Total Trades</span>
                        <span className="text-lg font-black text-white font-mono-data">{backtestResult.total_trades}</span>
                      </div>
                      <div className="bg-[#131E35] border border-[#1E2D4A]/50 rounded-xl p-3.5 text-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Win Rate</span>
                        <span className={`text-lg font-black font-mono-data ${backtestResult.win_rate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                          {backtestResult.win_rate}%
                        </span>
                      </div>
                      <div className="bg-[#131E35] border border-[#1E2D4A]/50 rounded-xl p-3.5 text-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Net Returns</span>
                        <span className={`text-lg font-black font-mono-data ${backtestResult.net_pnl_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {backtestResult.net_pnl_pct >= 0 ? '+' : ''}{backtestResult.net_pnl_pct}%
                        </span>
                      </div>
                    </div>

                    {/* Win rate visual slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>WIN RATE ACCURACY</span>
                        <span className={backtestResult.win_rate >= 50 ? 'text-green-400' : 'text-red-400'}>{backtestResult.win_rate}%</span>
                      </div>
                      <div className="h-2 bg-[#162035] rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${backtestResult.win_rate >= 50 ? 'bg-green-400' : 'bg-red-400'}`}
                          style={{ width: `${backtestResult.win_rate}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Trade Ledger list */}
                    <div className="space-y-2.5">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulated Trade Ledger</h5>
                      {backtestResult.trades && backtestResult.trades.length > 0 ? (
                        <div className="border border-[#1E2D4A]/40 rounded-xl overflow-hidden bg-[#090D1A]">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-[#111A30]/50 border-b border-[#1E2D4A]/40 text-[9px] text-slate-400 font-bold uppercase">
                                <th className="px-4 py-2">ID</th>
                                <th className="px-4 py-2">Entry Price</th>
                                <th className="px-4 py-2">Exit Price</th>
                                <th className="px-4 py-2">Return (%)</th>
                                <th className="px-4 py-2 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1E2D4A]/20 text-[10px] text-slate-300 font-mono-data">
                              {backtestResult.trades.map((t) => (
                                <tr key={t.id} className="hover:bg-[#131B2E]/20 transition-colors">
                                  <td className="px-4 py-2">#{t.id}</td>
                                  <td className="px-4 py-2">${t.entry_price.toLocaleString()}</td>
                                  <td className="px-4 py-2">${t.exit_price.toLocaleString()}</td>
                                  <td className={`px-4 py-2 font-bold ${t.return_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {t.return_pct >= 0 ? '+' : ''}{t.return_pct}%
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${t.status === 'WIN' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                      {t.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">No trades executed. Market indicators did not cross trigger thresholds in this time interval.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-red-400">Failed to load backtest reports.</p>
                )}
              </div>

              <div className="px-6 py-4 bg-[#111A30] border-t border-[#1E2D4A] flex justify-end">
                <button
                  onClick={() => setShowBacktestModal(false)}
                  className="px-4 py-2 bg-cyan-400 text-black font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-cyan-300 transition-all cursor-pointer shadow-md"
                >
                  Close Engine
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedConsultation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030712]/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#0b1329] border border-[#1E2D4A] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
              <div className="flex justify-between items-center px-6 py-4 border-b border-[#1E2D4A] bg-[#111A30]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-400">psychology</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Consultation Report</h3>
                </div>
                <button 
                  onClick={() => setSelectedConsultation(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 text-left">
                {/* Meta details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#131E35] border border-[#1E2D4A]/50 rounded-xl p-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Timestamp</span>
                    <span className="font-bold text-white font-mono-data">{new Date(selectedConsultation.date).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Asset Pair</span>
                    <span className="font-bold text-white font-mono-data">{selectedConsultation.symbol}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Type</span>
                    <span className="font-bold text-cyan-400 uppercase tracking-wider">{selectedConsultation.issue_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Recommendation</span>
                    <span className={`font-bold ${
                      selectedConsultation.recommendation === 'BUY' ? 'text-green-400' : (selectedConsultation.recommendation === 'SELL' ? 'text-red-400' : 'text-amber-500')
                    }`}>{selectedConsultation.recommendation}</span>
                  </div>
                </div>

                {/* Prompt Summary */}
                {selectedConsultation.prompt && (
                  <div className="bg-[#090D1A] border border-[#1E2D4A]/30 rounded-xl p-4">
                    <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Prompt Summary</h4>
                    <p className="text-xs text-slate-300 font-mono-data leading-relaxed">{selectedConsultation.prompt}</p>
                  </div>
                )}

                {/* Detailed Advisory Snippet */}
                <div className="bg-[#090D1A] border border-[#1E2D4A]/30 rounded-xl p-4">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Detailed Advisory & Diagnosis</h4>
                  <div className="whitespace-pre-wrap font-sans text-xs text-slate-300 leading-relaxed space-y-2">
                    {selectedConsultation.response}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-[#111A30] border-t border-[#1E2D4A] flex justify-end">
                <button
                  onClick={() => setSelectedConsultation(null)}
                  className="px-4 py-2 bg-cyan-400 text-black font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-cyan-300 transition-all cursor-pointer shadow-md"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
