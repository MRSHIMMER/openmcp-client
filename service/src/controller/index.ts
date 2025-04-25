
import { PostMessageble } from '../hook/adapter';
import { lookupEnvVarService } from '../service/env-var';

import {
	callToolService,
	getPromptService,
	getServerVersionService,
	listPromptsService,
	listResourcesService,
	listResourceTemplatesService,
	listToolsService,
	readResourceService
} from '../service/mcp-server';

import { abortMessageService, chatCompletionService } from '../service/llm';
import { panelLoadService, panelSaveService } from '../service/panel';
import { settingLoadService, settingSaveService } from '../service/setting';
import { pingService } from '../service/util';
import { client, connectService } from '../service/connect';



export function messageController(command: string, data: any, webview: PostMessageble) {
	switch (command) {
		case 'connect':
			connectService(client, data, webview);
			break;

		case 'server/version':
			getServerVersionService(client, data, webview);
			break;

		case 'prompts/list':
			listPromptsService(client, data, webview);
			break;

		case 'prompts/get':
			getPromptService(client, data, webview);
			break;

		case 'resources/list':
			listResourcesService(client, data, webview);
			break;

		case 'resources/templates/list':
			listResourceTemplatesService(client, data, webview);
			break;

		case 'resources/read':
			readResourceService(client, data, webview);
			break;

		case 'tools/list':
			listToolsService(client, data, webview);
			break;

		case 'tools/call':
			callToolService(client, data, webview);
			break;

		case 'ping':
			pingService(client, data, webview);
			break;

		case 'setting/save':
			settingSaveService(client, data, webview);
			break;

		case 'setting/load':
			settingLoadService(client, data, webview);
			break;

		case 'panel/save':
			panelSaveService(client, data, webview);
			break;

		case 'panel/load':
			panelLoadService(client, data, webview);
			break;

		case 'llm/chat/completions':
			chatCompletionService(client, data, webview);
			break;

		case 'llm/chat/completions/cancel':
			abortMessageService(client, data, webview);
			break;

		case 'lookup-env-var':
			lookupEnvVarService(client, data, webview);
			break;

		default:
			break;
	}
}