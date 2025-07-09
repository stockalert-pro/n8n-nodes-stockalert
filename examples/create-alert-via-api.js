#!/usr/bin/env node

/**
 * Example: Create a StockAlert via n8n API
 * 
 * This example shows how to trigger an n8n workflow via API
 * that creates a stock alert using the StockAlert node.
 * 
 * Prerequisites:
 * 1. n8n instance running with StockAlert nodes installed
 * 2. A workflow with webhook trigger that creates alerts
 * 3. n8n API key (from Settings > API)
 */

const https = require('https');

// Configuration
const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || 'your-n8n-api-key';
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/webhook/stockalert-create';

// Alert configuration
const alertData = {
  symbol: 'AAPL',
  condition: 'price_above',
  threshold: 200,
  notification: 'email'
};

// Function to call n8n webhook
async function createAlertViaWebhook(data) {
  const url = new URL(WEBHOOK_PATH, N8N_URL);
  
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': N8N_API_KEY
    }
  };

  return new Promise((resolve, reject) => {
    const req = (url.protocol === 'https:' ? https : require('http')).request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

// Main execution
async function main() {
  console.log('Creating stock alert via n8n webhook...');
  console.log('Alert configuration:', alertData);
  
  try {
    const result = await createAlertViaWebhook(alertData);
    console.log('✅ Alert created successfully!');
    console.log('Response:', result);
  } catch (error) {
    console.error('❌ Failed to create alert:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for use in other scripts
module.exports = { createAlertViaWebhook };