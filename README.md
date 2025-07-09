# n8n-nodes-stockalert

This is an n8n community node that allows you to integrate [StockAlert.pro](https://stockalert.pro) with your n8n workflows.

StockAlert.pro is a real-time stock monitoring platform that sends notifications when your specified conditions are met.

## Installation

### Community Nodes

1. Go to **Settings > Community Nodes**
2. Search for `n8n-nodes-stockalert`
3. Click **Install**

### Manual Installation

```bash
npm install n8n-nodes-stockalert
```

## Authentication

You'll need a StockAlert.pro API key:

1. Sign up at [StockAlert.pro](https://stockalert.pro)
2. Go to Dashboard > Settings > API Keys (at the bottom of the page)
3. Create a new API key
4. Use this key in your n8n StockAlert credentials

## Features

### StockAlert Node
- **Create Alerts**: Set up price, technical, fundamental, and dividend alerts
- **List Alerts**: Get all your active alerts with filtering options
- **Get Alert**: Retrieve details of a specific alert
- **Update Alert**: Pause or activate alerts
- **Delete Alert**: Remove alerts you no longer need

### StockAlert Trigger Node
- **Real-time Events**: Receive webhook notifications when:
  - Alert is triggered
  - Alert is created
  - Alert is updated
  - Alert is deleted
- **Filtering**: Filter events by stock symbol or alert type

### Webhook Management
- **Create Webhooks**: Set up webhook endpoints
- **List Webhooks**: View all configured webhooks
- **Delete Webhooks**: Remove webhook configurations

## Alert Types Supported

### Price Alerts
- Price Above/Below threshold
- Price Change Up/Down by percentage
- New 52-week High/Low

### Technical Alerts
- Golden Cross (50-day MA crosses above 200-day MA)
- Death Cross (50-day MA crosses below 200-day MA)
- MA Touch Above/Below
- RSI Limit reached
- Volume Change

### Fundamental Alerts
- P/E Ratio Above/Below
- Forward P/E Above/Below
- Earnings Announcement

### Dividend Alerts
- Dividend Ex-Date
- Dividend Payment Date

### Time-based Alerts
- One-time Reminder
- Daily Reminder

## Example Workflows

We provide comprehensive workflow examples in the [`examples/`](examples/) directory:

### 📁 Available Examples

1. **[Price Alert Workflow](examples/1-price-alert-workflow.json)**
   - Basic price monitoring with email notifications
   - Alert creation, status checking, and management
   - Perfect for getting started

2. **[Technical Analysis Workflow](examples/2-technical-analysis-workflow.json)**
   - Automated technical indicators monitoring
   - Golden Cross, Death Cross, RSI alerts
   - Scheduled runs with Slack notifications

3. **[Webhook Integration Workflow](examples/3-webhook-integration-workflow.json)**
   - Real-time event processing
   - Multi-channel notifications (Slack, Discord)
   - Event logging to Google Sheets

4. **[Portfolio Monitoring Workflow](examples/4-portfolio-monitoring-workflow.json)**
   - Complete portfolio management solution
   - Multiple alert types per stock
   - Scheduled reports and Airtable logging

### 🚀 Quick Start

1. Import any example workflow into n8n
2. Configure your StockAlert API credentials
3. Customize stock symbols and thresholds
4. Activate the workflow

See the [examples README](examples/README.md) for detailed setup instructions.

## Example Usage

### Create a Price Alert
```javascript
{
  "symbol": "AAPL",
  "condition": "price_above",
  "threshold": 200,
  "notification": "email"
}
```

### Create an RSI Alert
```javascript
{
  "symbol": "TSLA",
  "condition": "rsi_limit",
  "threshold": 70,
  "notification": "sms",
  "parameters": {
    "direction": "above"
  }
}
```

### Create a Moving Average Alert
```javascript
{
  "symbol": "GOOGL",
  "condition": "ma_touch_below",
  "notification": "email",
  "parameters": {
    "period": 200
  }
}
```

## Resources

- [StockAlert.pro Documentation](https://stockalert.pro/api/docs)
- [API Reference](https://stockalert.pro/api/openapi)
- [n8n Community](https://community.n8n.io)

## Support

- **Issues**: [GitHub Issues](https://github.com/stockalert-pro/n8n-nodes-stockalert/issues)
- **Email**: support@stockalert.pro
- **Community**: [n8n Community Forum](https://community.n8n.io)

## License

[MIT](LICENSE.md)