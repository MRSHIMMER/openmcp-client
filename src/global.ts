import * as vscode from 'vscode';

export type FsPath = string;
export const panels = new Map<FsPath, vscode.WebviewPanel>();