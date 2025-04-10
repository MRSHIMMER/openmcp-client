import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as fspath from 'path';

import OpenMCPService from '../resources/service';

function getWebviewContent(context: vscode.ExtensionContext, panel?: vscode.WebviewPanel): string | undefined {
    const viewRoot = fspath.join(context.extensionPath, 'resources', 'renderer');
    const htmlIndexPath = fspath.join(viewRoot, 'index.html');
    const html = fs.readFileSync(htmlIndexPath, { encoding: 'utf-8' })?.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
        const absLocalPath = fspath.resolve(viewRoot, $2);
        const webviewUri = panel?.webview.asWebviewUri(vscode.Uri.file(absLocalPath));
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
            const htmlPath = path.join(context.extensionPath, 'resources', 'renderer', 'index.html');
            
            if (!fs.existsSync(htmlPath)) {
                vscode.window.showErrorMessage('未找到 index.html 文件');
                return;
            }

            const panel = vscode.window.createWebviewPanel(
                'openmcpView',
                'OpenMCP',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            panel.webview.html = htmlContent;
        })
    );

    const provider = new WebviewViewProvider(context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('webview-sidebar.view', provider)
    );
}

class WebviewViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(private readonly context: vscode.ExtensionContext) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
        };

        // 设置HTML内容
        const html = getWebviewContent(this.context);
        webviewView.webview.html = html || '';

        // 处理来自webview的消息
        webviewView.webview.onDidReceiveMessage(message => {
            const { command, data } = message;
            
            OpenMCPService.messageController(command, data, webviewView.webview as any);
        });

        // 向webview发送消息的示例
        this.sendMessageToWebview({ command: 'init', data: 'Hello from extension' });
    }

    private sendMessageToWebview(message: any) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }
}

export function deactivate() {}