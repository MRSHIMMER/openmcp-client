import * as vscode from 'vscode';
import { setRunningCWD, setVscodeWorkspace } from '../openmcp-sdk/service/index.js';
import { launch } from './common/entry.js';
import { initialiseI18n } from './i18n/index.js';

export function activate(context: vscode.ExtensionContext) {
    console.log('activate openmcp');

    // 初始化 OpenMCPService
    // 获取当前打开的项目的路径
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const workspace = workspaceFolder?.uri.fsPath || '';
    setVscodeWorkspace(workspace);
    setRunningCWD(context.extensionPath);
    initialiseI18n(context);
    launch(context);
}


export function deactivate() {

}
