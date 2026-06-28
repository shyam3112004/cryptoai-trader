---
title: CryptoAI Trader Engine
emoji: 📈
colorFrom: green
colorTo: black
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: Professional AI Crypto Auto-Trading Terminal & API
---

# 🚀 CryptoAI Trader Engine on Hugging Face Spaces

This repository hosts the full-stack CryptoAI Auto-Trading Terminal on Hugging Face Spaces. It includes:
- **FastAPI Backend Server**: Running AI signal engines, auto-trading logic, and WebSocket tickers.
- **React Vite Dashboard**: High-performance dark-themed trading terminal.

## 📦 Deployment Instructions to Hugging Face Spaces

1. Create a new Space on [Hugging Face Spaces](https://huggingface.co/new-space).
2. Choose **Docker** as the Space SDK (Blank template).
3. Clone your Hugging Face Space repository locally or push this repository directly:

```bash
git init
git remote add origin https://huggingface.co/spaces/YOUR_USERNAME/cryptoai-trader
git add .
git commit -m "Deploy CryptoAI Trader to Hugging Face Spaces"
git push -u origin main
```

4. Hugging Face Spaces will automatically detect the `Dockerfile`, build the container, and serve your trading app live on port `7860`!
