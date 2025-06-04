import { exec, execSync, spawnSync } from 'node:child_process';
import { RequestClientType } from '../common/index.dto.js';
import { connect } from './client.service.js';
import { RestfulResponse } from '../common/index.dto.js';
import { McpOptions } from './client.dto.js';
import * as crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import * as os from 'os';
import { PostMessageble } from '../hook/adapter.js';
import Table from 'cli-table3';

export const clientMap: Map<string, RequestClientType> = new Map();
export function getClient(clientId?: string): RequestClientType | undefined {
	return clientMap.get(clientId || '');
}

export function tryGetRunCommandError(command: string, args: string[] = [], cwd?: string): string | null {
    try {
        const commandString = command + ' ' + args.join(' ');
        const result = spawnSync(commandString, {
            cwd: cwd || process.cwd(),
            stdio: 'pipe',
            encoding: 'utf-8'
        });

        if (result.error) {
            return result.error.message;
        }
        if (result.status !== 0) {
            return result.stderr || `Command failed with code ${result.status}`;
        }
        return null;
    } catch (error) {
        return error instanceof Error ? error.message : String(error);
    }
}

function getCWD(option: McpOptions) {
	// if (option.cwd) {
	// 	return option.cwd;
	// }
	const file = option.args?.at(-1);
	if (file) {
		// 如果是绝对路径，直接返回目录
		if (path.isAbsolute(file)) {
			// 如果是是文件，则返回文件所在的目录
			if (fs.statSync(file).isDirectory()) {
				return file;
			} else {
				return path.dirname(file);
			}
		} else {
			// 如果是相对路径，根据 cwd 获取真实路径
			const absPath = path.resolve(option.cwd || process.cwd(), file);
			// 如果是是文件，则返回文件所在的目录
			if (fs.statSync(absPath).isDirectory()) {
				return absPath;
			} else {
				return path.dirname(absPath);
			}
		}
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

function collectAllOutputExec(command: string, cwd: string) {
	return new Promise<string>((resolve, reject) => {
		const handler = setTimeout(() => {
			resolve('');
		}, 5000);

		exec(command, { cwd }, (error, stdout, stderr) => {
			const errorString = error || '';
			const stdoutString = stdout || '';
			const stderrString = stderr || '';

			console.log('[collectAllOutputExec]', errorString);
			console.log('[collectAllOutputExec]', stdoutString);
			console.log('[collectAllOutputExec]', stderrString);
			
			clearTimeout(handler);
			resolve(errorString + stdoutString + stderrString);
		});
	});
}

async function preprocessCommand(option: McpOptions, webview?: PostMessageble) {
	// 对于特殊表示的路径，进行特殊的支持
	if (option.args) {
		option.args = option.args.map(arg => {
			if (arg.startsWith('~/')) {
				return arg.replace('~', process.env.HOME || '');
			}
			return arg;
		});
	}

	if (option.cwd && option.cwd.startsWith('~/')) {
		option.cwd = option.cwd.replace('~', process.env.HOME || '');
	}

	if (option.connectionType === 'SSE' || option.connectionType === 'STREAMABLE_HTTP') {
		return;
	}

	const cwd = getCWD(option);	
	if (!cwd) {
		return;
	}

	const ext = getCommandFileExt(option);
	if (!ext) {
		return;
	}

	// STDIO 模式下，对不同类型的项目进行额外支持
	// uv：如果没有初始化，则进行 uv sync，将 mcp 设置为虚拟环境的
	// npm：如果没有初始化，则进行 npm init，将 mcp 设置为虚拟环境
	// go：如果没有初始化，则进行 go mod init
	
	switch (ext) {
		case '.py':
			await initUv(option, cwd, webview);	
			break;
		case '.js':
		case '.ts':
			await initNpm(option, cwd, webview);
			break;

		default:
			break;
	}
}

async function initUv(option: McpOptions, cwd: string, webview?: PostMessageble) {
	let projectDir = cwd;	

	while (projectDir!== path.dirname(projectDir)) {
		if (fs.readdirSync(projectDir).includes('pyproject.toml')) {
			break;
		}
		projectDir = path.dirname(projectDir);
	}	

	const venv = path.join(projectDir, '.venv');

	// judge by OS
	const mcpCli = os.platform() === 'win32' ?
		path.join(venv, 'Scripts','mcp.exe') :
		path.join(venv, 'bin', 'mcp');
	
	if (option.command === 'mcp') {
		option.command = mcpCli;
		option.cwd = projectDir;
	}

	if (fs.existsSync(mcpCli)) {
		return '';
	}

	const syncOutput = await collectAllOutputExec('uv sync', projectDir);
	webview?.postMessage({
		command: 'connect/log',
		data: {
			code: syncOutput.toLowerCase().startsWith('error') ? 501: 200,
			msg: {
				title: 'uv sync',
				message: syncOutput
			}
		}
	});

	const addOutput = await collectAllOutputExec('uv add mcp "mcp[cli]"', projectDir);
	webview?.postMessage({
		command: 'connect/log',
		data: {
			code: addOutput.toLowerCase().startsWith('error') ? 501: 200,
			msg: {
				title: 'uv add mcp "mcp[cli]"',
				message: addOutput
			}
		}
	});
}


async function initNpm(option: McpOptions, cwd: string, webview?: PostMessageble) {
	let projectDir = cwd;

	while (projectDir !== path.dirname(projectDir)) {
		if (fs.readdirSync(projectDir).includes('package.json')) {
			break;
		}
		projectDir = path.dirname(projectDir);
	}

	const nodeModulesPath = path.join(projectDir, 'node_modules');
	if (fs.existsSync(nodeModulesPath)) {
		return '';
	}
	
	const installOutput = execSync('npm i', { cwd: projectDir }).toString('utf-8') + '\n';
	webview?.postMessage({
		command: 'connect/log',
		data: {
			code: installOutput.toLowerCase().startsWith('error')? 200: 501,
			msg: {
				title: 'npm i',
				message: installOutput
			}
		}
	})
}


async function deterministicUUID(input: string) {
    // 使用Web Crypto API进行哈希
    const msgBuffer = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // 格式化为UUID (版本5)
    return [
        hashHex.substring(0, 8),
        hashHex.substring(8, 4),
        '5' + hashHex.substring(13, 3), // 设置版本为5
        '8' + hashHex.substring(17, 3), // 设置变体
        hashHex.substring(20, 12)
    ].join('-');
}


export async function connectService(
	option: McpOptions,
	webview?: PostMessageble
): Promise<RestfulResponse> {
	try {		
		// 使用cli-table3创建美观的表格
		const table = new Table({
			head: ['Property', 'Value'],
			colWidths: [20, 60],
			style: {
				head: ['green'],
				border: ['grey']
			}
		});
		
		table.push(
			['Connection Type', option.connectionType],
			['Command', option.command || 'N/A'],
			['Arguments', option.args?.join(' ') || 'N/A'],
			['Working Directory', option.cwd || 'N/A'],
			['URL', option.url || 'N/A']
		);
		
		console.log(table.toString());
		


		// 预处理字符串
		await preprocessCommand(option, webview);

		// 通过 option 字符串进行 hash，得到唯一的 uuid
		const uuid = await deterministicUUID(JSON.stringify(option));

		const reuseConntion = clientMap.has(uuid);
		
		// if (!clientMap.has(uuid)) {
		// 	const client = await connect(option);
		// 	clientMap.set(uuid, client);
		// }
		// const client = clientMap.get(uuid)!;

		const client = await connect(option);
		clientMap.set(uuid, client);

		const versionInfo = client.getServerVersion();

		const connectResult = {
			code: 200,
			msg: {
				status: 'success',
				clientId: uuid,
				reuseConntion,
				name: versionInfo?.name,
				version: versionInfo?.version
			}
		};

		return connectResult;
	} catch (error) {

		console.log('[connectService catch error]', error);
		
		// TODO: 这边获取到的 error 不够精致，如何才能获取到更加精准的错误
		// 比如	error: Failed to spawn: `server.py`
		//		  Caused by: No such file or directory (os error 2)

		let errorMsg = '';

		if (option.command) {
			errorMsg += await collectAllOutputExec(
				option.command + ' ' + (option.args || []).join(' '),
				option.cwd || process.cwd()
			)
		}

		errorMsg += (error as any).toString();

		const connectResult = {
			code: 500,
			msg: errorMsg
		};

		return connectResult;
	}
}