import * as vscode from 'vscode';
import * as fs from 'fs';
import * as fspath from 'path';
import { McpOptions, panels, updateInstalledConnectionConfig, updateWorkspaceConnectionConfig } from '../global';
import { routeMessage } from '../../openmcp-sdk/service';

export function getWebviewContent(context: vscode.ExtensionContext, panel: vscode.WebviewPanel): string | undefined {
    const viewRoot = fspath.join(context.extensionPath, 'openmcp-sdk', 'renderer');
    const htmlIndexPath = fspath.join(viewRoot, 'index.html');    

    const html = fs.readFileSync(htmlIndexPath, { encoding: 'utf-8' })?.replace(/(<link.+?href="|<script.+?src="|<img.+?src="|url\()(.+?)(\)|")/g, (m, $1, $2) => {
        const importFile = $2 as string;
        const rel = importFile.startsWith('/') ? importFile.substring(1) : importFile;
        const absLocalPath = fspath.resolve(viewRoot, rel);
        
        const webviewUri = panel.webview.asWebviewUri(vscode.Uri.file(absLocalPath));
        const replaceHref = $1 + webviewUri?.toString() + '"';        
        return replaceHref;
    });

    console.log(html);
    

    return html;
}

export function getLaunchCWD(context: vscode.ExtensionContext, uri: vscode.Uri) {
    // TODO: 启动上下文？
    // 获取当前打开的项目的路径
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    return workspaceFolder?.uri.fsPath || '';
}

export function revealOpenMcpWebviewPanel(
    context: vscode.ExtensionContext,
    type: 'workspace' | 'installed',
    panelKey: string,
    option: McpOptions[] | McpOptions
) {
    if (panels.has(panelKey)) {
        const panel = panels.get(panelKey);
        panel?.reveal();
        return panel;
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

    panels.set(panelKey, panel);


    // 设置HTML内容
    const html = getWebviewContent(context, panel);
    panel.webview.html = html || '';
    panel.iconPath = vscode.Uri.file(fspath.join(context.extensionPath, 'openmcp-sdk', 'renderer', 'images', 'openmcp.png'));

    // 处理来自webview的消息
    panel.webview.onDidReceiveMessage(message => {
        const { command, data } = message;
        console.log('receive message', message);

        // 拦截消息，注入额外信息
        switch (command) {
            case 'vscode/launch-signature':
                const launchResult = {
                    code: 200,
                    msg: option
                };

                panel.webview.postMessage({
                    command: 'vscode/launch-signature',
                    data: launchResult
                });

                break;

            case 'vscode/update-connection-signature':
                if (type === 'installed') {
                    updateInstalledConnectionConfig(panelKey, data);
                } else {
                    updateWorkspaceConnectionConfig(panelKey, data);
                }
                break;

            default:
                routeMessage(command, data, panel.webview);
                break;
        }

    });

    panel.onDidDispose(async () => {
        // 删除
        panels.delete(panelKey);

        // TODO: 通过引用计数器关闭后端的 clientMap

        // 退出
        panel.dispose();
    });

    return panel;
}

export function getDefaultLanunchSignature(path: string, cwd: string) {
    const relativePath = fspath.relative(cwd, path);

    if (relativePath.endsWith('.py')) {
        return {
            command: 'mcp',
            args: ['run', relativePath]
        };
    } else if (relativePath.endsWith('.js')) {
        return {
            command:'node',
            args: [relativePath]
        };
    }
}
