import { describe, expect, it, vi } from 'vitest';
import { StockAlert } from '../nodes/StockAlert/StockAlert.node';

function createExecuteContext(parameters: Record<string, unknown>) {
  const httpRequestWithAuthentication = vi.fn().mockResolvedValue({ data: { id: 'alert_1' } });

  return {
    context: {
      getInputData: () => [{}],
      getNodeParameter: (name: string) => parameters[name],
      getCredentials: vi.fn().mockResolvedValue({ environment: 'production' }),
      helpers: {
        httpRequestWithAuthentication,
        returnJsonArray: (data: unknown[]) => data,
      },
      getNode: () => ({}),
      continueOnFail: () => false,
    },
    httpRequestWithAuthentication,
  };
}

describe('StockAlert node execute', () => {
  it('serializes current create parameters for insider transaction alerts', async () => {
    const node = new StockAlert();
    const { context, httpRequestWithAuthentication } = createExecuteContext({
      resource: 'alert',
      operation: 'create',
      condition: 'insider_transactions',
      alertConfig: {
        symbol: 'NVDA',
        notification: 'email',
        threshold: 250000,
        insiderDirection: 'buy',
        minExecutives: 2,
        windowDays: 30,
        openMarketOnly: true,
      },
    });

    await node.execute.call(context as any);

    expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
      'stockAlertApi',
      expect.objectContaining({
        method: 'POST',
        url: 'https://stockalert.pro/api/v1/alerts',
        body: {
          symbol: 'NVDA',
          condition: 'insider_transactions',
          notification: 'email',
          threshold: 250000,
          parameters: {
            direction: 'buy',
            minExecutives: 2,
            windowDays: 30,
            openMarketOnly: true,
          },
        },
      }),
    );
  });

  it('serializes deliveryTime for daily reminder alerts', async () => {
    const node = new StockAlert();
    const { context, httpRequestWithAuthentication } = createExecuteContext({
      resource: 'alert',
      operation: 'create',
      condition: 'daily_reminder',
      alertConfig: {
        symbol: 'MSFT',
        notification: 'email',
        deliveryTime: 'after_market_close',
      },
    });

    await node.execute.call(context as any);

    expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
      'stockAlertApi',
      expect.objectContaining({
        body: {
          symbol: 'MSFT',
          condition: 'daily_reminder',
          notification: 'email',
          parameters: {
            deliveryTime: 'after_market_close',
          },
        },
      }),
    );
  });

  it('maps current query parameter names for alert list filters', async () => {
    const node = new StockAlert();
    const { context, httpRequestWithAuthentication } = createExecuteContext({
      resource: 'alert',
      operation: 'getAll',
      returnAll: false,
      limit: 25,
      filters: {
        status: 'active',
        condition: 'daily_reminder',
        search: 'msft',
        sortField: 'created_at',
        sortDirection: 'asc',
      },
    });

    await node.execute.call(context as any);

    expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
      'stockAlertApi',
      expect.objectContaining({
        method: 'GET',
        url: 'https://stockalert.pro/api/v1/alerts',
        qs: {
          limit: 25,
          status: 'active',
          condition: 'daily_reminder',
          search: 'msft',
          sort_field: 'created_at',
          sort_direction: 'asc',
        },
      }),
    );
  });
});
