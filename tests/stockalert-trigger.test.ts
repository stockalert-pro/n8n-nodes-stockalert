import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { alertConditions } from '../nodes/StockAlert/GenericFunctions';
import {
  StockAlertTrigger,
  verifyStockAlertWebhookSignature,
} from '../nodes/StockAlert/StockAlertTrigger.node';

describe('StockAlertTrigger', () => {
  it('exposes the full alert condition list in trigger filters', () => {
    const trigger = new StockAlertTrigger();
    const optionsField = trigger.description.properties.find((property) => property.name === 'options');
    const filterCondition = optionsField?.options?.find((option) => option.name === 'filterCondition');
    const values = filterCondition?.options?.map((option) => option.value);

    expect(values).toEqual(alertConditions.map((condition) => condition.value));
  });

  it('supports legacy and timestamped signatures when a timestamp header is present', async () => {
    const payload = {
      event: 'alert.triggered',
      data: {
        alert: {
          id: 'alert_1',
          symbol: 'AAPL',
          condition: 'price_above',
        },
      },
    };
    const serializedPayload = JSON.stringify(payload);
    const secret = 'webhook_secret';
    const timestamp = new Date().toISOString();
    const timestampedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${serializedPayload}`)
      .digest('hex');
    const legacySignature = crypto.createHmac('sha256', secret).update(serializedPayload).digest('hex');

    expect(
      verifyStockAlertWebhookSignature(serializedPayload, timestampedSignature, secret, timestamp),
    ).toBe(true);
    expect(
      verifyStockAlertWebhookSignature(
        serializedPayload,
        `sha256=${timestampedSignature}`,
        secret,
        timestamp,
      ),
    ).toBe(true);
    expect(verifyStockAlertWebhookSignature(serializedPayload, legacySignature, secret, timestamp)).toBe(
      true,
    );

    const trigger = new StockAlertTrigger();
    const response = await trigger.webhook.call({
      getRequestObject: () => ({
        headers: {
          'x-stockalert-signature': legacySignature,
          'x-stockalert-timestamp': timestamp,
        },
        body: payload,
      }),
      getWorkflowStaticData: () => ({ webhookSecret: secret }),
      getNodeParameter: () => ({ verifyTimestamp: true, timestampTolerance: 10 }),
      getNode: () => ({}),
    } as any);

    expect(response.workflowData[0][0].json).toEqual(payload);
  });

  it('accepts timestamped webhook headers with the canonical sha256= prefix', async () => {
    const payload = {
      event: 'alert.triggered',
      data: {
        alert: {
          id: 'alert_2',
          symbol: 'MSFT',
          condition: 'price_below',
        },
      },
    };
    const serializedPayload = JSON.stringify(payload);
    const secret = 'webhook_secret';
    const timestamp = new Date().toISOString();
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${serializedPayload}`)
      .digest('hex');

    const trigger = new StockAlertTrigger();
    const response = await trigger.webhook.call({
      getRequestObject: () => ({
        headers: {
          'x-stockalert-signature': `sha256=${signature}`,
          'x-stockalert-timestamp': timestamp,
        },
        body: payload,
      }),
      getWorkflowStaticData: () => ({ webhookSecret: secret }),
      getNodeParameter: () => ({ verifyTimestamp: true, timestampTolerance: 10 }),
      getNode: () => ({}),
    } as any);

    expect(response.workflowData[0][0].json).toEqual(payload);
  });
});
