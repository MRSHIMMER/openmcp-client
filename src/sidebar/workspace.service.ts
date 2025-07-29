import { getFirstValidPathFromCommand, getWorkspaceConnectionConfig, getWorkspacePath, McpOptions, panels, saveWorkspaceConnectionConfig } from "../global.js";
import * as vscode from 'vscode';
import { t } from "../i18n/index.js";

export async function deleteUserConnection(item: McpOptions[] | McpOptions) {
    // 弹出确认对话框
    const masterNode = Array.isArray(item) ? item[0] : item;
    const name = masterNode.name || 'unknown node name';

    const res = await vscode.window.showWarningMessage(
        t("ensure-delete-connection", name),
        { modal: true },
        { title: t('confirm'), value: true },
    );

    const confirm = res?.value;

    if (!confirm) {
        return; // 用户取消删除
    }

    const workspaceConnectionConfig = getWorkspaceConnectionConfig();
    if (!workspaceConnectionConfig) {
        vscode.window.showErrorMessage(t('error.notOpenWorkspace'));
        return; // 没有打开工作区
    }

    // 从配置中移除该连接项

    // TODO: 改成基于 path 进行搜索

    const index = workspaceConnectionConfig.items.indexOf(item);
    if (index !== -1) {
        workspaceConnectionConfig.items.splice(index, 1);

        // 保存更新后的配置
        const workspacePath = getWorkspacePath();
        saveWorkspaceConnectionConfig(workspacePath);

        // 刷新侧边栏视图
        vscode.commands.executeCommand('openmcp.sidebar.workspace-connection.refresh');

        // 如果该连接有对应的webview面板，则关闭它
        const filePath = masterNode.filePath || '';
        const panel = panels.get(filePath);
        panel?.dispose();
        panels.delete(filePath);
    }
}

export async function changeUserConnectionName(item: McpOptions[] | McpOptions) {
    // 获取当前连接项
    const masterNode = Array.isArray(item) ? item[0] : item;
    const currentName = masterNode.name || '';

    // 弹出输入框让用户输入新的服务器名称
    const newName = await vscode.window.showInputBox({
        prompt: t('openmcp.sidebar.installed-connection.changeConnectionName.title'),
        value: currentName,
        ignoreFocusOut: true,
        validateInput: (value) => {
            if (!value || value.trim() === '') {
                return t('error.connectionNameRequired');
            }
            return null;
        }
    });

    // 用户取消或输入无效名称
    if (!newName || newName.trim() === '' || newName === currentName) {
        return;
    }

    const workspaceConnectionConfig = getWorkspaceConnectionConfig();
    if (!workspaceConnectionConfig) {
        vscode.window.showErrorMessage(t('error.notOpenWorkspace'));
        return;
    }

    // 更新 panel 标题
    if (masterNode.name && panels.has(masterNode.name)) {
        const panel = panels.get(masterNode.name)!;
        panel.title = 'OpenMCP ' + newName.trim();
    }

    // 更新连接名称
    masterNode.name = newName.trim();
    masterNode.rename = true;
    
    // 保存更新后的配置
    const workspacePath = getWorkspacePath();    
    saveWorkspaceConnectionConfig(workspacePath);
 
    // 刷新侧边栏视图
    vscode.commands.executeCommand('openmcp.sidebar.workspace-connection.refresh');
}

// 定义命令解析结果接口
interface ParsedCommand {
    type: 'STDIO' | 'SSE' | 'STREAMABLE_HTTP';
    name: string;
    command?: string;
    args?: string[];
    url?: string;
    oauth?: string;
    cwd?: string;
    env?: Record<string, string>;
    scope?: 'local' | 'project' | 'user';
}

// 主解析函数（保持不变）
export function parseClaudeCommand(commandString: string): ParsedCommand | null {
    if (!commandString.startsWith('claude mcp add')) {
        return null;
    }

    if (commandString.includes('--transport sse')) {
        return parseSseCommand(commandString);
    } else if (commandString.includes('--transport http')) {
        return parseHttpCommand(commandString);
    } else if (commandString.includes('--')) {
        return parseStdioCommand(commandString);
    }

    return null;
}

// 解析STDIO类型命令
function parseStdioCommand(commandString: string): ParsedCommand {
    const parts = commandString.split(/\s+/); // 使用正则分割，处理多个空格情况
    const name = parts[3]; // claude mcp add <name>
    
    // 提取作用域
    let scope: 'local' | 'project' | 'user' = 'local';
    const scopeIndex = parts.indexOf('-s');
    if (scopeIndex !== -1 && scopeIndex + 1 < parts.length) {
        scope = parts[scopeIndex + 1] as 'local' | 'project' | 'user';
    }

    // 找到命令开始位置
    const doubleDashIndex = parts.indexOf('--');
    const commandParts = doubleDashIndex !== -1 ? parts.slice(doubleDashIndex + 1) : parts.slice(4);

    // 提取环境变量和工作目录
    const env: Record<string, string> = {};
    let cwd: string | undefined;
    let currentIndex = 0;

    while (currentIndex < commandParts.length) {
        const part = commandParts[currentIndex];
        
        if (part === 'env') {
            // 处理环境变量
            const envVar = commandParts[currentIndex + 1];
            const [key, value] = envVar.split('=');
            env[key] = value;
            currentIndex += 2;
        } else if (part === 'cwd') {
            // 处理工作目录
            cwd = commandParts[currentIndex + 1];
            currentIndex += 2;
        } else {
            // 不是特殊参数，跳出循环
            break;
        }
    }

    // 剩余部分是实际命令和参数
    const executableParts = commandParts.slice(currentIndex);
    const command = executableParts[0];
    const args = executableParts.slice(1);

    return {
        type: 'STDIO',
        name,
        command,
        args,
        env,
        cwd,
        scope
    };
}
// 解析SSE类型命令
function parseSseCommand(commandString: string): ParsedCommand {
    const parts = commandString.split(' ');
    const nameIndex = parts.indexOf('--transport') + 3; // claude mcp add --transport sse <name>
    const name = parts[nameIndex];
    const url = parts[nameIndex + 1];

    return {
        type: 'SSE',
        name,
        url,
        // 可以添加OAuth处理逻辑
    };
}

