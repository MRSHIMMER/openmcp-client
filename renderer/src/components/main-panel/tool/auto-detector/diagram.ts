import type { ElkNode } from 'elkjs/lib/elk-api';
import { MessageState, TaskLoop } from '../../chat/core/task-loop';
import type { Reactive } from 'vue';
import type { ChatStorage } from '../../chat/chat-box/chat';
import { ElMessage } from 'element-plus';
import type { ToolItem } from '@/hook/type';

import I18n from '@/i18n';
import type { ChatCompletionChunk } from 'openai/resources/index.mjs';

const { t } = I18n.global;

export interface Edge {
	id: string;
	sources: string[];
	targets: string[];
	sections?: any; // { startPoint: { x, y }, endPoint: { x, 
}

export type Node = ElkNode & {
	[key: string]: any;
    width: number;
    height: number;
    id: string;
};

export interface DiagramState {
	nodes: Node[];
	edges: Edge[];
	selectedNodeId: string | null;
    dataView: Map<string, NodeDataView>;
	[key: string]: any;
}

export interface CanConnectResult {
	canConnect: boolean;
	reason?: string;
}

export interface NodeDataView {
    tool: ToolItem;
    status: 'default' | 'running' | 'waiting' | 'success' | 'error';
    function?: ChatCompletionChunk.Choice.Delta.ToolCall.Function;
    createAt?: number;
    llmTimecost?: number;
    toolcallTimecost?: number;
    finishAt?: number;
    result?: any;
}

export interface DiagramContext {
    preset: (type: string) => void,
    render: () => void,
    state?: DiagramState,
    setCaption: (value: string) => void
}

/**
 * @description 判断两个节点是否可以连接
 */
