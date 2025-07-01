<template>
    <div style="display: flex; align-items: center; gap: 16px;">
        <div ref="svgContainer" class="diagram-container"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, reactive, inject } from 'vue';
import * as d3 from 'd3';
import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js';
import { mcpClientAdapter } from '@/views/connect/core';

const svgContainer = ref<HTMLDivElement | null>(null);
let prevNodes: any[] = [];
let prevEdges: any[] = [];

type Node = ElkNode & {
    [key: string]: any;
};

const state = reactive({
    nodes: [] as any[],
    edges: [] as any[],
    selectedNodeId: null as string | null,
    draggingNodeId: null as string | null,
    offset: { x: 0, y: 0 }
});

const getAllTools = async () => {
    const items = [];
    for (const client of mcpClientAdapter.clients) {
        const clientTools = await client.getTools();
        items.push(...clientTools.values());
    }
    return items;
};

const recomputeLayout = async () => {
    const elk = new ELK();
    const elkGraph = {
        id: 'root',
        layoutOptions: {
            'elk.direction': 'DOWN',
            'elk.spacing.nodeNode': '40',
            'elk.layered.spacing.nodeNodeBetweenLayers': '40'
        },
        children: state.nodes,
        edges: state.edges
    };
    const layout = await elk.layout(elkGraph) as Node;
    state.nodes.forEach((n, i) => {
        const ln = layout.children?.find(c => c.id === n.id);
        if (ln) {
            n.x = ln.x;
            n.y = ln.y;
            n.width = ln.width;
            n.height = ln.height;
        }
    });
    state.edges = layout.edges || [];
    return layout;
};

const drawDiagram = async () => {
    const tools = await getAllTools();
    
    state.nodes = tools.map((tool, i) => ({
        id: tool.name,
        width: 160,
        height: 48,
        labels: [{ text: tool.name || 'Tool' }]
    }));

    // 默认按照链表进行串联
    const edges = [];
    for (let i = 0; i < tools.length - 1; ++ i) {
        const prev = tools[i];
        const next = tools[i + 1];
        edges.push({
            id: prev.name + '-' + next.name,
            sources: [prev.name],
            targets: [next.name]
        })
    }

    state.edges = edges;

    // 重新计算布局
    await recomputeLayout();

    // 绘制 svg
    renderSvg();
};

