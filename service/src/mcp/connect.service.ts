import { execSync, spawnSync } from 'node:child_process';
import { RequestClientType } from '../common';
import { connect } from './client.service';
import { RestfulResponse } from '../common/index.dto';
import { McpOptions } from './client.dto';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

export const clientMap: Map<string, RequestClientType> = new Map();
export function getClient(clientId?: string): RequestClientType | undefined {
	return clientMap.get(clientId || '');
}

export function tryGetRunCommandError(command: string, args: string[] = [], cwd?: string): string | null {
	try {
		console.log('current command', command);
		console.log('current args', args);

		const commandString = [command, ...args].join(' ');

		const result = execSync(commandString, {
			cwd: cwd || process.cwd()
		}).toString('utf-8');

		return result;
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
}

function getCWD(option: McpOptions) {
	if (option.cwd) {
		return option.cwd;
	}
	const file = option.args?.at(-1);
	if (file) {
		return path.dirname(file);
	}
	return undefined;
}

function getCommandFileExt(option: McpOptions) {
	const file = option.args?.at(-1);
	if (file) {
		return path.extname(file);
	}
	return undefined;
}


function preprocessCommand(option: McpOptions): [McpOptions, string] {
	// 对于特殊表示的路径，进行特殊的支持
	if (option.args) {
		option.args = option.args.map(arg => {
			if (arg.startsWith('~/')) {
				return arg.replace('~', process.env.HOME || '');
			}
			return arg;
		});
	}

	if (option.connectionType === 'SSE' || option.connectionType === 'STREAMABLE_HTTP') {
		return [option, ''];
	}

	const cwd = getCWD(option);	
	if (!cwd) {
		return [option, ''];
	}

	const ext = getCommandFileExt(option);
	if (!ext) {
		return [option, ''];
	}

	// STDIO 模式下，对不同类型的项目进行额外支持
	// uv：如果没有初始化，则进行 uv sync，将 mcp 设置为虚拟环境的
	// npm：如果没有初始化，则进行 npm init，将 mcp 设置为虚拟环境
	// go：如果没有初始化，则进行 go mod init
	
	let info: string = '';

	switch (ext) {
		case '.py':
			info = initUv(cwd);			
			break;
		case '.js':
		case '.ts':
			info = initNpm(cwd);
			break;

		default:
			break;
	}


	return [option, info];
}

function initUv(cwd: string) {
	let projectDir = cwd;	

	while (projectDir!== path.dirname(projectDir)) {
		if (fs.readFileSync(projectDir).includes('pyproject.toml')) {
			break;
		}
		projectDir = path.dirname(projectDir);
	}

	console.log(projectDir);
	

	const venv = path.join(projectDir, '.venv');
	const mcpCli = path.join(venv, 'bin', 'mcp');
	if (fs.existsSync(mcpCli)) {
		return '';
	}

	let info = '';
	info += execSync('uv sync', { cwd: projectDir }).toString('utf-8') + '\n';
	info += execSync('uv add mcp "mcp[cli]"', { cwd: projectDir }).toString('utf-8') + '\n';
	
	return info;
}


function initNpm(cwd: string) {
	let projectDir = cwd;

	while (projectDir !== path.dirname(projectDir)) {
		if (fs.readFileSync(projectDir).includes('package.json')) {
			break;
		}
		projectDir = path.dirname(projectDir);
	}

	const nodeModulesPath = path.join(projectDir, 'node_modules');
	if (fs.existsSync(nodeModulesPath)) {
		return '';
	}
	
	return execSync('npm i', { cwd: projectDir }).toString('utf-8') + '\n';
}


export async function connectService(
	option: McpOptions
): Promise<RestfulResponse> {
	try {
		console.log('ready to connect', option);

		const info = preprocessCommand(option);

		const client = await connect(option);
		const uuid = randomUUID();
		clientMap.set(uuid, client);

		const versionInfo = client.getServerVersion();

		const connectResult = {
			code: 200,
			msg: {
				status: 'success',
				clientId: uuid,
				name: versionInfo?.name,
				version: versionInfo?.version,
				info
			}
		};

		return connectResult;
	} catch (error) {

		// TODO: 这边获取到的 error 不够精致，如何才能获取到更加精准的错误
		// 比如	error: Failed to spawn: `server.py`
		//		  Caused by: No such file or directory (os error 2)

		let errorMsg = '';

		if (option.command) {
			errorMsg += tryGetRunCommandError(option.command, option.args, option.cwd);
		}

		errorMsg += (error as any).toString();

		const connectResult = {
			code: 500,
			msg: errorMsg
		};

		return connectResult;
	}
}
