package com.example.cryptoaitrader.ui.main

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavKey
import com.example.cryptoaitrader.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
  onItemClick: (NavKey) -> Unit = {},
  modifier: Modifier = Modifier,
  viewModel: MainScreenViewModel = viewModel()
) {
  val state by viewModel.uiState.collectAsState()

  Scaffold(
    topBar = {
      TopAppBar(
        title = {
          Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
              modifier = Modifier
                .size(10.dp)
                .clip(CircleShape)
                .background(if (state.isAutoTradingEnabled) ProfitGreen else TextSecondary)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
              text = "CryptoAI",
              fontWeight = FontWeight.Bold,
              color = TextPrimary,
              fontSize = 20.sp
            )
            Text(
              text = "Trader",
              fontWeight = FontWeight.Normal,
              color = ElectricBlue,
              fontSize = 20.sp
            )
          }
        },
        actions = {
          // DEMO vs REAL Account Switcher Pill
          Surface(
            onClick = { viewModel.toggleAccountMode() },
            shape = RoundedCornerShape(20.dp),
            color = if (state.isDemoMode) AmberDemo.copy(alpha = 0.2f) else ProfitGreen.copy(alpha = 0.2f),
            border = Modifier.border(1.dp, if (state.isDemoMode) AmberDemo else ProfitGreen, RoundedCornerShape(20.dp)),
            modifier = Modifier.padding(end = 12.dp)
          ) {
            Row(
              verticalAlignment = Alignment.CenterVertically,
              modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
              Icon(
                imageVector = if (state.isDemoMode) Icons.Default.Science else Icons.Default.AccountBalanceWallet,
                contentDescription = "Account Mode",
                tint = if (state.isDemoMode) AmberDemo else ProfitGreen,
                modifier = Modifier.size(16.dp)
              )
              Spacer(modifier = Modifier.width(6.dp))
              Text(
                text = if (state.isDemoMode) "DEMO" else "REAL",
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                color = if (state.isDemoMode) AmberDemo else ProfitGreen
              )
            }
          }
        },
        colors = TopAppBarDefaults.topAppBarColors(containerColor = ObsidianBackground)
      )
    },
    bottomBar = {
      NavigationBar(containerColor = SurfaceCard, contentColor = TextPrimary) {
        NavigationBarItem(
          selected = state.selectedTab == 0,
          onClick = { viewModel.selectTab(0) },
          icon = { Icon(Icons.Default.Dashboard, contentDescription = "Dashboard") },
          label = { Text("Dashboard", fontSize = 11.sp) },
          colors = NavigationBarItemDefaults.colors(
            selectedIconColor = ElectricBlue,
            indicatorColor = ElectricBlue.copy(alpha = 0.2f),
            unselectedIconColor = TextSecondary,
            unselectedTextColor = TextSecondary,
            selectedTextColor = ElectricBlue
          )
        )
        NavigationBarItem(
          selected = state.selectedTab == 1,
          onClick = { viewModel.selectTab(1) },
          icon = { Icon(Icons.Default.Bolt, contentDescription = "Signals") },
          label = { Text("Signals", fontSize = 11.sp) },
          colors = NavigationBarItemDefaults.colors(
            selectedIconColor = ElectricBlue,
            indicatorColor = ElectricBlue.copy(alpha = 0.2f),
            unselectedIconColor = TextSecondary,
            unselectedTextColor = TextSecondary,
            selectedTextColor = ElectricBlue
          )
        )
        NavigationBarItem(
          selected = state.selectedTab == 2,
          onClick = { viewModel.selectTab(2) },
          icon = { Icon(Icons.Default.ShowChart, contentDescription = "Market") },
          label = { Text("Market", fontSize = 11.sp) },
          colors = NavigationBarItemDefaults.colors(
            selectedIconColor = ElectricBlue,
            indicatorColor = ElectricBlue.copy(alpha = 0.2f),
            unselectedIconColor = TextSecondary,
            unselectedTextColor = TextSecondary,
            selectedTextColor = ElectricBlue
          )
        )
        NavigationBarItem(
          selected = state.selectedTab == 3,
          onClick = { viewModel.selectTab(3) },
          icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
          label = { Text("Settings", fontSize = 11.sp) },
          colors = NavigationBarItemDefaults.colors(
            selectedIconColor = ElectricBlue,
            indicatorColor = ElectricBlue.copy(alpha = 0.2f),
            unselectedIconColor = TextSecondary,
            unselectedTextColor = TextSecondary,
            selectedTextColor = ElectricBlue
          )
        )
      }
    },
    containerColor = ObsidianBackground
  ) { padding ->
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(padding)
        .padding(horizontal = 16.dp)
    ) {
      when (state.selectedTab) {
        0 -> DashboardTab(state = state, onToggleAutoTrade = { viewModel.toggleAutoTrading() })
        1 -> SignalsTab(signals = state.signals)
        2 -> MarketTab()
        3 -> SettingsTab(state = state, onToggleMode = { viewModel.toggleAccountMode() })
      }
    }
  }
}

