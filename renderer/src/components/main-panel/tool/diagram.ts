import type { ElkNode } from 'elkjs/lib/elk-api';

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


// export async function generateAIMockData(params: any) {
//     if (!currentTool.value?.inputSchema) return;
//     aiMockLoading.value = true;
//     try {
//         const loop = new TaskLoop({ maxEpochs: 1 });
//         const usePrompt = prompt || `please call the tool ${currentTool.value.name} to make some test`;
//         const chatStorage = {
//             messages: [],
//             settings: {
//                 temperature: 0.6,
//                 systemPrompt: '',
//                 enableTools: [{
//                     name: currentTool.value.name,
//                     description: currentTool.value.description,
//                     inputSchema: currentTool.value.inputSchema,
//                     enabled: true
//                 }],
//                 enableWebSearch: false,
//                 contextLength: 5,
//                 enableXmlWrapper: enableXmlWrapper.value,
//                 parallelToolCalls: false
//             }
//         } as ChatStorage;

//         loop.setMaxEpochs(1);

//         let aiMockJson: any = undefined;

//         loop.registerOnToolCall(toolCall => {
//             console.log(toolCall);
            
//             if (toolCall.function?.name === currentTool.value?.name) {
//                 try {
//                     const toolArgs = JSON.parse(toolCall.function?.arguments || '{}');
//                     aiMockJson = toolArgs;
//                 } catch (e) {
//                     ElMessage.error('AI 生成的 JSON 解析错误');
//                 }
//             } else {
//                 ElMessage.error('AI 调用了未知的工具');
//             }
//             loop.abort();
//             return toolCall;
//         });

//         loop.registerOnError(error => {
//             ElMessage.error(error + '');
//         });

//         await loop.start(chatStorage, usePrompt);

//         if (aiMockJson && typeof aiMockJson === 'object') {
//             Object.keys(aiMockJson).forEach(key => {
//                 tabStorage.formData[key] = aiMockJson[key];
//             });
//             formRef.value?.clearValidate?.();
//         }
//     } finally {
//         aiMockLoading.value = false;
//     }
// };