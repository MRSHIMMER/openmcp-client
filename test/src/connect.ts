import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// 定义连接类型
type ConnectionType = 'STDIO' | 'SSE';

type McpTransport = StdioClientTransport | SSEClientTransport;

// 定义命令行参数接口
interface MCPOptions {
    connectionType: ConnectionType;
    // STDIO 特定选项
    command?: string;
    args?: string[];
    // SSE 特定选项
    url?: string;
    // 通用客户端选项
    clientName?: string;
    clientVersion?: string;
}

// 增强的客户端类
class MCPClient {
    private client: Client;
    private transport?: McpTransport;
    private options: MCPOptions;

    constructor(options: MCPOptions) {
        this.options = options;

        this.client = new Client(
            {
                name: "example-client",
                version: "1.0.0"
            },
            {
                capabilities: {
                    prompts: {},
                    resources: {},
                    tools: {}
                }
            }
        );
    }

    // 连接方法
    public async connect(): Promise<void> {
        // 根据连接类型创建传输层
        switch (this.options.connectionType) {
            case 'STDIO':
                this.transport = new StdioClientTransport({
                    command: this.options.command || 'node',
                    args: this.options.args || ['server.js']
                });
                break;
            case 'SSE':
                if (!this.options.url) {
                    throw new Error('URL is required for SSE connection');
                }
                this.transport = new SSEClientTransport(new URL(this.options.url));
                break;
            default:
                throw new Error(`Unsupported connection type: ${this.options.connectionType}`);
        }

        // 建立连接
        await this.client.connect(this.transport);
        console.log(`Connected to MCP server via ${this.options.connectionType}`);
    }

    // 断开连接
    public async disconnect(): Promise<void> {
        await this.client.close();
        console.log('Disconnected from MCP server');
    }

    // 列出提示
    public async listPrompts(): Promise<any> {
        return await this.client.listPrompts();
    }

    // 获取提示
    public async getPrompt(name: string, args: Record<string, any> = {}): Promise<any> {
        return await this.client.getPrompt({ name }, args);
    }

    // 列出资源
    public async listResources(): Promise<any> {
        return await this.client.listResources();
    }

    // 读取资源
    public async readResource(uri: string): Promise<any> {
        return await this.client.readResource({
            uri
        });
    }

    // 调用工具
    public async callTool(options: { name: string; arguments: Record<string, any> }): Promise<any> {
        return await this.client.callTool(options);
    }
}

// Connect 函数实现
export async function connect(options: MCPOptions): Promise<MCPClient> {
    const client = new MCPClient(options);
    await client.connect();
    return client;
}

// 命令行参数解析
function parseCommandLineArgs(): MCPOptions {
    const args = process.argv.slice(2);
    const options: MCPOptions = {
        connectionType: 'STDIO' // 默认值
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--type':
            case '-t':
                const type = args[++i];
                if (type === 'STDIO' || type === 'SSE') {
                    options.connectionType = type;
                } else {
                    console.warn(`Invalid connection type: ${type}. Using default (STDIO).`);
                }
                break;
            case '--command':
            case '-c':
                options.command = args[++i];
                break;
            case '--args':
            case '-a':
                options.args = args[++i].split(',');
                break;
            case '--url':
            case '-u':
                options.url = args[++i];
                break;
            case '--name':
            case '-n':
                options.clientName = args[++i];
                break;
            case '--version':
            case '-v':
                options.clientVersion = args[++i];
                break;
            case '--help':
                printHelp();
                process.exit(0);
                break;
            default:
                console.warn(`Unknown option: ${arg}`);
                printHelp();
                process.exit(1);
        }
    }

    return options;
}

function printHelp(): void {
    console.log(`
Usage: node mcpserver.js [options]

Options:
  -t, --type <STDIO|SSE>    Connection type (default: STDIO)
  
  STDIO specific options:
  -c, --command <string>    Command to execute (default: node)
  -a, --args <string>       Comma-separated arguments (default: server.js)
  
  SSE specific options:
  -u, --url <string>        Server URL (required for SSE)
  
  Client options:
  -n, --name <string>       Client name (default: mcp-client)
  -v, --version <string>    Client version (default: 1.0.0)
  
  --help                    Show this help message
`);
}

// 主入口
if (require.main === module) {
    (async () => {
        try {
            const options = parseCommandLineArgs();
            const client = await connect(options);

            // 示例操作
            console.log('Listing prompts...');
            const prompts = await client.listPrompts();
            console.log('Prompts:', prompts);

            // 处理进程终止信号
            process.on('SIGINT', async () => {
                console.log('\nReceived SIGINT. Disconnecting...');
                await client.disconnect();
                process.exit(0);
            });

            process.on('SIGTERM', async () => {
                console.log('\nReceived SIGTERM. Disconnecting...');
                await client.disconnect();
                process.exit(0);
            });
        } catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    })();
}