# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an n8n community node package for integrating StockAlert.pro with n8n workflows. The package provides two nodes:
- **StockAlert Node**: For CRUD operations on alerts and webhooks
- **StockAlert Trigger Node**: For receiving webhook events

## Development Commands

```bash
# Install dependencies
npm install

# Build the project (compiles TypeScript and copies icons)
npm run build

# Development mode with watch
npm run dev
# or
npm run watch

# Run linter
npm run lint

# Fix linting issues
npm run lintfix

# Format code
npm run format

# Prepare for publishing (build + lint)
npm run prepublishOnly
```

## Architecture Overview

### Core Structure
- `nodes/StockAlert/StockAlert.node.ts`: Main node for API operations (1000+ lines)
- `nodes/StockAlert/StockAlertTrigger.node.ts`: Webhook trigger node implementation
- `nodes/StockAlert/GenericFunctions.ts`: Shared utilities including `stockAlertApiRequest()` function and alert type definitions
- `credentials/StockAlertApi.credentials.ts`: API authentication credential type

### Alert Types Architecture
The node supports 22 public alert types defined in `GenericFunctions.ts`:
- Price alerts (above, below, change up/down, 52-week high/low)
- Technical alerts (golden cross, death cross, MA touch, RSI, volume)
- Fundamental alerts (P/E ratio, forward P/E, earnings, insider transactions)
- Dividend alerts (ex-date, payment date)
- Time-based alerts (one-time, daily reminders)

Each alert type has specific condition fields defined in the `alertConditionFields` constant.

### API Integration
- Base URL: `https://stockalert.pro/api/v1`
- Authentication: API key via `stockAlertApi` credentials (X-API-Key header)
- Supports custom instance URLs for development/testing
- All responses use envelope format: `{ success, data, meta }` with `meta.rate_limit` and `meta.pagination.total_pages`

### n8n-specific Considerations
- Uses CommonJS module format for n8n compatibility
- Follows n8n node development conventions
- Type assertions required for connection compatibility (known linter/TypeScript conflict)
- Dynamic crypto import required: `const crypto = await import('crypto')`

## Testing Approach
- Unit tests cover helper logic and alert field generation via Vitest
- Manual testing via example workflows in `/examples/`
- Test credentials endpoint available in API configuration
- ESLint ensures code quality

## Publishing Process
```bash
# Login to npm
npm login

# Publish to npm
npm publish

# Submit to n8n community
# Create PR at https://github.com/n8n-io/n8n-nodes-community
```

## Important Implementation Details

### Webhook Signature Verification
The trigger node implements webhook signature verification using HMAC-SHA256. The verification logic is in `StockAlertTrigger.node.ts`.

### Error Handling
All API requests use try-catch with `NodeApiError` for consistent error reporting in n8n.

### Type Safety
Full TypeScript implementation with strict mode enabled. Some `as any` type assertions are necessary due to n8n's connection type requirements.

## Related Repositories
- Main StockAlert.pro repository contains the OpenAPI spec at `/app/(marketing)/api/openapi/openapi.yaml`
- Alert types are defined in main repo at `/lib/config/alerts.ts`
- When the API changes, update order: OpenAPI → JS-SDK → Python-SDK → n8n-Integration
