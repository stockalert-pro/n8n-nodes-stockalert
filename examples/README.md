# StockAlert.pro n8n Workflow Examples

This directory contains example workflows demonstrating various use cases for the StockAlert.pro n8n nodes.

## Available Examples

### 1. Price Alert Workflow (`1-price-alert-workflow.json`)
A basic workflow that demonstrates:
- Creating a price alert for AAPL stock
- Fetching active alerts
- Checking if alerts have been triggered
- Pausing triggered alerts
- Sending email notifications when alerts trigger

**Use Case**: Monitor specific stock prices and get notified when they cross your defined thresholds.

### 2. Technical Analysis Workflow (`2-technical-analysis-workflow.json`)
An advanced workflow that runs every 4 hours and:
- Creates multiple technical indicators alerts for a list of stocks
- Sets up Golden Cross (MA50/MA200) alerts
- Monitors RSI overbought (>70) and oversold (<30) conditions
- Sends notifications to Slack
- Handles errors gracefully

**Use Case**: Automated technical analysis monitoring for multiple stocks with team notifications.

### 3. Webhook Integration Workflow (`3-webhook-integration-workflow.json`)
A comprehensive webhook setup that:
- Registers webhooks with StockAlert.pro
- Receives and validates webhook notifications
- Routes events based on type (triggered, created, updated)
- Logs events to Google Sheets
- Sends formatted notifications to Slack and Discord
- Includes security validation

**Use Case**: Real-time integration with StockAlert.pro events for multi-channel notifications and logging.

### 4. Portfolio Monitoring Workflow (`4-portfolio-monitoring-workflow.json`)
A portfolio management workflow that:
- Runs during market hours (10 AM and 2 PM on weekdays)
- Reads portfolio from Google Sheets
- Creates multiple alert types for each stock:
  - 5% price drop alerts
  - 50% volume spike alerts
  - 52-week high alerts
  - Earnings announcement alerts
- Aggregates results and sends summary reports
- Logs monitoring data to Airtable

**Use Case**: Comprehensive portfolio monitoring with automated alert creation and reporting.

## How to Use These Workflows

1. **Import the Workflow**:
   - Open your n8n instance
   - Go to the workflows page
   - Click "Import" and select the JSON file

2. **Configure Credentials**:
   - StockAlert API: Add your API key from StockAlert.pro
   - SMTP: Configure email settings for notifications
   - Slack/Discord: Add OAuth tokens if using these integrations
   - Google Sheets: Authenticate with Google if using spreadsheet features

3. **Customize the Workflow**:
   - Update stock symbols to match your watchlist
   - Adjust alert thresholds to your preferences
   - Modify notification channels and messages
   - Set appropriate schedule triggers

## Tips

- Always test workflows with a single stock first before scaling up
- Use the "Continue On Fail" option for non-critical nodes
- Monitor your API usage to stay within StockAlert.pro limits
- Consider using environment variables for sensitive data
- Enable workflow error notifications in n8n settings

## Required Credentials

Most workflows require:
- **StockAlert API**: Get your API key from [StockAlert.pro](https://stockalert.pro/api)
- **SMTP**: For email notifications
- **Slack API** (optional): For Slack notifications
- **Google Sheets OAuth2** (optional): For spreadsheet integration
- **Discord OAuth2** (optional): For Discord notifications

## Support

For questions about these workflows:
- n8n documentation: https://docs.n8n.io
- StockAlert.pro API docs: https://stockalert.pro/api
- GitHub issues: https://github.com/stockalert-pro/n8n-nodes-stockalert/issues