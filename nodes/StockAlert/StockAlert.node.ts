import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';

import {
	stockAlertApiRequest,
	stockAlertApiRequestAllItems,
	alertConditions,
} from './GenericFunctions';

export class StockAlert implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'StockAlert',
		name: 'stockAlert',
		icon: 'file:stockalert.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with StockAlert.pro API',
		defaults: {
			name: 'StockAlert',
		},
		inputs: ['main'] as any,
		outputs: ['main'] as any,
		credentials: [
			{
				name: 'stockAlertApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Alert',
						value: 'alert',
					},
					{
						name: 'Webhook',
						value: 'webhook',
					},
				],
				default: 'alert',
			},
			// Alert operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['alert'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new alert',
						action: 'Create an alert',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete an alert',
						action: 'Delete an alert',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get an alert by ID',
						action: 'Get an alert',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many alerts',
						action: 'Get many alerts',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update an alert status',
						action: 'Update an alert',
					},
				],
				default: 'create',
			},
			// Webhook operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['webhook'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new webhook',
						action: 'Create a webhook',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a webhook',
						action: 'Delete a webhook',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many webhooks',
						action: 'Get many webhooks',
					},
				],
				default: 'create',
			},
			// Alert Create Fields
			{
				displayName: 'Alert Type',
				name: 'condition',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['alert'],
						operation: ['create'],
					},
				},
				options: alertConditions,
				default: 'price_above',
				description: 'Type of alert to create',
			},
			// Dynamic fields based on alert type
			{
				displayName: 'Alert Configuration',
				name: 'alertConfig',
				type: 'collection',
				placeholder: 'Configure Alert',
				default: {},
				displayOptions: {
					show: {
						resource: ['alert'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'MA Period',
						name: 'maPeriod',
						type: 'options',
						default: 50,
						options: [
							{
								name: '50-Day MA',
								value: 50,
							},
							{
								name: '200-Day MA',
								value: 200,
							},
						],
						displayOptions: {
							show: {
								'/condition': ['ma_touch_above', 'ma_touch_below'],
							},
						},
					},
					{
						displayName: 'Notification Channel',
						name: 'notification',
						type: 'options',
						default: 'email',
						options: [
							{
								name: 'Email',
								value: 'email',
							},
							{
								name: 'SMS',
								value: 'sms',
							},
						],
					},
					{
						displayName: 'RSI Direction',
						name: 'rsiDirection',
						type: 'options',
						default: 'above',
						options: [
							{
								name: 'Above',
								value: 'above',
							},
							{
								name: 'Below',
								value: 'below',
							},
						],
						displayOptions: {
							show: {
								'/condition': ['rsi_limit'],
							},
						},
					},
					{
						displayName: 'Stock Symbol',
						name: 'symbol',
						type: 'string',
						default: '',
						placeholder: 'AAPL',
						description: 'Stock ticker symbol',
					},
					{
						displayName: 'Threshold',
						name: 'threshold',
						type: 'number',
						default: 0,
						description: 'Target value for the alert',
						displayOptions: {
							show: {
								'/condition': [
									'price_above',
									'price_below',
									'price_change_up',
									'price_change_down',
									'volume_change',
									'rsi_limit',
									'pe_ratio_below',
									'pe_ratio_above',
									'forward_pe_below',
									'forward_pe_above',
								],
							},
						},
					},
				],
			},
			// Alert ID fields
			{
				displayName: 'Alert ID',
				name: 'alertId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['alert'],
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'The ID of the alert',
			},
			// Alert Update fields
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['alert'],
						operation: ['update'],
					},
				},
				options: [
					{
						name: 'Active',
						value: 'active',
					},
					{
						name: 'Paused',
						value: 'paused',
					},
				],
				default: 'active',
				description: 'New status for the alert',
			},
			// Alert Get Many fields
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['alert'],
						operation: ['getAll'],
					},
				},
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['alert'],
						operation: ['getAll'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: {
						resource: ['alert'],
						operation: ['getAll'],
					},
				},
				options: [
					{
						displayName: 'Alert Type',
						name: 'condition',
						type: 'options',
						default: '',
						options: [
							{
								name: 'All',
								value: '',
							},
							...alertConditions,
						],
					},
					{
						displayName: 'Search',
						name: 'search',
						type: 'string',
						default: '',
						description: 'Search by symbol or company name',
					},
					{
						displayName: 'Sort Direction',
						name: 'sortDirection',
						type: 'options',
						default: 'desc',
						options: [
							{
								name: 'Ascending',
								value: 'asc',
							},
							{
								name: 'Descending',
								value: 'desc',
							},
						],
					},
					{
						displayName: 'Sort Field',
						name: 'sortField',
						type: 'options',
						default: 'created_at',
						options: [
							{
								name: 'Created Date',
								value: 'created_at',
							},
							{
								name: 'Symbol',
								value: 'symbol',
							},
							{
								name: 'Status',
								value: 'status',
							},
						],
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						default: '',
						options: [
							{
								name: 'All',
								value: '',
							},
							{
								name: 'Active',
								value: 'active',
							},
							{
								name: 'Paused',
								value: 'paused',
							},
							{
								name: 'Triggered',
								value: 'triggered',
							},
						],
					},
				],
			},
			// Webhook Create fields
			{
				displayName: 'Webhook URL',
				name: 'webhookUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['create'],
					},
				},
				default: '',
				placeholder: 'https://your-app.com/webhook',
				description: 'URL to receive webhook notifications',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['create'],
					},
				},
				options: [
					{
						name: 'Alert Triggered',
						value: 'alert.triggered',
						description: 'When an alert condition is met',
					},
					{
						name: 'Alert Created',
						value: 'alert.created',
						description: 'When a new alert is created',
					},
					{
						name: 'Alert Updated',
						value: 'alert.updated',
						description: 'When an alert is updated',
					},
					{
						name: 'Alert Deleted',
						value: 'alert.deleted',
						description: 'When an alert is deleted',
					},
				],
				default: ['alert.triggered'],
				description: 'Events that trigger the webhook',
			},
			// Webhook ID field
			{
				displayName: 'Webhook ID',
				name: 'webhookId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['delete'],
					},
				},
				description: 'The ID of the webhook to delete',
			},
			// Webhook Get Many
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['getAll'],
					},
				},
				default: true,
				description: 'Whether to return all results or only up to a given limit',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'alert') {
					if (operation === 'create') {
						const condition = this.getNodeParameter('condition', i) as string;
						const config = this.getNodeParameter('alertConfig', i) as IDataObject;
						
						const body: IDataObject = {
							symbol: config.symbol as string,
							condition,
							notification: config.notification || 'email',
						};

						// Add threshold if needed
						if (config.threshold !== undefined) {
							body.threshold = config.threshold as number;
						}

						// Add parameters for specific alert types
						const parameters: IDataObject = {};
						if (condition === 'ma_touch_above' || condition === 'ma_touch_below') {
							if (config.maPeriod) {
								parameters.period = config.maPeriod;
							}
						} else if (condition === 'rsi_limit') {
							if (config.rsiDirection) {
								parameters.direction = config.rsiDirection;
							}
						}

						if (Object.keys(parameters).length > 0) {
							body.parameters = parameters;
						}

						const response = await stockAlertApiRequest.call(
							this,
							'POST',
							'/alerts',
							body,
						);

						returnData.push(response.data as IDataObject);
					}
					
					else if (operation === 'get') {
						const alertId = this.getNodeParameter('alertId', i) as string;
						
						const response = await stockAlertApiRequest.call(
							this,
							'GET',
							`/alerts/${alertId}`,
						);

						returnData.push(response.data as IDataObject);
					}
					
					else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i) as IDataObject;
						
						const qs: IDataObject = {};
						
						if (!returnAll) {
							qs.limit = this.getNodeParameter('limit', i) as number;
						}
						
						// Apply filters
						if (filters.status) {
							qs.status = filters.status;
						}
						if (filters.condition) {
							qs.condition = filters.condition;
						}
						if (filters.search) {
							qs.search = filters.search;
						}
						if (filters.sortField) {
							qs.sortField = filters.sortField;
						}
						if (filters.sortDirection) {
							qs.sortDirection = filters.sortDirection;
						}

						let responseData;
						if (returnAll) {
							responseData = await stockAlertApiRequestAllItems.call(
								this,
								'GET',
								'/alerts',
								{},
								qs,
							);
						} else {
							const response = await stockAlertApiRequest.call(
								this,
								'GET',
								'/alerts',
								{},
								qs,
							);
							responseData = response.data;
						}

						if (Array.isArray(responseData)) {
							returnData.push(...responseData);
						} else {
							returnData.push(responseData);
						}
					}
					
					else if (operation === 'update') {
						const alertId = this.getNodeParameter('alertId', i) as string;
						const status = this.getNodeParameter('status', i) as string;
						
						const body: IDataObject = {
							status,
						};

						const response = await stockAlertApiRequest.call(
							this,
							'PUT',
							`/alerts/${alertId}`,
							body,
						);

						returnData.push(response.data as IDataObject);
					}
					
					else if (operation === 'delete') {
						const alertId = this.getNodeParameter('alertId', i) as string;
						
						const response = await stockAlertApiRequest.call(
							this,
							'DELETE',
							`/alerts/${alertId}`,
						);

						returnData.push({
							success: true,
							message: response.message || 'Alert deleted successfully',
						});
					}
				}
				
				else if (resource === 'webhook') {
					if (operation === 'create') {
						const url = this.getNodeParameter('webhookUrl', i) as string;
						const events = this.getNodeParameter('events', i) as string[];
						
						const body: IDataObject = {
							url,
							events,
						};

						const response = await stockAlertApiRequest.call(
							this,
							'POST',
							'/webhooks',
							body,
						);

						returnData.push(response.data as IDataObject);
					}
					
					else if (operation === 'getAll') {
						const response = await stockAlertApiRequest.call(
							this,
							'GET',
							'/webhooks',
						);

						if (Array.isArray(response.data)) {
							returnData.push(...response.data);
						} else {
							returnData.push(response.data as IDataObject);
						}
					}
					
					else if (operation === 'delete') {
						const webhookId = this.getNodeParameter('webhookId', i) as string;
						
						await stockAlertApiRequest.call(
							this,
							'DELETE',
							`/webhooks/${webhookId}`,
						);

						returnData.push({
							success: true,
							message: 'Webhook deleted successfully',
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: (error as Error).message });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}