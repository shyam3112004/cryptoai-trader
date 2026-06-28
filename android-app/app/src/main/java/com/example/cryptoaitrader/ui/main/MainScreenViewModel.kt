package com.example.cryptoaitrader.ui.main

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class SignalItem(
  val id: String,
  val pair: String,
  val type: String, // LONG or SHORT
  val entryPrice: String,
  val targetPrice: String,
  val stopLoss: String,
  val leverage: String,
  val confidence: String,
  val timeAgo: String
)

data class TradingUiState(
  val isDemoMode: Boolean = true,
  val isAutoTradingEnabled: Boolean = true,
  val selectedTab: Int = 0,
  val demoBalance: String = "$10,245.80 USDT",
  val realBalance: String = "$1,850.00 USDT",
  val demoPnl: String = "+$245.80 (2.45%)",
  val realPnl: String = "+$42.10 (2.32%)",
  val activeSignalsCount: Int = 4,
  val signals: List<SignalItem> = listOf(
    SignalItem("1", "BTC/USDT", "LONG", "$68,420.00", "$71,500.00", "$67,100.00", "20x", "96.4%", "2 mins ago"),
    SignalItem("2", "ETH/USDT", "SHORT", "$3,540.00", "$3,380.00", "$3,620.00", "10x", "91.2%", "5 mins ago"),
    SignalItem("3", "SOL/USDT", "LONG", "$148.50", "$162.00", "$142.00", "15x", "94.8%", "12 mins ago"),
    SignalItem("4", "BNB/USDT", "LONG", "$580.20", "$610.00", "$568.00", "10x", "88.9%", "18 mins ago")
  )
)

class MainScreenViewModel : ViewModel() {
  private val _uiState = MutableStateFlow(TradingUiState())
  val uiState: StateFlow<TradingUiState> = _uiState.asStateFlow()

  fun toggleAccountMode() {
    _uiState.value = _uiState.value.copy(isDemoMode = !_uiState.value.isDemoMode)
  }

  fun toggleAutoTrading() {
    _uiState.value = _uiState.value.copy(isAutoTradingEnabled = !_uiState.value.isAutoTradingEnabled)
  }

  fun selectTab(index: Int) {
    _uiState.value = _uiState.value.copy(selectedTab = index)
  }
}
