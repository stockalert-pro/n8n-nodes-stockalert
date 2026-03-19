import { describe, expect, it, vi } from 'vitest';
import {
  alertConditions,
  getAlertConditionFields,
  stockAlertApiRequestAllItems,
} from '../nodes/StockAlert/GenericFunctions';

describe('GenericFunctions', () => {
  it('paginates using total_pages metadata', async () => {
    const httpRequestWithAuthentication = vi
      .fn()
      .mockResolvedValueOnce({
        data: [{ id: '1' }],
        meta: { pagination: { page: 1, total_pages: 2 } },
      })
      .mockResolvedValueOnce({
        data: [{ id: '2' }],
        meta: { pagination: { page: 2, total_pages: 2 } },
      });

    const context = {
      getCredentials: vi.fn().mockResolvedValue({ environment: 'production' }),
      helpers: { httpRequestWithAuthentication },
    };

    const result = await stockAlertApiRequestAllItems.call(
      context as any,
      'GET',
      '/alerts'
    );

    expect(result).toEqual([{ id: '1' }, { id: '2' }]);
    expect(httpRequestWithAuthentication).toHaveBeenCalledTimes(2);
  });

  it('exposes insider_transactions in alert conditions', () => {
    expect(alertConditions.some((condition) => condition.value === 'insider_transactions')).toBe(
      true
    );
  });

  it('returns current parameter fields for daily reminders and insider alerts', () => {
    const dailyReminderFields = getAlertConditionFields('daily_reminder');
    const insiderFields = getAlertConditionFields('insider_transactions');

    expect(dailyReminderFields.some((field) => field.name === 'parameters')).toBe(true);
    expect(insiderFields.some((field) => field.name === 'threshold')).toBe(true);
    expect(insiderFields.some((field) => field.name === 'parameters')).toBe(true);
  });
});
