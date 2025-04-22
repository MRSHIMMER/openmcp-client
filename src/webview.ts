import * as vscode from 'vscode';
import * as fs from 'fs';
import * as fspath from 'path';

export function getWebviewContent(context: vscode.ExtensionContext, panel: vscode.WebviewPanel): string | undefined {
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

export function getLaunchCWD(context: vscode.ExtensionContext, uri: vscode.Uri) {
    // TODO: 启动上下文？
    // 获取当前打开的项目的路径
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    return workspaceFolder?.uri.fsPath || '';
}