// 解析HTTP类型命令
function parseHttpCommand(commandString: string): ParsedCommand {
    const parts = commandString.split(' ');
    const nameIndex = parts.indexOf('--transport') + 3; // claude mcp add --transport http <name>
    const name = parts[nameIndex];
    const url = parts[nameIndex + 1];

    return {
        type: 'STREAMABLE_HTTP',
        name,
        url,
        // 可以添加OAuth处理逻辑
    };
}

export async function acquireUserCustomConnection(): Promise<McpOptions[]> {
    // 让用户选择连接类型，新增Claude Command选项
    const connectionType = await vscode.window.showQuickPick([
        'STDIO', 
        'SSE', 
        'STREAMABLE_HTTP',
        'Claude Command'
    ], {
        placeHolder: t('choose-connection-type'),
        canPickMany: false,
        ignoreFocusOut: true,
    });

    if (!connectionType) {
        return []; // 用户取消选择
    }

    // 如果用户选择的是Claude Command
    if (connectionType === 'Claude Command') {
        // 让用户输入claude命令
        const commandString = await vscode.window.showInputBox({
            prompt: t('please-enter-claude-command'),
            placeHolder: 'claude mcp add filesystem -s user -- npx -y @modelcontextprotocol/server-filesystem ~/Projects',
            ignoreFocusOut: true,
        });

        if (!commandString) {
            return [];
        }

        // 解析命令
        const parsedCommand = parseClaudeCommand(commandString);
        if (!parsedCommand) {
            vscode.window.showErrorMessage(t('error.invalid-claude-command'));
            return [];
        }

        // 根据解析结果创建配置
        switch (parsedCommand.type) {
            case 'STDIO':
                return [{
                    connectionType: 'STDIO',
                    name: parsedCommand.name || `STDIO-${Date.now()}`,
                    command: parsedCommand.command || '',
                    args: parsedCommand.args || [],
                    cwd: parsedCommand.cwd || '',
                    env: parsedCommand.env || {},
                    scope: parsedCommand.scope || 'local'
                }];
            
            case 'SSE':
                return [{
                    connectionType: 'SSE',
                    name: parsedCommand.name || `SSE-${Date.now()}`,
                    version: '1.0',
                    url: parsedCommand.url || '',
                    oauth: parsedCommand.oauth || ''
                }];
            
            case 'STREAMABLE_HTTP':
                return [{
                    connectionType: 'STREAMABLE_HTTP',
                    name: parsedCommand.name || `STREAMABLE_HTTP-${Date.now()}`,
                    version: '1.0',
                    url: parsedCommand.url || '',
                    oauth: parsedCommand.oauth || ''
                }];
            
            default:
                return [];
        }
    }
    // 以下是原有的三种连接类型的处理逻辑
    else if (connectionType === 'STDIO') {
        // 获取 command
        const commandString = await vscode.window.showInputBox({
            prompt: t('please-enter-connection-command'),
            placeHolder: t('example-mcp-run'),
            ignoreFocusOut: true,
        });

        if (!commandString) {
            return []; // 用户取消输入
        }

        // 获取 cwd
        const cwd = await vscode.window.showInputBox({
            prompt: t('please-enter-cwd'),
            placeHolder: t('please-enter-cwd-placeholder'),
            ignoreFocusOut: true
        });

        const commands = commandString.split(' ');
        const command = commands[0];
        const args = commands.slice(1);
        const filePath = await getFirstValidPathFromCommand(commandString, cwd || '');

        return [{
            connectionType: 'STDIO',
            name: `STDIO-${Date.now()}`,
            command: command,
            args,
            cwd: cwd || '',
            filePath
        }];

    } else if (connectionType === 'SSE') {
        // 获取 url
        const url = await vscode.window.showInputBox({
            prompt: t('please-enter-url'),
            placeHolder: t('example-as') + 'https://127.0.0.1:8282/sse',
            ignoreFocusOut: true,
        });

        if (!url) {
            return []; // 用户取消输入
        }

        // 获取 oauth
        const oauth = await vscode.window.showInputBox({
            prompt: t('enter-optional-oauth'),
            placeHolder: t('example-as') + ' your-oauth-token',
            ignoreFocusOut: true,
        });

        return [{
            connectionType: 'SSE',
            name: `SSE-${Date.now()}`,
            version: '1.0',
            url: url,
            oauth: oauth || ''
        }];
    } else if (connectionType === 'STREAMABLE_HTTP') {
        // 获取 url
        const url = await vscode.window.showInputBox({
            prompt: t('please-enter-url'),
            placeHolder: t('example-as') + ' https://127.0.0.1:8282/stream',
            ignoreFocusOut: true,
        });

        if (!url) {
            return []; // 用户取消输入
        }

        // 获取 oauth
        const oauth = await vscode.window.showInputBox({
            prompt: t('enter-optional-oauth'),
            placeHolder: t('example-as') + ' your-oauth-token',
            ignoreFocusOut: true,
        });

        return [{
            connectionType: 'STREAMABLE_HTTP',
            name: `STREAMABLE_HTTP-${Date.now()}`,
            version: '1.0',
            url: url,
            oauth: oauth || ''
        }];
    }

    return [];
}