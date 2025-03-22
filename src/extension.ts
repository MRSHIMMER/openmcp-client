import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // 注册 WebView 视图
	console.log('activate');
	
    const provider = new WebviewViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.commands.registerCommand('openmcp.helloWorld', () => {
			vscode.window.showInformationMessage('Hello World!');
		})
	)

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('webview-sidebar.view', provider)
    );
}

class WebviewViewProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        webviewView.webview.options = {
            enableScripts: true, // 启用 JavaScript
        };

        // 设置 WebView 的 HTML 内容
        webviewView.webview.html = getWebviewContent();
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