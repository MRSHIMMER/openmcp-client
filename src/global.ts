import * as vscode from 'vscode';
import * as os from 'os';
import * as fspath from 'path';
import * as fs from 'fs';

export type FsPath = string;
export const panels = new Map<FsPath, vscode.WebviewPanel>();


export interface IStdioConnectionItem {
    type: 'stdio';
    name: string;
    command: string;
    args: string[];
    cwd?: string;
    env?: { [key: string]: string };
}

export interface ISSEConnectionItem {
    type: 'sse';
    name: string;
    url: string;
    oauth?: string;
    env?: { [key: string]: string };
}

export interface IConnectionConfig {
    items: (IStdioConnectionItem | ISSEConnectionItem)[];
}

export function getConnectionConfig() {
    const homeDir = os.homedir();
    const configDir = fspath.join(homeDir, '.openmcp');
    const connectionConfig = fspath.join(configDir, 'connection.json');
    if (!fs.existsSync(connectionConfig)) {
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(connectionConfig, JSON.stringify({ items: [] }), 'utf-8');
    }

    const rawConnectionString = fs.readFileSync(connectionConfig, 'utf-8');
    const connection = JSON.parse(rawConnectionString) as IConnectionConfig;
    return connection;
}