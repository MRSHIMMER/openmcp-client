import { useMessageBridge } from "@/api/message-bridge";
import { reactive, type Reactive } from "vue";
import type { IConnectionResult, ConnectionTypeOptionItem, IConnectionArgs, IConnectionEnvironment, McpOptions } from "./type";
import { ElMessage } from "element-plus";
import { loadPanels, type SaveTab } from "@/hook/panel";
import { getPlatform } from "@/api/platform";


export const connectionSelectDataViewOption: ConnectionTypeOptionItem[] = [
    {
        value: 'STDIO',
        label: 'STDIO'
    },
    {
        value: 'SSE',
        label: 'SSE'
    },
    {
        value: 'STREAMABLE_HTTP',
        label: 'STREAMABLE_HTTP'
    }
]

export async function getLaunchSignature(platform: string): Promise<IConnectionArgs[]> {
    const bridge = useMessageBridge();
    const { code, msg } = await bridge.commandRequest(platform + '/launch-signature');

    if (code !== 200) {
        const message = msg.toString();
        ElMessage.error(message);
        return [];
    }

    // 判断一下版本，新版本的 msg 应该是数组，老版本是对象
    // 返回的数组的第一个为主节点，其余为从节点
    if (Array.isArray(msg)) {
        return msg;
    }
    return [msg];
}



export class McpClient {
    
    public connectionArgs: Reactive<IConnectionArgs>;
    public connectionResult: Reactive<IConnectionResult>;
    
    public presetsEnvironment: string[] = ['HOME', 'LOGNAME', 'PATH', 'SHELL', 'TERM', 'USER'];
    public connectionEnvironment: Reactive<IConnectionEnvironment>;

    constructor(
        public clientVersion: string = '0.0.1',
        public clientNamePrefix: string = 'openmcp.connect'
    ) {
        // 连接入参
        this.connectionArgs = reactive({
            type: 'STDIO',
            commandString: '',
            cwd: '',
            url: '',
            oauth: ''
        });

        // 连接出参
        this.connectionResult = reactive({
            success: false,
            status: 'disconnected',
            clientId: '',
            name: '',
            version: '',
            logString: []
        });

        // 环境变量
        this.connectionEnvironment = reactive({
            data: [],
            newKey: '',
            newValue: ''
        });
    }

    async acquireConnectionSignature(args: IConnectionArgs) {
        this.connectionArgs.type = args.type;
        this.connectionArgs.commandString = args.commandString || '';
        this.connectionArgs.cwd = args.cwd || '';
        this.connectionArgs.url = args.url || '';
        this.connectionArgs.oauth = args.oauth || '';
    }

    get clientId() {
        return this.connectionResult.clientId;
    }

    get name() {
        return this.connectionResult.name;
    }

    get version() {
        return this.connectionResult.version;
    }

    get status() {
        return this.connectionResult.status;
    }

    get connected() {
        return this.connectionResult.success;
    }

    get env() {
        const env = {} as Record<string, string>;
        this.connectionEnvironment.data.forEach(item => {
            env[item.key] = item.value;
        });
        return env;
    }

    private get commandAndArgs() {
        const commandString = this.connectionArgs.commandString;

        if (!commandString) {
            return { command: '', args: [] };
        }

        const args = commandString.split(' ');
        const command = args.shift() || '';

        return { command, args };
    }

    get connectOption() {
        const { command, args } = this.commandAndArgs;
        const env = this.env;
        const url = this.connectionArgs.url;
        const oauth = this.connectionArgs.oauth;
        const connectionType = this.connectionArgs.type;

        const clientName = this.clientNamePrefix + '.' + this.connectionArgs.type;
        const clientVersion = this.clientVersion;

        const option: McpOptions = {
            connectionType,
            command,
            args,
            url,
            oauth,
            clientName,
            clientVersion,
            env,
            serverInfo: {
                name: this.connectionResult.name,
                version: this.connectionResult.version
            }
        };

        return option;
    }

    public async connect(platform: string) {
        const bridge = useMessageBridge();
        const { code, msg } = await bridge.commandRequest<IConnectionResult>('connect', this.connectOption);

        this.connectionResult.success = (code === 200);

        if (code !== 200) {
            const message = msg.toString();
            this.connectionResult.logString.push({
                type: 'error',
                message
            });
            
            ElMessage.error(message);
            return;
        }

        this.connectionResult.status = msg.status;
        this.connectionResult.clientId = msg.clientId;
        this.connectionResult.name = msg.name;
        this.connectionResult.version = msg.version;

        // 同步成功的连接参数到后端，更新 vscode treeview 中的列表
        const deserializeOption = JSON.parse(JSON.stringify(this.connectOption));

        bridge.postMessage({
            command: platform + '/update-connection-sigature',
            data: deserializeOption
        });
    }

    /**
     * @description 处理环境变量开关
     * - 开启时，刷新预设环境变量的数值
     * - 关闭时，清空预设环境变量的数值
     * @param enabled 
     */
    public async handleEnvSwitch(enabled: boolean) {
        const presetVars = this.presetsEnvironment;
        if (enabled) {
            const values = await this.lookupEnvVar(presetVars);
    
            if (values) {
                // 将 key values 合并进 connectionEnv.data 中
                // 若已有相同的 key, 则替换 value
                for (let i = 0; i < presetVars.length; i++) {
                    const key = presetVars[i];
                    const value = values[i];
                    const sameNameItems = this.connectionEnvironment.data.filter(item => item.key === key);
                    if (sameNameItems.length > 0) {
                        const conflictItem = sameNameItems[0];
                        conflictItem.value = value;
                    } else {
                        this.connectionEnvironment.data.push({
                            key: key, value: value
                        });
                    }
                }
            }
        } else {
            // 清空 connectionEnv.data 中所有 key 为 presetVars 的项
            const reserveItems = this.connectionEnvironment.data.filter(item => !presetVars.includes(item.key));
            this.connectionEnvironment.data = reserveItems;
        }
    }


    /**
     * @description 查询环境变量
     * @param varNames
     * @returns 
     */
    public async lookupEnvVar(varNames: string[]) {
        const bridge = useMessageBridge();
        const { code, msg } = await bridge.commandRequest('lookup-env-var', { keys: varNames });
                
        if (code === 200) {
            this.connectionResult.logString.push({
                type: 'info',
                message: '预设环境变量同步完成'
            });

            return msg;
        } else {
            this.connectionResult.logString.push({
                type: 'error',
                message: '预设环境变量同步失败: ' + msg
            });
        }
    }
}


class McpClientAdapter {
    public clients: McpClient[] = [];

    constructor(
        public platform: string
    ) {}

    public async launch() {
        const launchSignature = await getLaunchSignature(this.platform);

        for (const item of launchSignature) {
            const client = new McpClient();

            // 同步连接参数
            await client.acquireConnectionSignature(item);
            
            // 同步环境变量
            await client.handleEnvSwitch(true);

            // 连接
            await client.connect(this.platform);
            
            this.clients.push(client);
        }
    }

    public async loadPanels() {
        const masterNode = this.clients[0];
        await loadPanels(masterNode);
    }
}

const platform = getPlatform();
export const mcpClientAdapter = new McpClientAdapter(platform);