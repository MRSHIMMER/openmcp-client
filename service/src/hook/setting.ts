export let VSCODE_WORKSPACE = '';
export let RUNNING_CWD = '';

export function setVscodeWorkspace(workspace: string) {
    VSCODE_WORKSPACE = workspace;
}

export function setRunningCWD(path: string) {
    RUNNING_CWD = path;
}