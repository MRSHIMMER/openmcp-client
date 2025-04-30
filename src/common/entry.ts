import * as vscode from 'vscode';
import { registerCommands, registerTreeDataProviders } from '.';

export const InstallModules = [

];

export function launch(context: vscode.ExtensionContext) {
    
    for (const [command, value] of registerCommands) {
        context.subscriptions.push(vscode.commands.registerCommand(command, (...args: any[]) => {
            value.handler(context, ...args);
        }));
    }

    for (const [providerId, value] of registerTreeDataProviders) {
        context.subscriptions.push(
            vscode.window.registerTreeDataProvider(providerId, value.provider)
        );
    }
    
}