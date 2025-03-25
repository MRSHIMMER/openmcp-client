import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('activate openmcp'); // 确保插件已激活

    const provider = new WebviewViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('webview-sidebar.view', provider)
    );
}

class WebviewViewProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
    ) {
        console.log('resolveWebviewView called'); // 确保方法被调用
        webviewView.webview.options = {
            enableScripts: true,
        };

        const html = getWebviewContent();
        console.log('WebView HTML:', html); // 检查 HTML 内容
        webviewView.webview.html = html;
    }
}

function getWebviewContent(): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>WebView</title>
        </head>
        <body>
            <h1>Hello, WebView!</h1>
            <p>This is a custom WebView in VS Code Sidebar.</p>
        </body>
        </html>
    `;
}

export function deactivate() {}