import * as vscode from 'vscode';
import { RegisterCommand } from "../common";
import { getDefaultLanunchSignature, getLaunchCWD, revealOpenMcpWebviewPanel } from './webview.service';
import { getWorkspaceConnectionConfigItemByPath } from '../global';

export class WebviewController {
    @RegisterCommand('openmcp.showOpenMCP')
    async showOpenMCP(context: vscode.ExtensionContext, uri: vscode.Uri) {        
        const connectionItem = getWorkspaceConnectionConfigItemByPath(uri.fsPath);
                
        if (!connectionItem) {
            // 项目不存在连接信息
            const cwd = getLaunchCWD(context, uri);

            const signature = getDefaultLanunchSignature(uri.fsPath, cwd);

            if (!signature) {
                vscode.window.showInformationMessage('OpenMCP: 无法获取启动参数');
                vscode.window.showErrorMessage('OpenMCP: 无法获取启动参数');
                return;
            }

            revealOpenMcpWebviewPanel(context, 'workspace', uri.fsPath, {
                connectionType: 'STDIO',
                name: 'OpenMCP',
                command: signature.command,
                args: signature.args,
                cwd
            });
        } else {
            revealOpenMcpWebviewPanel(context, 'workspace', uri.fsPath, connectionItem);
        }

    }
}