@Composable
fun DashboardTab(state: TradingUiState, onToggleAutoTrade: () -> Unit) {
  LazyColumn(
    modifier = Modifier.fillMaxSize(),
    verticalArrangement = Arrangement.spacedBy(16.dp),
    contentPadding = PaddingValues(vertical = 12.dp)
  ) {
    // Wallet Equity Card
    item {
      Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard),
        modifier = Modifier
          .fillMaxWidth()
          .border(1.dp, SurfaceCardBorder, RoundedCornerShape(20.dp))
      ) {
        Column(modifier = Modifier.padding(20.dp)) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
          ) {
            Text(
              text = if (state.isDemoMode) "DEMO PORTFOLIO BALANCE" else "REAL WALLET BALANCE",
              fontSize = 11.sp,
              fontWeight = FontWeight.Bold,
              color = TextSecondary,
              letterSpacing = 1.sp
            )
            Surface(
              shape = RoundedCornerShape(12.dp),
              color = if (state.isDemoMode) AmberDemo.copy(alpha = 0.15f) else ProfitGreen.copy(alpha = 0.15f)
            ) {
              Text(
                text = if (state.isDemoMode) "PRACTICE MODE" else "LIVE BROKER",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = if (state.isDemoMode) AmberDemo else ProfitGreen,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
              )
            }
          }
          Spacer(modifier = Modifier.height(8.dp))
          Text(
            text = if (state.isDemoMode) state.demoBalance else state.realBalance,
            fontSize = 32.sp,
            fontWeight = FontWeight.ExtraBold,
            color = TextPrimary
          )
          Spacer(modifier = Modifier.height(4.dp))
          Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
              imageVector = Icons.Default.TrendingUp,
              contentDescription = "PnL",
              tint = ProfitGreen,
              modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
              text = if (state.isDemoMode) state.demoPnl else state.realPnl,
              fontSize = 14.sp,
              fontWeight = FontWeight.SemiBold,
              color = ProfitGreen
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(text = "(24h)", fontSize = 12.sp, color = TextSecondary)
          }
        }
      }
    }

    // Master Auto-Trading Switch Card
    item {
      Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard),
        modifier = Modifier
          .fillMaxWidth()
          .border(
            1.dp,
            if (state.isAutoTradingEnabled) ProfitGreen.copy(alpha = 0.4f) else LossRed.copy(alpha = 0.4f),
            RoundedCornerShape(16.dp)
          )
      ) {
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
            Box(
              modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .background(if (state.isAutoTradingEnabled) ProfitGreen.copy(alpha = 0.15f) else LossRed.copy(alpha = 0.15f)),
              contentAlignment = Alignment.Center
            ) {
              Icon(
                imageVector = if (state.isAutoTradingEnabled) Icons.Default.SmartToy else Icons.Default.PauseCircle,
                contentDescription = "Bot",
                tint = if (state.isAutoTradingEnabled) ProfitGreen else LossRed,
                modifier = Modifier.size(24.dp)
              )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
              Text(
                text = "AI Auto-Trading Engine",
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                color = TextPrimary
              )
              Text(
                text = if (state.isAutoTradingEnabled) "Active on ${if (state.isDemoMode) "Demo" else "Real"} Account" else "Paused by User",
                fontSize = 12.sp,
                color = TextSecondary
              )
            }
          }
          Switch(
            checked = state.isAutoTradingEnabled,
            onCheckedChange = { onToggleAutoTrade() },
            colors = SwitchDefaults.colors(
              checkedThumbColor = Color.White,
              checkedTrackColor = ProfitGreen,
              uncheckedThumbColor = TextSecondary,
              uncheckedTrackColor = SurfaceCardBorder
            )
          )
        }
      }
    }

    // Quick Ticker Chips
    item {
      Text(
        text = "LIVE MARKET WATCH",
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        color = TextSecondary,
        letterSpacing = 1.sp,
        modifier = Modifier.padding(top = 8.dp)
      )
      Spacer(modifier = Modifier.height(8.dp))
      LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        item { TickerChip("BTC/USDT", "$68,420.50", "+3.2%", true) }
        item { TickerChip("ETH/USDT", "$3,540.10", "+1.8%", true) }
        item { TickerChip("SOL/USDT", "$148.75", "+5.4%", true) }
        item { TickerChip("BNB/USDT", "$580.20", "-0.6%", false) }
      }
    }

    // Active AI Signals Header & List
    item {
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .padding(top = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Text(
          text = "HIGH-CONFIDENCE SIGNALS",
          fontSize = 11.sp,
          fontWeight = FontWeight.Bold,
          color = TextSecondary,
          letterSpacing = 1.sp
        )
        Text(
          text = "${state.signals.size} Active",
          fontSize = 12.sp,
          color = ElectricBlue,
          fontWeight = FontWeight.SemiBold
        )
      }
    }

    items(state.signals) { signal ->
      SignalCard(signal = signal, isDemo = state.isDemoMode)
    }
  }
}

