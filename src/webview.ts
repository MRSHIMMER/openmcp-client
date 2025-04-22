import * as vscode from 'vscode';
import * as fs from 'fs';
import * as fspath from 'path';
import { getWorkspaceConnectionConfigItemByPath, ISSEConnectionItem, IStdioConnectionItem, panels, updateWorkspaceConnectionConfig } from './global';
import * as OpenMCPService from '../resources/service';


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


export function revealOpenMcpWebviewPanel(
    context: vscode.ExtensionContext,
    panelKey: string,
    option: (IStdioConnectionItem | ISSEConnectionItem) = {
        type: 'stdio',
        name: 'OpenMCP',
        command: 'mcp',
        args: ['run', 'main.py']
    }
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
    panel.iconPath = vscode.Uri.file(fspath.join(context.extensionPath, 'resources', 'renderer', 'images', 'openmcp.png'));     

    // 处理来自webview的消息
    panel.webview.onDidReceiveMessage(message => {
        const { command, data } = message;
        console.log('receive message', message);

        // 拦截消息，注入额外信息
        switch (command) {
            case 'vscode/launch-command':
                const laucnResultMessage = option.type === 'stdio' ?
                    {
                        type: 'stdio',
                        commandString: option.command + ' ' + option.args.join(' '),
                        cwd: option.cwd
                    } :
                    {
                        type: 'sse',
                        url: option.url,
                        oauth: option.oauth
                    };
            
                const launchResult = {
                    code: 200,
                    msg: laucnResultMessage
                };

                panel.webview.postMessage({
                    command: 'vscode/launch-command',
                    data: launchResult
                });

                break;
            
            case 'connect':
                updateWorkspaceConnectionConfig(panelKey, data);
            default:
                OpenMCPService.messageController(command, data, panel.webview);                
                break;
        }

    });

    panel.onDidDispose(async () => {
        // 删除
        panels.delete(panelKey);

        // 退出
        panel.dispose();
    });

    return panel;
}