# 📊 SEO Score — Local SEO Audit POC

A Node.js + Express API service that performs **Google PageSpeed Insights (Lighthouse) audits** combined with **live keyword and index checks via SerpApi**.
It returns SEO, Performance, keyword rank, and index coverage scores in a single JSON response, making it easy to assess a website's SEO health.

This service is designed to run **locally within your network** for quick audits and technical evaluations.

---

## 📦 Tech Stack

* **Node.js** & **Express.js** — API server
* **Google PageSpeed Insights API** — Lighthouse audit reports
* **SerpApi** — Live keyword ranking and index coverage (optional)
* **dotenv** — Environment variable management
* **cors** — Enable cross-origin requests
* **(Optional) PM2** — Persistent background service

---

## 📂 Project Structure

```
seo-score/
├── package.json
├── server.js
├── .env              # Environment variables (not committed)
└── README.md
```

---

## 📋 Installation & Setup

1️⃣ Clone or create the project directory:

```bash
mkdir seo-score
cd seo-score
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

4️⃣ Create a `.env` file in the project root:

```env
SERPAPI_KEY=your_serpapi_key_here
PSI_API_KEY=your_pagespeed_api_key_here
PORT=3020
```

> **Note:** Google Chrome or Chromium is only needed if you plan to extend the project with Puppeteer in the future.

---

## 📝 Usage

### Start the API server:

```bash
node server.js
```

Or run it persistently with PM2:

```bash
pm2 start server.js --name seo-score
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
  "accessibilityScore": 88,
  "bestPracticesScore": 95,
  "keywordScore": 100,
  "indexScore": 100,
  "finalScore": "91.8",
  "coreWebVitals": {
    "LCP": "2.3 s",
    "TBT": "120 ms",
    "CLS": "0.01"
  },
  "topOpportunities": [
    { "title": "Reduce unused CSS", "displayValue": "1.2 KB" },
    { "title": "Minify JavaScript", "displayValue": "500 B" },
    { "title": "Serve images in next-gen formats", "displayValue": "2 images" }
  ],
  "passedAuditsCount": 45
}
```

**Response (without SerpApi or missing keyword/location):**

```json
{
  "siteUrl": "https://example.com",
  "seoScore": 92,
  "performanceScore": 84,
  "accessibilityScore": 88,
  "bestPracticesScore": 95,
  "finalScore": "87.2",
  "coreWebVitals": {
    "LCP": "2.3 s",
    "TBT": "120 ms",
    "CLS": "0.01"
  },
  "topOpportunities": [
    { "title": "Reduce unused CSS", "displayValue": "1.2 KB" },
    { "title": "Minify JavaScript", "displayValue": "500 B" },
    { "title": "Serve images in next-gen formats", "displayValue": "2 images" }
  ],
  "passedAuditsCount": 45
}
```

> **Note:** If SerpApi is not configured, `keywordScore` and `indexScore` are set to `0`. The `finalScore` is recalculated using **available Lighthouse scores with normalized weights**.

---

## 🌐 Access from Local Network

When you start the server, it prints both local and network URLs:

```
SEO Score API is running
Local:    http://localhost:3020
Network:  http://192.168.1.100:3020
```

Send POST requests to `/run-audit` at either URL.

---

## 📈 Future Enhancements

* Add **request queuing** for multiple concurrent audits
* Store reports as **JSON files** in `/audits/`
* Build a **simple front-end dashboard** to view results
* **Dockerize** the API or deploy to a cloud server for wider access

---

## 📌 Notes

* Each audit may take **5–20 seconds**, depending on website size.
* SerpApi is **optional**; Lighthouse scores are always returned.
* Requires valid API keys:

  * [Google PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/get-started)
  * [SerpApi](https://serpapi.com/) (optional)
* Environment variables are loaded via **dotenv**.

---