function renderSvg() {
    const prevNodeMap = new Map(prevNodes.map(n => [n.id, n]));
    const prevEdgeMap = new Map(prevEdges.map(e => [e.id, e]));

    const width = Math.max(...state.nodes.map(n => (n.x || 0) + (n.width || 160)), 400) + 60;
    const height = Math.max(...state.nodes.map(n => (n.y || 0) + (n.height || 48)), 300) + 60;

    // 不再全量清空，只清空 svg 元素
    let svg = d3.select(svgContainer.value).select('svg');
    if (svg.empty()) {
        svg = d3
            .select(svgContainer.value)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('user-select', 'none') as any;
    } else {
        svg.attr('width', width).attr('height', height);
        svg.selectAll('defs').remove();
    }

    // Arrow marker
    svg
        .append('defs')
        .append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 0 8 8')
        .attr('refX', 6)
        .attr('refY', 4)
        .attr('markerWidth', 5)
        .attr('markerHeight', 5)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M 0 0 L 8 4 L 0 8 z')
        .attr('fill', 'var(--main-color)');

    // Draw edges with enter animation
    const allSections: { id: string, section: any }[] = [];
    (state.edges || []).forEach(edge => {
        const sections = edge.sections || [];
        sections.forEach((section: any, idx: number) => {
            allSections.push({
                id: (edge.id || '') + '-' + (section.id || idx),
                section
            });
        });
    });

    const edgeSelection = svg.selectAll<SVGLineElement, any>('.edge')
        .data(allSections, d => d.id);

    edgeSelection.exit().remove();

    const edgeEnter = edgeSelection.enter()
        .append('line')
        .attr('class', 'edge')
        .attr('x1', d => {
            const prev = prevEdgeMap.get(d.id);
            return prev && prev.sections && prev.sections[0]
                ? prev.sections[0].startPoint.x + 30
                : d.section.startPoint.x + 30;
        })
        .attr('y1', d => {
            const prev = prevEdgeMap.get(d.id);
            return prev && prev.sections && prev.sections[0]
                ? prev.sections[0].startPoint.y + 30
                : d.section.startPoint.y + 30;
        })
        .attr('x2', d => {
            const prev = prevEdgeMap.get(d.id);
            return prev && prev.sections && prev.sections[0]
                ? prev.sections[0].endPoint.x + 30
                : d.section.endPoint.x + 30;
        })
        .attr('y2', d => {
            const prev = prevEdgeMap.get(d.id);
            return prev && prev.sections && prev.sections[0]
                ? prev.sections[0].endPoint.y + 30
                : d.section.endPoint.y + 30;
        })
        .attr('stroke', 'var(--main-color)')
        .attr('stroke-width', 2.5)
        .attr('marker-end', 'url(#arrow)')
        .attr('opacity', 0);

    edgeEnter
        .transition()
        .duration(600)
        .attr('opacity', 1)
        .attr('x1', d => d.section.startPoint.x + 30)
        .attr('y1', d => d.section.startPoint.y + 30)
        .attr('x2', d => d.section.endPoint.x + 30)
        .attr('y2', d => d.section.endPoint.y + 30);

    // update + 动画（注意这里不再 transition opacity）
    edgeSelection.merge(edgeEnter)
        .transition()
        .duration(600)
        .ease(d3.easeCubicInOut)
        .attr('x1', d => d.section.startPoint.x + 30)
        .attr('y1', d => d.section.startPoint.y + 30)
        .attr('x2', d => d.section.endPoint.x + 30)
        .attr('y2', d => d.section.endPoint.y + 30)
        .attr('opacity', 1);

    // --- 节点动画部分 ---
    const nodeGroup = svg.selectAll<SVGGElement, any>('.node')
        .data(state.nodes, d => d.id);

    nodeGroup.exit().remove();

    // 节点 enter
    const nodeGroupEnter = nodeGroup.enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => {
            const prev = prevNodeMap.get(d.id);
            if (prev) {
                return `translate(${(prev.x || 0) + 30}, ${(prev.y || 0) + 30})`;
            }
            return `translate(${(d.x || 0) + 30}, ${(d.y || 0) + 30})`;
        })
        .style('cursor', 'pointer')
        .attr('opacity', 0)
        .on('mousedown', null)
        .on('mouseup', function (event, d) {
            event.stopPropagation();
            if (state.selectedNodeId && state.selectedNodeId !== d.id) {
                // 检查是否已存在这条连线
                const exists = state.edges.some(
                    e =>
                        Array.isArray(e.sources) &&
                        Array.isArray(e.targets) &&
                        e.sources[0] === state.selectedNodeId &&
                        e.targets[0] === d.id
                );
                if (!exists) {
                    state.edges.push({
                        id: `e${state.selectedNodeId}_${d.id}_${Date.now()}`,
                        sources: [state.selectedNodeId],
                        targets: [d.id]
                    });
                    state.selectedNodeId = null;
                    recomputeLayout().then(renderSvg);
                } else {
                    // 已存在则只取消选中
                    state.selectedNodeId = null;
                    renderSvg();
                }
                context.caption.value = '';

            } else {
                state.selectedNodeId = d.id;
                renderSvg();
                context.caption.value = '选择另一个节点以构建顺序';
            }
            state.draggingNodeId = null;
        })
        .on('mouseover', function (event, d) {
            d3.select(this).select('rect')
                .transition()
                .duration(200)
                .attr('stroke', 'var(--main-color)')
                .attr('stroke-width', 2);
        })
        .on('mouseout', function (event, d) {
            if (state.selectedNodeId === d.id) {
                return;
            }
            d3.select(this).select('rect')
                .transition()
                .duration(200)
                .attr('stroke', 'var(--main-light-color-10)')
                .attr('stroke-width', 1);
        });

    nodeGroupEnter.append('rect')
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .attr('rx', 16)
        .attr('fill', 'var(--main-light-color-20)')
        .attr('stroke', d => state.selectedNodeId === d.id ? 'var(--main-color)' : 'var(--main-light-color-10)')
        .attr('stroke-width', 2);

    nodeGroupEnter.append('text')
        .attr('x', d => d.width / 2)
        .attr('y', d => d.height / 2 + 6)
        .attr('text-anchor', 'middle')
        .attr('font-size', 16)
        .attr('fill', 'var(--main-color)')
        .attr('font-weight', 600)
        .text(d => d.labels?.[0]?.text || 'Tool');

    // 节点 enter 动画
    nodeGroupEnter
        .transition()
        .duration(600)
        .attr('opacity', 1)
        .attr('transform', d => `translate(${(d.x || 0) + 30}, ${(d.y || 0) + 30})`);

    // 节点 update 动画
    nodeGroup
        .transition()
        .duration(600)
        .ease(d3.easeCubicInOut)
        .attr('transform', d => `translate(${(d.x || 0) + 30}, ${(d.y || 0) + 30})`);

    // 高亮选中节点动画
    nodeGroup.select('rect')
        .transition()
        .duration(400)
        .attr('stroke-width', d => state.selectedNodeId === d.id ? 2 : 1)
        .attr('stroke', d => state.selectedNodeId === d.id ? 'var(--main-color)' : 'var(--main-light-color-10)');
    
    // 边高亮
    svg.selectAll<SVGLineElement, any>('.edge')
        .on('mouseover', function () {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('stroke', 'var(--main-color)')
                .attr('stroke-width', 4.5);

            context.caption.value = '点击边以删除';
            
        })
        .on('mouseout', function () {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('stroke', 'var(--main-color)')
                .attr('stroke-width', 2.5);
        
            context.caption.value = '';
        
        })
        .on('click', function (event, d) {
            // 只删除当前 edge
            state.edges = state.edges.filter(e => {
                // 多段 edge 情况
                if (e.sections) {
                    // 只保留不是当前 section 的
                    return !e.sections.some((section: any, idx: number) =>
                        ((e.id || '') + '-' + (section.id || idx)) === d.id
                    );
                }
                // 单段 edge 情况
                return e.id !== d.id && e.id !== d.section?.id;
            });
            recomputeLayout().then(renderSvg);
            event.stopPropagation();
        });

    // 渲染结束后保存当前快照
    prevNodes = state.nodes.map(n => ({ ...n }));
    prevEdges = (state.edges || []).map(e => ({ ...e, sections: e.sections ? e.sections.map((s: any) => ({ ...s })) : [] }));
}

// 重置连接为链表结构
function resetConnections() {
    if (!state.nodes.length) return;
    const edges = [];
    for (let i = 0; i < state.nodes.length - 1; ++ i) {
        const prev = state.nodes[i];
        const next = state.nodes[i + 1];
        edges.push({
            id: prev.id + '-' + next.id,
            sources: [prev.id],
            targets: [next.id]
        });
    }
    state.edges = edges;
    recomputeLayout().then(renderSvg);
}

const context = inject('context') as any;
context.reset = resetConnections;

onMounted(() => {
    nextTick(drawDiagram);
});
</script>

<style>
.diagram-container {
    width: 100%;
    min-height: 300px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    border-radius: 8px;
    padding: 24px 0;
    overflow-x: auto;
}
</style>