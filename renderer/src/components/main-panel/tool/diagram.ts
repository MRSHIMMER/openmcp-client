import type { ElkNode } from 'elkjs/lib/elk-api';
import { TaskLoop } from '../chat/core/task-loop';
import type { Reactive } from 'vue';
import type { ChatStorage } from '../chat/chat-box/chat';
import { ElMessage } from 'element-plus';

export interface Edge {
	id: string;
	sources: string[];
	targets: string[];
	section?: any; // { startPoint: { x, y }, endPoint: { x, 
}

export type Node = ElkNode & {
	[key: string]: any;
};

export interface DiagramState {
	nodes: Node[];
	edges: Edge[];
	selectedNodeId: string | null;
	[key: string]: any;
}

export interface CanConnectResult {
	canConnect: boolean;
	reason?: string;
}

/**
 * @description 判断两个节点是否可以连接
 */
export function invalidConnectionDetector(state: DiagramState, d: Node): CanConnectResult {
	const from = state.selectedNodeId;
    const to = d.id;

	if (!from) {
		return { canConnect: false, reason: '未选择起始节点' };
	}

	if (from === to) {
        return { canConnect: false, reason: '不能连接到自身' };
    }

	// 建立邻接表
	const adjacencyList: Record<string, Set<string>> = {};
	state.edges.forEach(edge => {
		const src = edge.sources[0];
		const tgt = edge.targets[0];
		if (!adjacencyList[src]) {
			adjacencyList[src] = new Set();
		}
		adjacencyList[src].add(tgt);
	});
	
	// DFS 检测是否存在
	function hasPath(current: string, target: string, visited: Set<string>): boolean {
		if (current === target) return true;
		visited.add(current);
		const neighbors = adjacencyList[current] || new Set();
		for (const neighbor of neighbors) {
			if (!visited.has(neighbor)) {
				if (hasPath(neighbor, target, visited)) {
					return true;
				}
			}
		}
		return false;
	}

	if (hasPath(to, from, new Set())) {
		return { canConnect: false, reason: '连接会形成环路' };
	}
	
	if (hasPath(from, to, new Set())) {
		return { canConnect: false, reason: '这是一个重复的连接' };
	}

	return {
		canConnect: true
	}
}

/**
 * @description 拓扑排序，输出每一层可以并行调度的节点id数组
 * @returns string[][] 每一层可以并行调度的节点id数组
 */
export function topoSortParallel(state: DiagramState): string[][] {
    // 统计每个节点的入度
    const inDegree: Record<string, number> = {};
    state.nodes.forEach(node => {
        inDegree[node.id] = 0;
    });
    state.edges.forEach(edge => {
        const tgt = edge.targets[0];
        if (tgt in inDegree) {
            inDegree[tgt]++;
        }
    });

    // 初始化队列，收集所有入度为0的节点
    const result: string[][] = [];
    let queue: string[] = Object.keys(inDegree).filter(id => inDegree[id] === 0);

    const visited = new Set<string>();

    while (queue.length > 0) {
        // 当前层可以并行的节点
        result.push([...queue]);
        const nextQueue: string[] = [];
        for (const id of queue) {
            visited.add(id);
            // 遍历所有以当前节点为源的边，减少目标节点的入度
            state.edges.forEach(edge => {
                if (edge.sources[0] === id) {
                    const tgt = edge.targets[0];
                    inDegree[tgt]--;
                    // 如果目标节点入度为0且未访问过，加入下一层
                    if (inDegree[tgt] === 0 && !visited.has(tgt)) {
                        nextQueue.push(tgt);
                    }
                }
            });
        }
        queue = nextQueue;
    }

    // 检查是否有环
    if (visited.size !== state.nodes.length) {
        throw new Error('图中存在环，无法进行拓扑排序');
    }

    return result;
}

export async function makeNodeTest(dataView: Reactive<any>, enableXmlWrapper: boolean, prompt: string | null = null) {
    if (!dataView.tool.inputSchema) {
		return;
	}

    dataView.loading = true;

    try {
        const loop = new TaskLoop({ maxEpochs: 1 });
        const usePrompt = prompt || `please call the tool ${dataView.too.name} to make some test`;
        const chatStorage = {
            messages: [],
            settings: {
                temperature: 0.6,
                systemPrompt: '',
                enableTools: [{
                    name: dataView.too.name,
                    description: dataView.too.description,
                    inputSchema: dataView.too.inputSchema,
                    enabled: true
                }],
                enableWebSearch: false,
                contextLength: 5,
                enableXmlWrapper,
                parallelToolCalls: false
            }
        } as ChatStorage;

        loop.setMaxEpochs(1);

        let aiMockJson: any = undefined;

        loop.registerOnToolCall(toolCall => {
            console.log(toolCall);
            
            if (toolCall.function?.name === dataView.too?.name) {
                try {
                    const toolArgs = JSON.parse(toolCall.function?.arguments || '{}');
                    aiMockJson = toolArgs;
                } catch (e) {
                    // ElMessage.error('AI 生成的 JSON 解析错误');
                }
            } else {
                // ElMessage.error('AI 调用了未知的工具');
            }
            loop.abort();
            return toolCall;
        });

        loop.registerOnError(error => {
            ElMessage.error(error + '');
        });

        await loop.start(chatStorage, usePrompt);

    } finally {
        dataView.loading = false;
    }
};