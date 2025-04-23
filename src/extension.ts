import * as vscode from 'vscode';
import * as fspath from 'path';

import * as OpenMCPService from '../resources/service';
import { getDefaultLanunchSigature, getLaunchCWD, revealOpenMcpWebviewPanel } from './webview';
import { ConnectionViewItem, registerSidebar } from './sidebar';
import { getWorkspaceConnectionConfigItemByPath, ISSEConnectionItem, IStdioConnectionItem } from './global';

export function activate(context: vscode.ExtensionContext) {
    console.log('activate openmcp');

    // 初始化 OpenMCPService
    // 获取当前打开的项目的路径
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const workspace = workspaceFolder?.uri.fsPath || '';
    OpenMCPService.setVscodeWorkspace(workspace);

    registerSidebar(context);

    context.subscriptions.push(
        vscode.commands.registerCommand('openmcp.sidebar.workspace-connection.revealWebviewPanel', (view: ConnectionViewItem) => {
            const item = view.item;
            revealOpenMcpWebviewPanel(context, item.filePath || item.name, item);
        })
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('openmcp.showOpenMCP', async (uri: vscode.Uri) => {

            const connectionItem = getWorkspaceConnectionConfigItemByPath(uri.fsPath);
            if (!connectionItem) {
                // 项目不存在连接信息
                const cwd = getLaunchCWD(context, uri);

                const sigature = getDefaultLanunchSigature(uri.fsPath, cwd);
                
                if (!sigature) {
                    vscode.window.showErrorMessage('OpenMCP: 无法获取启动参数');
                    return;
                }

                revealOpenMcpWebviewPanel(context, uri.fsPath, {
                    type: 'stdio',
                    name: 'OpenMCP',
                    command: sigature.command,
                    args: sigature.args,
                    cwd
                });
            } else {
                revealOpenMcpWebviewPanel(context, uri.fsPath, connectionItem);
            }
            
        })
    );
}


export function deactivate() {

}