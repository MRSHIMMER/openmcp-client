import * as vscode from 'vscode';
import * as fs from 'fs';
import * as fspath from 'path';

import * as OpenMCPService from '../resources/service';
import { getLaunchCWD, getWebviewContent } from './webview';
import { panels } from './global';

export function activate(context: vscode.ExtensionContext) {
    console.log('activate openmcp');

    // 初始化 OpenMCPService
    // 获取当前打开的项目的路径
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const workspace = workspaceFolder?.uri.fsPath || '';
    OpenMCPService.setVscodeWorkspace(workspace);

    // 注册 showOpenMCP 命令
    context.subscriptions.push(
        vscode.commands.registerCommand('openmcp.showOpenMCP', async (uri: vscode.Uri) => {

            if (panels.has(uri.fsPath)) {
                const panel = panels.get(uri.fsPath);
                panel?.reveal();
                return;
            }

            const panel = vscode.window.createWebviewPanel(
                'OpenMCP',
                'OpenMCP',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    enableFindWidget: true
                }
            );

            panels.set(uri.fsPath, panel);

            const cwd = getLaunchCWD(context, uri);
            // 获取 uri 相对于 cwd 的路径
            const relativePath = fspath.relative(cwd, uri.fsPath);
            
            console.log('current file' + uri.fsPath);
            console.log(`relativePath: ${relativePath}`);

            // 根据 relativePath 先去 setting 中进行选择

            // 设置HTML内容
            const html = getWebviewContent(context, panel); 
            panel.webview.html = html || '';
            panel.iconPath = vscode.Uri.file(fspath.join(context.extensionPath, 'resources', 'renderer', 'images', 'openmcp.png'));     

            // 处理来自webview的消息
            panel.webview.onDidReceiveMessage(message => {
                const { command, data } = message;
                console.log('receive message', message);

                // 拦截消息，注入额外信息
                switch (command) {
                    case 'vscode/launch-command':
                        const commandString = 'mcp run ' + relativePath;
                        const launchResult = {
                            code: 200,
                            msg: {
                                commandString: commandString,
                                cwd: cwd
                            }
                        }

                        panel.webview.postMessage({
                            command: 'vscode/launch-command',
                            data: launchResult
                        });

                        break;
                
                    default:
                        OpenMCPService.messageController(command, data, panel.webview);                
                        break;
                }

            });

            panel.onDidDispose(async () => {
                // 删除
                panels.delete(uri.fsPath);

                // 退出
                panel.dispose();
            });
        })
    );
}


export function deactivate() {

}