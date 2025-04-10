import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as fspath from 'path';

import * as OpenMCPService from '../resources/service';

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
            const panel = vscode.window.createWebviewPanel(
                'openmcpView',
                'OpenMCP',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            initaliseWebview(context, panel.webview);
        })
    );

    const provider = new WebviewViewProvider(context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('webview-sidebar.view', provider)
    );
}

function initaliseWebview(context: vscode.ExtensionContext, webview: vscode.Webview) {
    webview.options = {
        enableScripts: true,
    };

    // 设置HTML内容
    const html = getWebviewContent(context);
    webview.html = html || '';

    // 处理来自webview的消息
    webview.onDidReceiveMessage(message => {
        const { command, data } = message;
        
        OpenMCPService.messageController(command, data, webview as any);
    });
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
        initaliseWebview(this.context, webviewView.webview);
    }
}

export function deactivate() {

}