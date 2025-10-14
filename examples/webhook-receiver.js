#!/usr/bin/env node

/**
 * Example: Webhook Receiver for StockAlert Events
 * 
 * This example shows how to receive and process webhooks
 * from StockAlert.pro in your own application.
 * 
 * Use this as a starting point for building custom
 * integrations with StockAlert.pro webhooks.
 */

const http = require('http');
const crypto = require('crypto');

// Configuration
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret';

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        // Parse the webhook payload
        const payload = JSON.parse(body);
        
        // Verify webhook signature (if provided)
        const signature = req.headers['x-stockalert-signature'];
        if (signature && WEBHOOK_SECRET) {
          const expectedSignature = crypto
            .createHmac('sha256', WEBHOOK_SECRET)
            .update(body)
            .digest('hex');
          
          if (signature !== expectedSignature) {
            console.error('❌ Invalid webhook signature');
            res.writeHead(401);
            res.end('Unauthorized');
            return;
          }
        }
        
        // Process the webhook event
        console.log('📨 Received webhook event:', payload.event);
        console.log('Timestamp:', payload.timestamp);
        console.log('Data:', JSON.stringify(payload.data, null, 2));
        
        // Handle the event (currently only 'alert.triggered' is supported)
        if (payload.event === 'alert.triggered') {
          handleAlertTriggered(payload.data);
        } else {
          console.log('Unknown event type:', payload.event);
        }
        
        // Send success response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        
      } catch (error) {
        console.error('Error processing webhook:', error);
        res.writeHead(400);
        res.end('Bad Request');
      }
    });
  } else {
    // Health check endpoint
    if (req.url === '/health') {
      res.writeHead(200);
      res.end('OK');
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }
});

// Event handler for alert.triggered
function handleAlertTriggered(data) {
  const alert = data.alert;
  const stock = data.stock;

  console.log(`
🚨 ALERT TRIGGERED!
Symbol: ${alert.symbol}
Condition: ${alert.condition}
Threshold: ${alert.threshold || 'N/A'}
Current Price: ${stock.price}
Change: ${stock.change_percent ? stock.change_percent + '%' : 'N/A'}
Status: ${alert.status}
  `);

  // Add your custom logic here
  // e.g., send notification, update database, trigger automation
}

// Start server
server.listen(PORT, () => {
  console.log(`
🚀 StockAlert Webhook Receiver
Listening on http://localhost:${PORT}
Webhook endpoint: http://localhost:${PORT}/webhook
Health check: http://localhost:${PORT}/health

Configure this URL in StockAlert.pro or n8n:
- For local testing: Use ngrok or similar service
- For production: Use your public domain
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});