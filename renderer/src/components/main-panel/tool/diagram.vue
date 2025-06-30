<template>
    <div ref="svgContainer" class="diagram-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, reactive } from 'vue';
import * as d3 from 'd3';
import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js';
import { mcpClientAdapter } from '@/views/connect/core';

const svgContainer = ref<HTMLDivElement | null>(null);

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
        id: String(i),
        width: 160,
        height: 48,
        labels: [{ text: tool.name || 'Tool' }]
    }));

    // 默认按照链表进行串联
    state.edges = tools.slice(1).map((_, i) => ({
        id: `e${i}`,
        sources: [String(i)],
        targets: [String(i + 1)]
    }));

    await recomputeLayout();

    renderSvg();
};

function renderSvg() {
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
            .style('user-select', 'none');
    } else {
        svg.attr('width', width).attr('height', height);
        svg.selectAll('defs').remove();
    }

    // Arrow marker
    svg
        .append('defs')
        .append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 8)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 z')
        .attr('fill', 'var(--main-color)');

    // Draw edges with enter animation
    const allSections: { id: string, section: any }[] = [];
    (state.edges || []).forEach(edge => {
        const sections = edge.sections || [];
        sections.forEach((section, idx) => {
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
        .attr('x1', d => d.section.startPoint.x + 30)
        .attr('y1', d => d.section.startPoint.y + 30)
        .attr('x2', d => d.section.endPoint.x + 30)
        .attr('y2', d => d.section.endPoint.y + 30)
        .attr('stroke', 'var(--main-color)')
        .attr('stroke-width', 2.5)
        .attr('marker-end', 'url(#arrow)')
        .attr('opacity', 0);

    edgeEnter
        .transition()
        .duration(600)
        .attr('opacity', 1);

    edgeSelection.merge(edgeEnter)
        .transition()
        .duration(600)
        .ease(d3.easeCubicInOut)
        .attr('x1', d => d.section.startPoint.x + 30)
        .attr('y1', d => d.section.startPoint.y + 30)
        .attr('x2', d => d.section.endPoint.x + 30)
        .attr('y2', d => d.section.endPoint.y + 30);

    // --- 节点动画部分 ---
    const nodeGroup = svg.selectAll<SVGGElement, any>('.node')
        .data(state.nodes, d => d.id);

    nodeGroup.exit().remove();

    const nodeGroupEnter = nodeGroup.enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${(d.x || 0) + 30}, ${(d.y || 0) + 30})`)
        .style('cursor', 'pointer')
        .attr('opacity', 0)
        .on('mousedown', null)
        .on('mouseup', function (event, d) {
            event.stopPropagation();
            if (state.selectedNodeId && state.selectedNodeId !== d.id) {
                state.edges.push({
                    id: `e${state.selectedNodeId}_${d.id}_${Date.now()}`,
                    sources: [state.selectedNodeId],
                    targets: [d.id]
                });
                state.selectedNodeId = null;
                recomputeLayout().then(renderSvg);
            } else {
                state.selectedNodeId = d.id;
                renderSvg();
            }
            state.draggingNodeId = null;
        });

    nodeGroupEnter.append('rect')
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .attr('rx', 16)
        .attr('fill', d => state.selectedNodeId === d.id ? 'var(--main-color)' : 'var(--main-color)')
        .attr('opacity', d => state.selectedNodeId === d.id ? 0.25 : 0.12)
        .attr('stroke', 'var(--main-color)')
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
        .attr('opacity', 1);

    // 节点 update 动画
    nodeGroup
        .transition()
        .duration(600)
        .ease(d3.easeCubicInOut)
        .attr('transform', d => `translate(${(d.x || 0) + 30}, ${(d.y || 0) + 30})`);
}

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