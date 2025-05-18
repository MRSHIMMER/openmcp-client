import { reactive, type Reactive } from "vue";

export type ConnectionType = 'STDIO' | 'SSE' | 'STREAMABLE_HTTP';

export interface ConnectionTypeOptionItem {
    value: ConnectionType;
    label: string;
}

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

export interface IConnectionArgs {
    type: ConnectionType;
    commandString?: string;
    cwd?: string;
    urlString?: string;
}

export class McpClient {
    public clientId?: string;
    public name?: string;
    public version?: string;
    public connectionArgs: Reactive<IConnectionArgs>;

    constructor() {
        this.connectionArgs = reactive({
            type: 'STDIO',
            commandString: '',
            cwd: '',
            urlString: ''
        });
    }

    async connect() {

    }
}

// 用于描述一个连接的数据结构
export interface McpServer {
    type: ConnectionType;
    clientId: string;
    name: string;

}