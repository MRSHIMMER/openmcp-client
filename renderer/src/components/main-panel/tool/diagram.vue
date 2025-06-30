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

    d3.select(svgContainer.value).selectAll('*').remove();

    const svg = d3
        .select(svgContainer.value)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('user-select', 'none');

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

    // Draw edges
    (state.edges || []).forEach(edge => {
        const sections = edge.sections || [];
        sections.forEach(section => {
            svg.append('line')
                .attr('x1', section.startPoint.x + 30)
                .attr('y1', section.startPoint.y + 30)
                .attr('x2', section.endPoint.x + 30)
                .attr('y2', section.endPoint.y + 30)
                .attr('stroke', 'var(--main-color)')
                .attr('stroke-width', 2.5)
                .attr('marker-end', 'url(#arrow)');
        });
    });

    // Draw nodes
    const nodeGroup = svg.selectAll('.node')
        .data(state.nodes, d => d.id)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${(d.x || 0) + 30}, ${(d.y || 0) + 30})`)
        .style('cursor', 'pointer')
        .on('mousedown', function (event, d) {
            event.stopPropagation();
            state.draggingNodeId = d.id;
            state.offset = {
                x: event.offsetX - ((d.x || 0) + 30),
                y: event.offsetY - ((d.y || 0) + 30)
            };
        })
        .on('mouseup', function (event, d) {
            event.stopPropagation();
            if (state.selectedNodeId && state.selectedNodeId !== d.id) {
                // Add new edge
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

    nodeGroup.append('rect')
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .attr('rx', 16)
        .attr('fill', d => state.selectedNodeId === d.id ? 'var(--main-color)' : 'var(--main-color)')
        .attr('opacity', d => state.selectedNodeId === d.id ? 0.25 : 0.12)
        .attr('stroke', 'var(--main-color)')
        .attr('stroke-width', 2);

    nodeGroup.append('text')
        .attr('x', d => d.width / 2)
        .attr('y', d => d.height / 2 + 6)
        .attr('text-anchor', 'middle')
        .attr('font-size', 16)
        .attr('fill', 'var(--main-color)')
        .attr('font-weight', 600)
        .text(d => d.labels?.[0]?.text || 'Tool');

    // Drag behavior
    d3.select(window)
        .on('mousemove.diagram', event => {
            if (state.draggingNodeId) {
                const node = state.nodes.find(n => n.id === state.draggingNodeId);
                if (node) {
                    node.x = event.offsetX - state.offset.x - 30;
                    node.y = event.offsetY - state.offset.y - 30;
                    renderSvg();
                }
            }
        })
        .on('mouseup.diagram', () => {
            if (state.draggingNodeId) {
                state.draggingNodeId = null;
                recomputeLayout().then(renderSvg);
            }
        });
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