import { createHmac, timingSafeEqual } from 'node:crypto';
import {
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	NodeOperationError,
} from 'n8n-workflow';

import { alertConditions, stockAlertApiRequest } from './GenericFunctions';

function signaturesMatch(
	payload: string,
	signature: string,
	secret: string,
): boolean {
	const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex');
	const providedBuffer = Buffer.from(signature, 'hex');
	const expectedBuffer = Buffer.from(expectedSignature, 'hex');

	return (
		providedBuffer.length === expectedBuffer.length &&
		timingSafeEqual(providedBuffer, expectedBuffer)
	);
}

export function verifyStockAlertWebhookSignature(
	payload: string,
	signature: string,
	secret: string,
	timestamp?: string,
): boolean {
	if (!payload || !signature || !secret) {
		return false;
	}

	const normalizedSignature = signature.startsWith('sha256=')
		? signature.slice(7)
		: signature;

	if (!/^[a-f0-9]+$/i.test(normalizedSignature)) {
		return false;
	}

	if (timestamp && signaturesMatch(`${timestamp}.${payload}`, normalizedSignature, secret)) {
		return true;
	}

	return signaturesMatch(payload, normalizedSignature, secret);
}

export class StockAlertTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'StockAlert Trigger',
		name: 'stockAlertTrigger',
		icon: 'file:stockalert.svg',
		group: ['trigger'],
		version: 1,
		description: 'Trigger workflows on StockAlert events',
		defaults: {
			name: 'StockAlert Trigger',
		},
		inputs: [],
		outputs: ['main'] as any,
		credentials: [
			{
				name: 'stockAlertApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: ['alert.triggered'],
				options: [
					{
						name: 'Alert Triggered',
						value: 'alert.triggered',
						description: 'Fires when an alert condition is met',
					},
				],
				description: 'The events to listen for',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Filter by Condition',
						name: 'filterCondition',
						type: 'multiOptions',
						default: [],
						options: alertConditions,
						description: 'Only trigger for specific alert types',
					},
					{
						displayName: 'Filter by Symbol',
						name: 'filterSymbol',
						type: 'string',
						default: '',
						placeholder: 'AAPL,GOOGL,MSFT',
						description: 'Only trigger for specific symbols (comma-separated)',
					},
					{
						displayName: 'Require Event Header',
						name: 'requireEventHeader',
						type: 'boolean',
						default: false,
						description: 'Whether to require the X-StockAlert-Event header to be present',
					},
					{
						displayName: 'Timestamp Tolerance (Minutes)',
						name: 'timestampTolerance',
						type: 'number',
						default: 10,
						description: 'Allowed clock skew for webhook timestamps',
						displayOptions: {
							show: {
								'/options.verifyTimestamp': [true],
							},
						},
					},
					{
						displayName: 'Verify Timestamp',
						name: 'verifyTimestamp',
						type: 'boolean',
						default: false,
						description: 'Whether to validate the X-StockAlert-Timestamp header within tolerance',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				// Check if webhook exists
				if (webhookData.webhookId) {
					try {
						const webhooks = await stockAlertApiRequest.call(
							this,
							'GET',
							'/webhooks',
						);

						const existingWebhook = webhooks.data.find(
							(webhook: IDataObject) => webhook.id === webhookData.webhookId,
						);

						if (existingWebhook) {
							return true;
						}
					} catch (error) {
						// Webhook might have been deleted
					}
				}

				// Webhook doesn't exist
				delete webhookData.webhookId;
				delete webhookData.webhookSecret;
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const events = this.getNodeParameter('events') as string[];
				const webhookData = this.getWorkflowStaticData('node');

				const body: IDataObject = {
					url: webhookUrl,
					events,
				};

				try {
					const response = await stockAlertApiRequest.call(
						this,
						'POST',
						'/webhooks',
						body,
					);

					if (response.data) {
						webhookData.webhookId = response.data.id;
						webhookData.webhookSecret = response.data.secret;
						return true;
					}
				} catch (error) {
					throw new NodeOperationError(
						this.getNode(),
						`Failed to create webhook: ${(error as Error).message}`,
					);
				}

				return false;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId) {
					try {
						await stockAlertApiRequest.call(
							this,
							'DELETE',
							`/webhooks/${webhookData.webhookId}`,
						);
						
						delete webhookData.webhookId;
						delete webhookData.webhookSecret;
						return true;
					} catch (error) {
						// If webhook is already deleted, we can ignore the error
						delete webhookData.webhookId;
						delete webhookData.webhookSecret;
						return true;
					}
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const webhookData = this.getWorkflowStaticData('node');
		const options = this.getNodeParameter('options') as IDataObject;
		const signatureHeader = Array.isArray(req.headers['x-stockalert-signature'])
			? req.headers['x-stockalert-signature'][0]
			: (req.headers['x-stockalert-signature'] as string | undefined);
		const timestampHeader = Array.isArray(req.headers['x-stockalert-timestamp'])
			? req.headers['x-stockalert-timestamp'][0]
			: (req.headers['x-stockalert-timestamp'] as string | undefined);

		// Verify webhook signature if secret exists (constant-time compare)
		if (webhookData.webhookSecret && signatureHeader) {
			const serializedPayload = JSON.stringify(req.body ?? {});
			const isValid = verifyStockAlertWebhookSignature(
				serializedPayload,
				signatureHeader,
				webhookData.webhookSecret as string,
				timestampHeader,
			);
			if (!isValid) {
				throw new NodeOperationError(this.getNode(), 'Invalid webhook signature');
			}
		}

		const payload = req.body as IDataObject;

		// Optional timestamp verification
		if (options.verifyTimestamp) {
			const toleranceMin = Number(options.timestampTolerance ?? 10);
			if (!timestampHeader) {
				throw new NodeOperationError(this.getNode(), 'Missing X-StockAlert-Timestamp header');
			}
			const ts = Date.parse(timestampHeader);
			if (Number.isNaN(ts)) {
				throw new NodeOperationError(this.getNode(), 'Invalid X-StockAlert-Timestamp header');
			}
			const toleranceMs = Math.max(1, toleranceMin) * 60 * 1000;
			if (Math.abs(Date.now() - ts) > toleranceMs) {
				throw new NodeOperationError(this.getNode(), 'Stale webhook timestamp');
			}
		}

		// Optional event header requirement
		if (options.requireEventHeader) {
			const ev = req.headers['x-stockalert-event'] as string | undefined;
			if (!ev) {
				throw new NodeOperationError(this.getNode(), 'Missing X-StockAlert-Event header');
			}
		}

		// Apply filters if configured
		if (options.filterSymbol) {
			const allowedSymbols = (options.filterSymbol as string)
				.split(',')
				.map(s => s.trim().toUpperCase());

			if (payload.data && (payload.data as IDataObject).alert) {
				const alert = (payload.data as IDataObject).alert as IDataObject;
				const eventSymbol = (alert.symbol as string).toUpperCase();
				if (!allowedSymbols.includes(eventSymbol)) {
					// Don't trigger for this symbol
					return {
						workflowData: [],
					};
				}
			}
		}

		if (options.filterCondition && (options.filterCondition as string[]).length > 0) {
			if (payload.data && (payload.data as IDataObject).alert) {
				const alert = (payload.data as IDataObject).alert as IDataObject;
				const eventCondition = alert.condition as string;
				if (!(options.filterCondition as string[]).includes(eventCondition)) {
					// Don't trigger for this condition
					return {
						workflowData: [],
					};
				}
			}
		}

		return {
			workflowData: [
				[
					{
						json: payload,
						headers: req.headers,
					},
				],
			],
		};
	}
}
