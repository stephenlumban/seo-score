# 📊 SEO Audit — Local SEO Audit POC

A Node.js + Express API service that runs a Google PageSpeed Insights (Lighthouse) audit and combines it with live keyword and index checks via SerpApi. Returns SEO, Performance, keyword rank, and index coverage scores in a single JSON response.

Hosted locally within your network for quick SEO health checks and technical audits.

---

## 📦 Tech Stack

- Node.js
- Express.js
- Google PageSpeed Insights API (returns Lighthouse report)
- SerpApi (for live keyword & index checks)
- dotenv (for environment variables)
- (Optional) PM2 for persistent background service

---

## 📂 Project Structure

```
seo-audit/
├── package.json
├── server.js
├── .env              # Environment variables (not committed)
└── README.md
```

---

## 📋 Installation & Setup

1️⃣ Clone this repository or create a new directory:
```bash
mkdir seo-audit
cd seo-audit
npm init -y
```

2️⃣ Install dependencies:
```bash
npm install express cors dotenv axios
```

3️⃣ (Optional) Install PM2 for process management:
```bash
npm install -g pm2
```

4️⃣ Ensure **Google Chrome** or **Chromium** is installed and accessible in your system PATH (only needed if you plan to use Puppeteer in the future).

5️⃣ Create a `.env` file in the project root:
```env
SERPAPI_KEY=your_serpapi_key_here
PSI_API_KEY=your_pagespeed_api_key_here
PORT=3020
```

---

## 📝 Usage

### Start the API server:
```bash
node server.js
```

Or run it persistently in the background with PM2:
```bash
pm2 start server.js --name seo-audit
```

---

## 📡 API Endpoint

### POST `/run-audit`

**Request Body:**
```json
{
  "siteUrl": "https://example.com",
  "keyword": "your target keyword",
  "location": "Your City, Country"
}
```

**Response (with SerpApi configured):**
```json
{
  "siteUrl": "https://example.com",
  "seoScore": 92,
  "performanceScore": 84,
  "keywordScore": 100,
  "indexScore": 100,
  "finalScore": "91.80"
}
```

**Response (without SerpApi or missing keyword/location):**
```json
{
  "siteUrl": "https://example.com",
  "seoScore": 92,
  "performanceScore": 84,
  "keywordScore": 0,
  "indexScore": 0,
  "finalScore": "62.80"
}
```

> **Note:** If the SerpApi key or any of the keyword/location parameters are missing, the API will still return a `finalScore` based only on Lighthouse scores. The `keywordScore` and `indexScore` will be set to 0, and the `finalScore` will be calculated **using only the available scores (SEO and Performance), with their weights normalized to sum to 1**. The absence of SerpApi will not unfairly penalize the final score.

---

## 🌐 Access from Local Network

When you start the server, it will print both local and network URLs, e.g.:
```
SEO Audit API is running
Local:    http://localhost:3020
Network:  http://192.168.1.100:3020
```

Send POST requests to `/run-audit` at either address.

---

## 📈 Next Steps After POC

- Add request queuing to handle multiple concurrent audits
- Save reports as JSON files in `/audits/`
- Build a simple front-end dashboard to trigger audits and view results
- Dockerize or deploy to a cloud VPS if scaling beyond the local network

---

## 📌 Notes

- Each audit can take **5–20 seconds** depending on the website size and content.
- Requires a valid [SerpApi](https://serpapi.com/) key for keyword and index checks (optional). If not provided, the final score is calculated using only SEO and Performance scores, with their weights normalized to sum to 1.
- Requires a valid [Google PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started) key for Lighthouse data.
- Best for light to moderate usage during proof-of-concept and internal testing.
- Environment variables are loaded from `.env` using `dotenv`.
- The frontend expects the `/run-audit` endpoint.

---

## 📣 Credits

Built with [Google PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/get-started), Express, and Node.js.  
Project plan and structure prepared by ChatGPT ⚡.

---

## Lighthouse POC

### Backend (API)
- Start the server with: `node server.js`
- Ensure you have a `.env` file with your API keys (see code for required keys).

### Frontend
- A simple frontend is provided in `frontend/`.
- To run the frontend:
  1. `cd frontend`
  2. `npm install`
  3. `npm start`
- The frontend will prompt for country, keyword, and website, then display the audit scores returned by the backend.

---
