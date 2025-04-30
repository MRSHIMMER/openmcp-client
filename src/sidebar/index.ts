import * as vscode from 'vscode';
import { McpWorkspaceConnectProvider } from './workspace@1';
import { HelpProvider } from './help@3';

// 在 registerSidebar 函数中注册 refresh 命令
export function registerSidebar(context: vscode.ExtensionContext) {
    const workspaceConnectionProvider = new McpWorkspaceConnectProvider(context);
    
    // 注册 refresh 命令
    context.subscriptions.push(
        vscode.commands.registerCommand('openmcp.sidebar.workspace-connection.refresh', () => {
            workspaceConnectionProvider.refresh();
        })
    );

    // 注册 MCP 连接的 sidebar 视图
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('openmcp.sidebar-view.workspace-connection', workspaceConnectionProvider)
    );

    // 注册 MCP 连接的 sidebar 视图


    // 注册 入门与帮助的 sidebar 视图
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('openmcp.sidebar.help', new HelpProvider(context))
    );
}

