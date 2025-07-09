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
        
        // Handle different event types
        switch (payload.event) {
          case 'alert.triggered':
            handleAlertTriggered(payload.data);
            break;
          case 'alert.created':
            handleAlertCreated(payload.data);
            break;
          case 'alert.updated':
            handleAlertUpdated(payload.data);
            break;
          case 'alert.deleted':
            handleAlertDeleted(payload.data);
            break;
          default:
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

// Event handlers
function handleAlertTriggered(data) {
  console.log(`
🚨 ALERT TRIGGERED!
Symbol: ${data.symbol}
Condition: ${data.condition}
Threshold: ${data.threshold}
Current Value: ${data.current_value}
Triggered At: ${data.triggered_at}
  `);
  
  // Add your custom logic here
  // e.g., send notification, update database, trigger automation
}

function handleAlertCreated(data) {
  console.log(`✅ New alert created for ${data.symbol}`);
}

function handleAlertUpdated(data) {
  console.log(`📝 Alert updated for ${data.symbol}`);
}

function handleAlertDeleted(data) {
  console.log(`🗑️ Alert deleted: ${data.alert_id}`);
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