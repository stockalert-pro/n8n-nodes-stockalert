import {
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	NodeOperationError,
	NodeConnectionType,
} from 'n8n-workflow';

import { stockAlertApiRequest } from './GenericFunctions';

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
		outputs: [NodeConnectionType.Main],
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
					{
						name: 'Alert Created',
						value: 'alert.created',
						description: 'Fires when a new alert is created',
					},
					{
						name: 'Alert Updated',
						value: 'alert.updated',
						description: 'Fires when an alert is updated',
					},
					{
						name: 'Alert Deleted',
						value: 'alert.deleted',
						description: 'Fires when an alert is deleted',
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
						displayName: 'Filter by Symbol',
						name: 'filterSymbol',
						type: 'string',
						default: '',
						placeholder: 'AAPL,GOOGL,MSFT',
						description: 'Only trigger for specific symbols (comma-separated)',
					},
					{
						displayName: 'Filter by Condition',
						name: 'filterCondition',
						type: 'multiOptions',
						default: [],
						options: [
							{
								name: 'MA Death Cross',
								value: 'ma_crossover_death',
							},
							{
								name: 'MA Golden Cross',
								value: 'ma_crossover_golden',
							},
							{
								name: 'New High',
								value: 'new_high',
							},
							{
								name: 'New Low',
								value: 'new_low',
							},
							{
								name: 'Price Above',
								value: 'price_above',
							},
							{
								name: 'Price Below',
								value: 'price_below',
							},
							{
								name: 'Price Change Down',
								value: 'price_change_down',
							},
							{
								name: 'Price Change Up',
								value: 'price_change_up',
							},
							{
								name: 'RSI Limit',
								value: 'rsi_limit',
							},
							{
								name: 'Volume Change',
								value: 'volume_change',
							},
						],
						description: 'Only trigger for specific alert types',
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

		// Verify webhook signature if secret exists
		if (webhookData.webhookSecret && req.headers['x-stockalert-signature']) {
			const crypto = await import('crypto');
			const expectedSignature = crypto
				.createHmac('sha256', webhookData.webhookSecret as string)
				.update(JSON.stringify(req.body))
				.digest('hex');

			if (req.headers['x-stockalert-signature'] !== expectedSignature) {
				throw new NodeOperationError(
					this.getNode(),
					'Invalid webhook signature',
				);
			}
		}

		const payload = req.body as IDataObject;

		// Apply filters if configured
		if (options.filterSymbol) {
			const allowedSymbols = (options.filterSymbol as string)
				.split(',')
				.map(s => s.trim().toUpperCase());
			
			if (payload.data && (payload.data as IDataObject).symbol) {
				const eventSymbol = ((payload.data as IDataObject).symbol as string).toUpperCase();
				if (!allowedSymbols.includes(eventSymbol)) {
					// Don't trigger for this symbol
					return {
						workflowData: [],
					};
				}
			}
		}

		if (options.filterCondition && (options.filterCondition as string[]).length > 0) {
			if (payload.data && (payload.data as IDataObject).condition) {
				const eventCondition = (payload.data as IDataObject).condition as string;
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