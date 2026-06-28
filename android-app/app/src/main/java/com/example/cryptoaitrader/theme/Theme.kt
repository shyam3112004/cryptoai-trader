package com.example.cryptoaitrader.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkTradingColorScheme = darkColorScheme(
  primary = ElectricBlue,
  secondary = ProfitGreen,
  tertiary = AmberDemo,
  background = ObsidianBackground,
  surface = SurfaceCard,
  onPrimary = TextPrimary,
  onSecondary = TextPrimary,
  onBackground = TextPrimary,
  onSurface = TextPrimary
)

@Composable
fun CryptoAITraderTheme(
  darkTheme: Boolean = true,
  content: @Composable () -> Unit,
) {
  MaterialTheme(
    colorScheme = DarkTradingColorScheme,
    typography = Typography,
    content = content
  )
}
