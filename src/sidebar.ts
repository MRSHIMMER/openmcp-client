import * as vscode from 'vscode';
import { getConnectionConfig, getWorkspaceConnectionConfig, IConnectionItem } from './global';

class McpWorkspaceConnectProvider implements vscode.TreeDataProvider<ConnectionViewItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ConnectionViewItem | undefined | null | void> = new vscode.EventEmitter<ConnectionViewItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ConnectionViewItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {
    }

    // 实现 TreeDataProvider 接口
    getTreeItem(element: ConnectionViewItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ConnectionViewItem): Thenable<ConnectionViewItem[]> {
        // TODO: 读取 configDir 下的所有文件，作为子节点
        const connection = getWorkspaceConnectionConfig();
        const sidebarItems = connection.items.map((item, index) => {
            // 连接的名字
            const itemName = `${item.name} (${item.type})`
            return new ConnectionViewItem(itemName, vscode.TreeItemCollapsibleState.None, item, 'server');
        })
        
        // 返回子节点
        return Promise.resolve(sidebarItems);
    }

    // 添加 refresh 方法
    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}

// 在 registerSidebar 函数中注册 refresh 命令
export function registerSidebar(context: vscode.ExtensionContext) {
    const workspaceConnectionProvider = new McpWorkspaceConnectProvider(context);

    // 注册 refresh 命令
    context.subscriptions.push(
        vscode.commands.registerCommand('openmcp.sidebar.workspace-connection.refresh', () => {
            workspaceConnectionProvider.refresh();
        })
    );

    // 注册 MCP 连接的 sidebar 视图
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('openmcp.sidebar-view.workspace-connection', workspaceConnectionProvider)
    );

    // 注册 入门与帮助的 sidebar 视图
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('openmcp.sidebar.help', new HelpProvider(context))
    );
}

class HelpProvider implements vscode.TreeDataProvider<SidebarItem> {

    constructor(private context: vscode.ExtensionContext) {
    }

    // 实现 TreeDataProvider 接口
    getTreeItem(element: SidebarItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SidebarItem): Thenable<SidebarItem[]> {
        // 返回子节点
        return Promise.resolve([
            new SidebarItem('入门', vscode.TreeItemCollapsibleState.None, {
                command: 'vscode.open',
                title: 'Open Guide',
                arguments: [vscode.Uri.parse('https://zhuanlan.zhihu.com/p/1894785817186121106')]
            }, 'book'),
            new SidebarItem('阅读文档', vscode.TreeItemCollapsibleState.None, {
                command: 'vscode.open',
                title: 'Open Documentation',
                arguments: [vscode.Uri.parse('https://document.kirigaya.cn/blogs/openmcp/main.html')]
            }, 'file-text'),
            new SidebarItem('报告问题', vscode.TreeItemCollapsibleState.None, {
                command: 'vscode.open',
                title: 'Report Issue',
                arguments: [vscode.Uri.parse('https://github.com/LSTM-Kirigaya/openmcp-client/issues')]
            }, 'bug'),
            new SidebarItem('参与项目', vscode.TreeItemCollapsibleState.None, {
                command: 'vscode.open',
                title: 'Join Project',
                arguments: [vscode.Uri.parse('https://qm.qq.com/cgi-bin/qm/qr?k=C6ZUTZvfqWoI12lWe7L93cWa1hUsuVT0&jump_from=webapi&authKey=McW6B1ogTPjPDrCyGttS890tMZGQ1KB3QLuG4aqVNRaYp4vlTSgf2c6dMcNjMuBD')]
            }, 'organization'),
            new SidebarItem('评论插件', vscode.TreeItemCollapsibleState.None, {
                command: 'vscode.open',
                title: 'Review Extension',
                arguments: [vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=kirigaya.openmcp&ssr=false#review-details')]
            }, 'feedback')
        ]);
    }
}

class SidebarItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command,
        public readonly icon?: string
    ) {
        super(label, collapsibleState);
        this.command = command;
        this.iconPath = new vscode.ThemeIcon(icon || 'circle-outline');
    }
}

export class ConnectionViewItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly item: IConnectionItem,
        public readonly icon?: string
    ) {
        super(label, collapsibleState);
        this.iconPath = new vscode.ThemeIcon(icon || 'circle-outline');
    }
}