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
		url: `${baseUrl}/api/public/v1${endpoint}`,
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
		responseData.pagination &&
		responseData.pagination.page < responseData.pagination.totalPages
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
		description: 'Notification before dividend payment',
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
		case 'reminder':
		case 'daily_reminder':
		case 'ma_crossover_golden':
		case 'ma_crossover_death':
		case 'earnings_announcement':
		case 'dividend_ex_date':
		case 'dividend_payment':
			return commonFields;
		
		case 'ma_touch_above':
		case 'ma_touch_below':
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
							displayName: 'MA Period',
							name: 'period',
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
						},
					],
				},
			];
		
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