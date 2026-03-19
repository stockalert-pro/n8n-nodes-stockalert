import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	IDataObject,
	INodeProperties,
	NodeApiError,
	JsonObject,
} from 'n8n-workflow';

export async function stockAlertApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<any> {
	const credentials = await this.getCredentials('stockAlertApi');
	
	const environment = credentials.environment as string;
	const baseUrl = environment === 'production' 
		? 'https://stockalert.pro' 
		: credentials.customUrl as string;

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}/api/v1${endpoint}`,
		json: true,
		body,
		qs,
	};

	if (Object.keys(body).length === 0) {
		delete options.body;
	}

	if (Object.keys(qs).length === 0) {
		delete options.qs;
	}

	try {
		return await this.helpers.httpRequestWithAuthentication.call(
			this,
			'stockAlertApi',
			options,
		);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function stockAlertApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<any> {
	const returnData: IDataObject[] = [];
	let responseData;
	let page = 1;

	do {
		qs.page = page;
		qs.limit = 100; // Maximum allowed by API

		responseData = await stockAlertApiRequest.call(this, method, endpoint, body, qs);

		if (responseData.data && Array.isArray(responseData.data)) {
			returnData.push(...responseData.data);
		}

		page++;
	} while (
		responseData.meta?.pagination &&
		responseData.meta.pagination.page <
			(responseData.meta.pagination.total_pages ?? responseData.meta.pagination.totalPages ?? 1)
	);

	return returnData;
}

export const alertConditions = [
	// Price Alerts
	{
		name: 'Price Above',
		value: 'price_above',
		description: 'Triggers when price goes above threshold',
	},
	{
		name: 'Price Below',
		value: 'price_below',
		description: 'Triggers when price falls below threshold',
	},
	{
		name: 'Price Change Up (%)',
		value: 'price_change_up',
		description: 'Triggers when price increases by percentage',
	},
	{
		name: 'Price Change Down (%)',
		value: 'price_change_down',
		description: 'Triggers when price decreases by percentage',
	},
	{
		name: 'New 52-Week High',
		value: 'new_high',
		description: 'Triggers when stock hits new 52-week high',
	},
	{
		name: 'New 52-Week Low',
		value: 'new_low',
		description: 'Triggers when stock hits new 52-week low',
	},
	// Time Alerts
	{
		name: 'One-Time Reminder',
		value: 'reminder',
		description: 'Sends a single reminder notification',
	},
	{
		name: 'Daily Reminder',
		value: 'daily_reminder',
		description: 'Sends daily notifications with stock info',
	},
	// Technical Alerts
	{
		name: 'Golden Cross (MA)',
		value: 'ma_crossover_golden',
		description: '50-day MA crosses above 200-day MA',
	},
	{
		name: 'Death Cross (MA)',
		value: 'ma_crossover_death',
		description: '50-day MA crosses below 200-day MA',
	},
	{
		name: 'MA Touch Above',
		value: 'ma_touch_above',
		description: 'Price touches moving average from below',
	},
	{
		name: 'MA Touch Below',
		value: 'ma_touch_below',
		description: 'Price touches moving average from above',
	},
	{
		name: 'RSI Limit',
		value: 'rsi_limit',
		description: 'RSI reaches specified threshold',
	},
	// Volume Alerts
	{
		name: 'Volume Change',
		value: 'volume_change',
		description: 'Volume changes by specified percentage',
	},
	// Fundamental Alerts
	{
		name: 'P/E Ratio Below',
		value: 'pe_ratio_below',
		description: 'P/E ratio falls below threshold',
	},
	{
		name: 'P/E Ratio Above',
		value: 'pe_ratio_above',
		description: 'P/E ratio rises above threshold',
	},
	{
		name: 'Forward P/E Below',
		value: 'forward_pe_below',
		description: 'Forward P/E falls below threshold',
	},
	{
		name: 'Forward P/E Above',
		value: 'forward_pe_above',
		description: 'Forward P/E rises above threshold',
	},
	{
		name: 'Earnings Announcement',
		value: 'earnings_announcement',
		description: 'Notification before earnings release',
	},
	// Dividend Alerts
	{
		name: 'Dividend Ex-Date',
		value: 'dividend_ex_date',
		description: 'Notification before ex-dividend date',
	},
	{
		name: 'Dividend Payment',
		value: 'dividend_payment',
		description: 'Notification on dividend payment date',
	},
	{
		name: 'Insider Transactions',
		value: 'insider_transactions',
		description: 'Alert on insider buys or sells above a minimum value',
	},
];

export function getAlertConditionFields(condition: string): INodeProperties[] {
	const commonFields: INodeProperties[] = [
		{
			displayName: 'Stock Symbol',
			name: 'symbol',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'AAPL',
			description: 'Stock ticker symbol (e.g., AAPL, GOOGL, MSFT)',
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
					description: 'SMS to account phone number',
				},
			],
		},
	];

	const thresholdField: INodeProperties = {
		displayName: 'Threshold',
		name: 'threshold',
		type: 'number',
		default: 0,
		required: true,
		description: 'Target value for the alert',
	};

	const percentageField: INodeProperties = {
		displayName: 'Percentage',
		name: 'threshold',
		type: 'number',
		default: 5,
		required: true,
		description: 'Percentage change threshold',
		typeOptions: {
			minValue: 0.01,
			maxValue: 100,
		},
	};

	switch (condition) {
		case 'price_above':
		case 'price_below':
			return [...commonFields, thresholdField];
		
		case 'price_change_up':
		case 'price_change_down':
		case 'volume_change':
			return [...commonFields, percentageField];
		
		case 'new_high':
		case 'new_low':
		case 'ma_crossover_golden':
		case 'ma_crossover_death':
			return commonFields;

		case 'reminder':
		case 'earnings_announcement':
		case 'dividend_ex_date':
			return [...commonFields, thresholdField];

		case 'dividend_payment':
			return [
				...commonFields,
				{
					displayName: 'Additional Parameters',
					name: 'parameters',
					type: 'collection',
					placeholder: 'Add Parameter',
					default: {},
					options: [
						{
							displayName: 'Shares',
							name: 'shares',
							type: 'number',
							default: 1,
						},
					],
				},
			];
		
		case 'ma_touch_above':
		case 'ma_touch_below':
			return [...commonFields, thresholdField];
		
		case 'rsi_limit':
			return [
				...commonFields,
				thresholdField,
				{
					displayName: 'Additional Parameters',
					name: 'parameters',
					type: 'collection',
					placeholder: 'Add Parameter',
					default: {},
					options: [
						{
							displayName: 'Direction',
							name: 'direction',
							type: 'options',
							default: 'both',
							options: [
								{
									name: 'Up',
									value: 'up',
								},
								{
									name: 'Down',
									value: 'down',
								},
								{
									name: 'Both',
									value: 'both',
								},
							],
						},
					],
				},
			];

		case 'daily_reminder':
			return [
				...commonFields,
				{
					displayName: 'Additional Parameters',
					name: 'parameters',
					type: 'collection',
					placeholder: 'Add Parameter',
					default: {},
					options: [
						{
							displayName: 'Delivery Time',
							name: 'deliveryTime',
							type: 'options',
							default: 'market_open',
							options: [
								{
									name: 'Market Open',
									value: 'market_open',
								},
								{
									name: 'After Market Close',
									value: 'after_market_close',
								},
							],
						},
					],
				},
			];

		case 'insider_transactions':
			return [
				...commonFields,
				thresholdField,
				{
					displayName: 'Additional Parameters',
					name: 'parameters',
					type: 'collection',
					placeholder: 'Add Parameter',
					default: {},
					options: [
						{
							displayName: 'Direction',
							name: 'direction',
							type: 'options',
							default: 'both',
							options: [
								{
									name: 'Buy',
									value: 'buy',
								},
								{
									name: 'Sell',
									value: 'sell',
								},
								{
									name: 'Both',
									value: 'both',
								},
							],
						},
						{
							displayName: 'Min Executives',
							name: 'minExecutives',
							type: 'number',
							default: 1,
						},
						{
							displayName: 'Window Days',
							name: 'windowDays',
							type: 'number',
							default: 14,
						},
						{
							displayName: 'Open Market Only',
							name: 'openMarketOnly',
							type: 'boolean',
							default: true,
						},
					],
				},
			];
		
		case 'pe_ratio_below':
		case 'pe_ratio_above':
		case 'forward_pe_below':
		case 'forward_pe_above':
			return [...commonFields, thresholdField];
		
		default:
			return commonFields;
	}
}