export function invalidConnectionDetector(state: DiagramState, d: Node): CanConnectResult {
	const from = state.selectedNodeId;
    const to = d.id;

	if (!from) {
		return { canConnect: false, reason: t('not-select-begin-node') };
	}

	if (from === to) {
        return { canConnect: false, reason: '' };
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
		return { canConnect: false, reason: t('can-make-loop') };
	}
	
	if (hasPath(from, to, new Set())) {
		return { canConnect: false, reason: t('this-is-repeat-connection') };
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

export async function makeParallelTest(
    dataViews: Reactive<NodeDataView>[],
    enableXmlWrapper: boolean,
    prompt: string | null = null,
    context: DiagramContext
) {
    if (dataViews.length === 0) {
        return;
    }

    // 设置所有节点状态为运行中
    const createAt = Date.now();
    dataViews.forEach(dataView => {
        dataView.status = 'running';
        dataView.createAt = createAt;
    });
    context.render();

    try {
        const loop = new TaskLoop({ maxEpochs: 1 });
        
        // 构建所有工具的信息
        const allTools = dataViews.map(dataView => ({
            name: dataView.tool.name,
            description: dataView.tool.description,
            inputSchema: dataView.tool.inputSchema,
            enabled: true
        }));

        // 构建测试提示词，包含所有工具
        const toolNames = dataViews.map(dv => dv.tool.name).join(', ');
        const usePrompt = (prompt || 'please call the tools {tool} to make some test').replace('{tool}', toolNames);
        
        const chatStorage = {
            messages: [],
            settings: {
                temperature: 0.6,
                systemPrompt: '',
                enableTools: allTools,
                enableWebSearch: false,
                contextLength: 5,
                enableXmlWrapper,
                parallelToolCalls: true // 开启并行工具调用
            }
        } as ChatStorage;

        loop.setMaxEpochs(1);

        // 记录工具调用信息，用于匹配工具调用结果
        const toolCallMap: Map<string, Reactive<NodeDataView>> = new Map(); // toolCallId -> dataView
        let completedToolsCount = 0;
        
        loop.registerOnToolCall(toolCall => {
            // 找到对应的dataView
            const dataView = dataViews.find(dv => dv.tool.name === toolCall.function?.name);
            if (dataView) {
                dataView.function = toolCall.function;
                dataView.llmTimecost = Date.now() - createAt;
                context.render();
                
                // 记录工具调用ID与dataView的映射
                if (toolCall.id) {
                    toolCallMap.set(toolCall.id, dataView);
                }
            }
            return toolCall;
        });

        loop.registerOnToolCalled(toolCalled => {
            // 这里我们需要改变策略，因为没有工具调用ID信息
            // 对于并行调用，我们可以根据工具调用的顺序来匹配结果
            // 简单的策略：找到第一个仍在运行状态的工具
            const runningView = dataViews.find(dv => dv.status === 'running');
            if (runningView) {
                runningView.toolcallTimecost = Date.now() - createAt - (runningView.llmTimecost || 0);
                
                if (toolCalled.state === MessageState.Success) {
                    runningView.status = 'success';
                    runningView.result = toolCalled.content;
                } else {
                    runningView.status = 'error';
                    runningView.result = toolCalled.content;
                }
                
                completedToolsCount++;
                context.render();
                
                // 如果所有工具都完成了，终止循环
                if (completedToolsCount >= dataViews.length) {
                    loop.abort();
                }
            }
            return toolCalled;
        });

        loop.registerOnError(error => {
            dataViews.forEach(dataView => {
                if (dataView.status === 'running') {
                    dataView.status = 'error';
                    dataView.result = error;
                }
            });
            context.render();
        });

        await loop.start(chatStorage, usePrompt);

    } finally {
        const finishAt = Date.now();
        dataViews.forEach(dataView => {
            dataView.finishAt = finishAt;
            if (dataView.status === 'running') {
                dataView.status = 'success';
            }
        });
        context.render();
    }
}

export async function makeNodeTest(
    dataView: Reactive<NodeDataView>,
    enableXmlWrapper: boolean,
    prompt: string | null = null,
    context: DiagramContext
) {
    if (!dataView.tool.inputSchema) {
		return;
	}

    dataView.status = 'running';
    const createAt = Date.now();
    dataView.createAt = createAt;
    context.render();

    try {
        const loop = new TaskLoop({ maxEpochs: 1 });
        const usePrompt = (prompt || 'please call the tool {tool} to make some test').replace('{tool}', dataView.tool.name);
        const chatStorage = {
            messages: [],
            settings: {
                temperature: 0.6,
                systemPrompt: '',
                enableTools: [{
                    name: dataView.tool.name,
                    description: dataView.tool.description,
                    inputSchema: dataView.tool.inputSchema,
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
            dataView.function = toolCall.function;
            dataView.llmTimecost = Date.now() - createAt;

            if (toolCall.function?.name === dataView.tool?.name) {
                try {
                    const toolArgs = JSON.parse(toolCall.function?.arguments || '{}');
                    aiMockJson = toolArgs;
                } catch (e) {
                    dataView.status = 'error';
                    dataView.result = t('ai-gen-error-json');
                    context.render();
                    loop.abort();
                }
            } else {
                dataView.status = 'error';
                dataView.result = t('ai-invoke-unknown-tool') +  ' ' + toolCall.function?.name;
                context.render();
                loop.abort();
            }
            return toolCall;
        });

        loop.registerOnToolCalled(toolCalled => {
            dataView.toolcallTimecost = Date.now() - createAt - dataView.llmTimecost!;

            if (toolCalled.state === MessageState.Success) {
                dataView.status = 'success';
                dataView.result = toolCalled.content;
            } else {
                dataView.status = 'error';
                dataView.result = toolCalled.content;
            }
            loop.abort();
            return toolCalled;
        })

        loop.registerOnError(error => {
            dataView.status = 'error';
            dataView.result = error;
            context.render();
        });

        await loop.start(chatStorage, usePrompt);

    } finally {
        dataView.finishAt = Date.now();

        if (dataView.status === 'running') {
            dataView.status = 'success';
            context.render();
        }
    }
};