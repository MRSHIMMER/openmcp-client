import * as vscode from 'vscode';
import * as fs from 'fs';

const defaultBundle: Record<string, string> = {}

export function initialiseI18n(context: vscode.ExtensionContext) {
    if (vscode.l10n.bundle === undefined) {
        const bundlePath = context.asAbsolutePath('l10n/bundle.l10n.en.json');
        const bundle = JSON.parse(fs.readFileSync(bundlePath, { encoding: 'utf-8' })) as Record<string, string>;
        Object.assign(defaultBundle, bundle);
    }
}

export function t(message: string, ...args: string[]): string {
    if (vscode.l10n.bundle === undefined) {
        let translateMessage = defaultBundle[message] || message;
        
        for (let i = 0; i < args.length; ++ i) {
            translateMessage = translateMessage.replace(`{${i}}`, args[i]);
        }
        
        return translateMessage;
    } else {
        return vscode.l10n.t(message, ...args);
    }
}