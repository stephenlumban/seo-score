import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { URL } from 'url';
import os from 'os';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const serpApiKey = process.env.SERPAPI_KEY;
const PORT = process.env.PORT || 3020;

// Helper: get local network IP address
function getNetworkIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '0.0.0.0';
}

// Root/Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: "API is awake and running" });
});

// Combined audit endpoint
app.post('/run-audit', async (req, res) => {
  const { siteUrl, keyword, location } = req.body;
  console.log(`\n--- [START] New audit request for: ${siteUrl} ---`);

  if (!siteUrl) {
    return res.status(400).json({ error: 'Missing required parameter: siteUrl.' });
  }

  // Extract domain from siteUrl
  let domain;
  try {
    const urlObj = new URL(siteUrl);
    domain = urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
    return res.status(400).json({ error: 'Invalid siteUrl.' });
  }

  const psiApiKey = process.env.PSI_API_KEY;
  if (!psiApiKey) {
    console.error('[ERROR] PSI_API_KEY is not configured in the .env file.');
    return res.status(500).json({ error: 'Missing PSI_API_KEY in environment.' });
  }

  try {
    // Call PageSpeed Insights API
    const psiRes = await axios.get('https://www.googleapis.com/pagespeedonline/v5/runPagespeed', {
      params: {
        url: siteUrl,
        strategy: 'mobile',
        key: psiApiKey,
        category: ['performance', 'seo', 'accessibility', 'best-practices']
      },
      paramsSerializer: params => {
        return Object.entries(params)
          .map(([key, value]) => Array.isArray(value)
            ? value.map(v => `${key}=${encodeURIComponent(v)}`).join('&')
            : `${key}=${encodeURIComponent(value)}`)
          .join('&');
      },
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('1. Sending request to PageSpeed API with these parameters:');
    console.log(psiRes);
    const lighthouseResult = psiRes.data.lighthouseResult;
    if (!lighthouseResult) {
      throw new Error('No Lighthouse result in PSI API response.');
    }

    console.log('3. Full `categories` object from the API response:');
    console.log(JSON.stringify(lighthouseResult.categories, null, 2));

    const categories = lighthouseResult.categories || {};
    const seoCategoryObject = categories.seo;

    console.log('4. Specifically extracted the `seo` category object:');
    console.log(seoCategoryObject); // Will be an object or `undefined`

    const seoScore = Math.round(((categories.seo?.score) || 0) * 100);
    const performanceScore = Math.round(((categories.performance?.score) || 0) * 100);
    const accessibilityScore = Math.round(((categories.accessibility?.score) || 0) * 100);
    const bestPracticesScore = Math.round(((categories['best-practices']?.score) || 0) * 100);

    console.log(`5. Calculated Scores -> Performance: ${performanceScore}, SEO: ${seoScore}, Accessibility: ${accessibilityScore}, Best-Practices: ${bestPracticesScore}`);

    let keywordScore = 0;
    let indexScore = 0;
    let useSerpApi = false;

    // If SerpApi key and params are present, get those scores
    if (serpApiKey && keyword && location) {
      useSerpApi = true;
      // Run SerpApi Keyword Rank Check
      const serpRes = await axios.get('https://serpapi.com/search.json', {
        params: {
          q: keyword,
          location: location,
          api_key: serpApiKey
        }
      });

      const serpResults = serpRes.data.organic_results || [];
      const rank = serpResults.findIndex(r => r.link.includes(domain)) + 1;
      keywordScore = rank > 0 ? Math.max(0, 100 - (rank - 1) * 5) : 0;

      // Run SerpApi Index Coverage Check
      const indexRes = await axios.get('https://serpapi.com/search.json', {
        params: {
          q: `site:${domain}`,
          api_key: serpApiKey
        }
      });

      const totalIndexed = indexRes.data.search_information.total_results || 0;
      indexScore = totalIndexed >= 5 ? 100 : (totalIndexed / 5) * 100;
    }

    // Extract Core Web Vitals
    const audits = lighthouseResult.audits || {};
    const coreWebVitals = {
      LCP: audits['largest-contentful-paint']?.displayValue || null,
      TBT: audits['total-blocking-time']?.displayValue || null,
      CLS: audits['cumulative-layout-shift']?.displayValue || null
    };

    // Extract top 3 opportunities
    const opportunities = Object.values(audits)
      .filter(audit => audit.details && audit.details.type === 'opportunity' && audit.score !== 1)
      .map(audit => ({
        title: audit.title,
        displayValue: audit.displayValue
      }))
      .slice(0, 3);

    // Count passed audits (score === 1)
    const passedAuditsCount = Object.values(audits).filter(audit => audit.score === 1).length;

    // Calculate final score with normalized weights if SerpApi is missing
    let finalScore;
    if (useSerpApi) {
      // Use original logic (SEO 0.4, Performance 0.3, Keyword 0.2, Index 0.1)
      finalScore = (
        (seoScore * 0.4) +
        (performanceScore * 0.3) +
        (keywordScore * 0.2) +
        (indexScore * 0.1)
      ).toFixed(2);
    } else {
      // Use all four Lighthouse scores, normalize weights to sum to 1
      const wSEO = 0.3, wPerf = 0.3, wAcc = 0.2, wBP = 0.2;
      const totalWeight = wSEO + wPerf + wAcc + wBP;
      finalScore = (
        (seoScore * (wSEO / totalWeight)) +
        (performanceScore * (wPerf / totalWeight)) +
        (accessibilityScore * (wAcc / totalWeight)) +
        (bestPracticesScore * (wBP / totalWeight))
      ).toFixed(2);
    }

    console.log(`--- [END] Audit complete for: ${siteUrl} ---`);

    // Always return finalScore as base-10, rounded to one decimal place
    const finalScoreBase10 = (parseFloat(finalScore) / 10).toFixed(1);

    if (useSerpApi) {
      res.json({
        siteUrl,
        seoScore,
        performanceScore,
        accessibilityScore,
        bestPracticesScore,
        keywordScore,
        indexScore,
        finalScore: finalScoreBase10,
        coreWebVitals,
        topOpportunities: opportunities,
        passedAuditsCount
      });
    } else {
      res.json({
        siteUrl,
        seoScore,
        performanceScore,
        accessibilityScore,
        bestPracticesScore,
        finalScore: finalScoreBase10,
        coreWebVitals,
        topOpportunities: opportunities,
        passedAuditsCount
      });
    }

  } catch (err) {
    console.error('Audit failed:', err.message);
    res.status(500).json({ 
      error: 'Audit failed', 
      details: err.message, 
      siteUrl: siteUrl 
    });
  }
});

// Start API server
app.listen(PORT, () => {
  const localIp = getNetworkIp();
  console.log(`Combined SEO Audit API is running`);
  console.log(`Local:    http://localhost:${PORT}`);
  console.log(`Network:  http://${localIp}:${PORT}`);
});
