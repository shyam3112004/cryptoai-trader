package com.example.cryptoaitrader.ui.main

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.cryptoaitrader.theme.*

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun MainScreen(
  modifier: Modifier = Modifier
) {
  // Live web application URL hosted on Hugging Face Spaces / Production Backend
  val webAppUrl = "https://shyam311-cryptoai-trader.hf.space"
  
  var isLoading by remember { mutableStateOf(true) }
  var webViewInstance by remember { mutableStateOf<WebView?>(null) }

  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(ObsidianBackground)
      .statusBarsPadding()
  ) {
    AndroidView(
      factory = { context ->
        WebView(context).apply {
          layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
          )
          
          settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            loadWithOverviewMode = true
            useWideViewPort = true
            builtInZoomControls = false
            displayZoomControls = false
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            userAgentString = "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 CryptoAITraderApp"
          }

          webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
              super.onPageStarted(view, url, favicon)
              isLoading = true
            }

            override fun onPageFinished(view: WebView?, url: String?) {
              super.onPageFinished(view, url)
              isLoading = false
            }
          }

          webChromeClient = WebChromeClient()
          
          loadUrl(webAppUrl)
          webViewInstance = this
        }
      },
      update = { webView ->
        webViewInstance = webView
      },
      modifier = Modifier.fillMaxSize()
    )

    // Sleek loading overlay while web app assets load
    if (isLoading) {
      Box(
        modifier = Modifier
          .fillMaxSize()
          .background(ObsidianBackground),
        contentAlignment = Alignment.Center
      ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
          CircularProgressIndicator(
            color = ElectricBlue,
            strokeWidth = 3.dp,
            modifier = Modifier.size(48.dp)
          )
          Spacer(modifier = Modifier.height(16.dp))
          Text(
            text = "CryptoAI Trader",
            fontWeight = FontWeight.Bold,
            color = TextPrimary,
            fontSize = 20.sp
          )
          Spacer(modifier = Modifier.height(4.dp))
          Text(
            text = "Loading Live Web Terminal & Auto-Trading Engine...",
            color = TextSecondary,
            fontSize = 12.sp
          )
        }
      }
    }
  }
}
