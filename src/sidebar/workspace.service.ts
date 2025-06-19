import { getFirstValidPathFromCommand, getWorkspaceConnectionConfig, getWorkspacePath, McpOptions, panels, saveWorkspaceConnectionConfig } from "../global.js";
import * as vscode from 'vscode';
import { t } from "../i18n/index.js";
import { exec } from 'child_process';
import { promisify } from 'util';

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

export async function validateAndGetCommandPath(command: string, cwd?: string): Promise<string> {

    const execAsync = promisify(exec);

    try {
        const { stdout } = await execAsync(`which ${command.split(' ')[0]}`, { cwd });
        return stdout.trim();
    } catch (error) {
        throw new Error(`Cannot find command: ${command.split(' ')[0]}`);
    }
}

export async function acquireUserCustomConnection(): Promise<McpOptions[]> {
    // 让用户选择连接类型
    const connectionType = await vscode.window.showQuickPick(['STDIO', 'SSE', 'STREAMABLE_HTTP'], {
        placeHolder: t('choose-connection-type'),
        canPickMany: false,
        ignoreFocusOut: true,
    });

    if (!connectionType) {
        return []; // 用户取消选择
    }

    if (connectionType === 'STDIO') {
        // 获取 command
        const commandString = await vscode.window.showInputBox({
            prompt: t('please-enter-connection-command'),
            placeHolder: t('example-mcp-run')
        });

        if (!commandString) {
            return []; // 用户取消输入
        }

        // 获取 cwd
        const cwd = await vscode.window.showInputBox({
            prompt: t('please-enter-cwd'),
            placeHolder: t('please-enter-cwd-placeholder')
        });

        // 校验 command + cwd 是否有效
        try {
            const commandPath = await validateAndGetCommandPath(commandString, cwd);
            console.log('Command Path:', commandPath);
        } catch (error) {
            vscode.window.showErrorMessage(`Invalid command: ${error}`);
            return [];
        }

        const commands = commandString.split(' ');
        const command = commands[0];
        const args = commands.slice(1);
        const filePath = await getFirstValidPathFromCommand(commandString, cwd || '');

        // 保存连接配置
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
            placeHolder: t('example-as') + 'https://127.0.0.1:8282/sse'
        });

        if (!url) {
            return []; // 用户取消输入
        }

        // 获取 oauth
        const oauth = await vscode.window.showInputBox({
            prompt: t('enter-optional-oauth'),
            placeHolder: t('example-as') + ' your-oauth-token'
        });

        // 保存连接配置
        return [{
            connectionType: 'SSE',
            name: `SSE-${Date.now()}`,
            version: '1.0', // 假设默认版本为 1.0，可根据实际情况修改
            url: url,
            oauth: oauth || ''
        }];
    } else if (connectionType === 'STREAMABLE_HTTP') {
        // 获取 url
        const url = await vscode.window.showInputBox({
            prompt: t('please-enter-url'),
            placeHolder: t('example-as') + ' https://127.0.0.1:8282/stream'
        });

        if (!url) {
            return []; // 用户取消输入
        }

        // 获取 oauth
        const oauth = await vscode.window.showInputBox({
            prompt: t('enter-optional-oauth'),
            placeHolder: t('example-as') + ' your-oauth-token'
        });

        // 保存连接配置
        return [{
            connectionType: 'STREAMABLE_HTTP',
            name: `STREAMABLE_HTTP-${Date.now()}`,
            version: '1.0', // 假设默认版本为 1.0，可根据实际情况修改
            url: url,
            oauth: oauth || ''
        }];
    }

    return [];
}