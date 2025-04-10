import * as vscode from 'vscode';
import * as fs from 'fs';
import * as fspath from 'path';

import * as OpenMCPService from '../resources/service';

function getWebviewContent(context: vscode.ExtensionContext, panel: vscode.WebviewPanel): string | undefined {
    const viewRoot = fspath.join(context.extensionPath, 'resources', 'renderer');
    const htmlIndexPath = fspath.join(viewRoot, 'index.html');
    const html = fs.readFileSync(htmlIndexPath, { encoding: 'utf-8' })?.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
        const absLocalPath = fspath.resolve(viewRoot, $2);        
        const webviewUri = panel.webview.asWebviewUri(vscode.Uri.file(absLocalPath));

        const replaceHref = $1 + webviewUri?.toString() + '"';
        return replaceHref;
    });
    return html;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('activate openmcp');

    // 注册 showOpenMCP 命令
    context.subscriptions.push(
        vscode.commands.registerCommand('openmcp.showOpenMCP', async () => {

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

            // 设置HTML内容
            const html = getWebviewContent(context, panel); 
            panel.webview.html = html || '';            

            // 处理来自webview的消息
            panel.webview.onDidReceiveMessage(message => {
                const { command, data } = message;
                console.log('receive message', message);
                
                OpenMCPService.messageController(command, data, panel.webview as any);
            });
        })
    );

    // const provider = new WebviewViewProvider(context);

    // context.subscriptions.push(
    //     vscode.window.registerWebviewViewProvider('webview-sidebar.view', provider)
    // );
}


export function deactivate() {

}