@Composable
fun TickerChip(symbol: String, price: String, change: String, isPositive: Boolean) {
  Surface(
    shape = RoundedCornerShape(12.dp),
    color = SurfaceCard,
    border = Modifier.border(1.dp, SurfaceCardBorder, RoundedCornerShape(12.dp))
  ) {
    Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)) {
      Text(text = symbol, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
      Spacer(modifier = Modifier.height(2.dp))
      Row(verticalAlignment = Alignment.CenterVertically) {
        Text(text = price, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
        Spacer(modifier = Modifier.width(6.dp))
        Text(
          text = change,
          fontSize = 11.sp,
          fontWeight = FontWeight.Bold,
          color = if (isPositive) ProfitGreen else LossRed
        )
      }
    }
  }
}

@Composable
fun SignalCard(signal: SignalItem, isDemo: Boolean) {
  val isLong = signal.type == "LONG"
  Card(
    shape = RoundedCornerShape(16.dp),
    colors = CardDefaults.cardColors(containerColor = SurfaceCard),
    modifier = Modifier
      .fillMaxWidth()
      .border(1.dp, SurfaceCardBorder, RoundedCornerShape(16.dp))
  ) {
    Column(modifier = Modifier.padding(16.dp)) {
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
          Surface(
            shape = RoundedCornerShape(6.dp),
            color = if (isLong) ProfitGreen.copy(alpha = 0.2f) else LossRed.copy(alpha = 0.2f)
          ) {
            Text(
              text = signal.type,
              fontSize = 11.sp,
              fontWeight = FontWeight.ExtraBold,
              color = if (isLong) ProfitGreen else LossRed,
              modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
            )
          }
          Spacer(modifier = Modifier.width(8.dp))
          Text(text = signal.pair, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = TextPrimary)
          Spacer(modifier = Modifier.width(6.dp))
          Text(text = signal.leverage, fontSize = 12.sp, color = TextSecondary)
        }
        Text(text = signal.timeAgo, fontSize = 11.sp, color = TextSecondary)
      }

      Spacer(modifier = Modifier.height(12.dp))

      Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Column {
          Text(text = "Entry Price", fontSize = 11.sp, color = TextSecondary)
          Text(text = signal.entryPrice, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
        }
        Column {
          Text(text = "Target Price", fontSize = 11.sp, color = TextSecondary)
          Text(text = signal.targetPrice, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = ProfitGreen)
        }
        Column {
          Text(text = "Stop Loss", fontSize = 11.sp, color = TextSecondary)
          Text(text = signal.stopLoss, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = LossRed)
        }
      }

      Spacer(modifier = Modifier.height(12.dp))

      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
          Icon(Icons.Default.Verified, contentDescription = "AI", tint = ElectricBlue, modifier = Modifier.size(14.dp))
          Spacer(modifier = Modifier.width(4.dp))
          Text(text = "AI Confidence: ${signal.confidence}", fontSize = 11.sp, color = ElectricBlue, fontWeight = FontWeight.SemiBold)
        }

        Button(
          onClick = { },
          shape = RoundedCornerShape(8.dp),
          colors = ButtonDefaults.buttonColors(containerColor = if (isLong) ProfitGreen else LossRed),
          contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
          modifier = Modifier.height(32.dp)
        ) {
          Text(
            text = if (isDemo) "AUTO-EXECUTE (DEMO)" else "EXECUTE LIVE",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
          )
        }
      }
    }
  }
}

@Composable
fun SignalsTab(signals: List<SignalItem>) {
  Column(modifier = Modifier.fillMaxSize().padding(vertical = 12.dp)) {
    Text("All AI Signals", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
    Spacer(modifier = Modifier.height(12.dp))
    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
      items(signals) { signal ->
        SignalCard(signal = signal, isDemo = true)
      }
    }
  }
}

@Composable
fun MarketTab() {
  Column(modifier = Modifier.fillMaxSize().padding(vertical = 12.dp)) {
    Text("Crypto Markets", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
    Spacer(modifier = Modifier.height(12.dp))
    Text("Live WebSocket Price Streaming Active", fontSize = 14.sp, color = TextSecondary)
  }
}

@Composable
fun SettingsTab(state: TradingUiState, onToggleMode: () -> Unit) {
  Column(modifier = Modifier.fillMaxSize().padding(vertical = 12.dp)) {
    Text("Trading Settings", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
    Spacer(modifier = Modifier.height(16.dp))

    Card(
      shape = RoundedCornerShape(16.dp),
      colors = CardDefaults.cardColors(containerColor = SurfaceCard),
      modifier = Modifier.fillMaxWidth()
    ) {
      Column(modifier = Modifier.padding(16.dp)) {
        Text("Account Execution Mode", fontWeight = FontWeight.Bold, color = TextPrimary, fontSize = 16.sp)
        Spacer(modifier = Modifier.height(8.dp))
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Text(
            text = if (state.isDemoMode) "Currently in DEMO ($10,000 Paper Trading)" else "Currently in REAL (Exchange API)",
            fontSize = 13.sp,
            color = TextSecondary
          )
          Button(onClick = { onToggleMode() }, colors = ButtonDefaults.buttonColors(containerColor = ElectricBlue)) {
            Text(if (state.isDemoMode) "Switch to Real" else "Switch to Demo", fontSize = 12.sp)
          }
        }
      }
    }
  }
}
