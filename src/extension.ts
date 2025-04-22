import * as vscode from 'vscode';
import * as fspath from 'path';

import * as OpenMCPService from '../resources/service';
import { getLaunchCWD, revealOpenMcpWebviewPanel } from './webview';
import { registerSidebar } from './sidebar';

export function activate(context: vscode.ExtensionContext) {
    console.log('activate openmcp');

    // 初始化 OpenMCPService
    // 获取当前打开的项目的路径
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const workspace = workspaceFolder?.uri.fsPath || '';
    OpenMCPService.setVscodeWorkspace(workspace);

    registerSidebar(context);

    // 注册 showOpenMCP 命令
    context.subscriptions.push(
        vscode.commands.registerCommand('openmcp.showOpenMCP', async (uri: vscode.Uri) => {

            const cwd = getLaunchCWD(context, uri);
            // 获取 uri 相对于 cwd 的路径
            const relativePath = fspath.relative(cwd, uri.fsPath);

            // TODO: 实现从 connection.json 中读取配置，然后启动对应的 connection
            const command = 'mcp';
            const args = ['run', relativePath];

            revealOpenMcpWebviewPanel(context, uri.fsPath, {
                type: 'stdio',
                name: 'OpenMCP',
                command,
                args,
                cwd
            });
            
        })
    );
}


export function deactivate() {

}