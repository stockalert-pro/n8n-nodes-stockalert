import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class StockAlertApi implements ICredentialType {
	name = 'stockAlertApi';
	displayName = 'StockAlert API';
	documentationUrl = 'https://stockalert.pro/api/docs';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your StockAlert.pro API key. Get it from https://stockalert.pro/dashboard/api-keys.',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			default: 'production',
			options: [
				{
					name: 'Production',
					value: 'production',
				},
				{
					name: 'Custom',
					value: 'custom',
				},
			],
		},
		{
			displayName: 'Custom API URL',
			name: 'customUrl',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					environment: ['custom'],
				},
			},
			placeholder: 'https://your-stockalert-instance.com',
			description: 'The base URL for your StockAlert instance (without /api/public/v1)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.environment === "production" ? "https://stockalert.pro" : $credentials.customUrl}}/api/public/v1',
			url: '/alerts?limit=1',
		},
	};
}