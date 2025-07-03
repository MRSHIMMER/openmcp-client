<template>
    <div class="diagram-item-record" v-if="props.dataView && props.dataView.tool">
        <div class="item-header">
            <span class="item-title">{{ props.dataView.tool.name }}</span>
            <span class="item-status" :class="props.dataView.status">{{ props.dataView.status }}</span>
        </div>
        <div class="item-desc">{{ props.dataView.tool.description }}</div>
        
        <div v-if="props.dataView.function !== undefined" class="item-result">
            <span class="item-label">Function</span>
            <pre class="item-json">{{ props.dataView.function.name }}</pre>
            <span class="item-label">Arguments</span>
            <pre class="item-json">{{ formatJson(props.dataView.function.arguments) }}</pre>
        </div>

    <div v-if="props.dataView.result !== undefined" class="item-result">
        <span class="item-label">Result</span>
        <template v-if="Array.isArray(props.dataView.result)">
            <div
                v-for="(item, idx) in props.dataView.result"
                :key="idx"
                class="result-block"
            >
                <pre class="item-json" v-if="typeof item === 'object' && item.text !== undefined">{{ item.text }}</pre>
                <pre class="item-json" v-else>{{ formatJson(item) }}</pre>
            </div>
        </template>
        <pre class="item-json" v-else-if="typeof props.dataView.result === 'string'">{{ props.dataView.result }}</pre>
        <pre class="item-json" v-else>{{ formatJson(props.dataView.result) }}</pre>
    </div>
    </div>
    <div v-else class="diagram-item-record">
        <div class="item-header">
            <span class="item-title">No Tool Selected</span>
        </div>
        <div class="item-desc">Please select a tool to view its details.</div>
    </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { NodeDataView } from './diagram';

const props = defineProps({
    dataView: {
        type: Object as PropType<NodeDataView | undefined | null>,
        required: true
    }
})

function formatJson(obj: any) {
    try {
        return JSON.stringify(obj, null, 2)
    } catch {
        return String(obj)
    }
}
</script>

<style scoped>
.diagram-item-record {
    padding: 14px 18px;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    font-size: 15px;
    max-width: 300px;
    word-break: break-all;
}

.item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
}

.item-title {
    font-weight: bold;
    font-size: 17px;
    color: var(--main-color, #409EFF);
}

.item-status {
    font-size: 13px;
    padding: 2px 10px;
    border-radius: 12px;
    margin-left: 8px;
    text-transform: capitalize;
}
.item-status.running { color: #2196f3; }
.item-status.success { color: #43a047; }
.item-status.error { color: #e53935; }
.item-status.waiting { color: #aaa; }
.item-status.default { color: #888; }

.item-desc {
    margin-bottom: 8px;
    opacity: 0.8;
    font-size: 14px;
}

.item-label {
    font-weight: 500;
    margin-right: 4px;
    color: var(--main-color, #409EFF);
}

.item-json {
    border-radius: 4px;
    padding: 6px 10px;
    font-size: 13px;
    font-family: var(--code-font-family, monospace);
    margin: 2px 0 8px 0;
    white-space: pre-wrap;
    word-break: break-all;
}

.item-result {
    margin-top: 6px;
}

.result-block {
    margin-bottom: 6px;
    border-radius: .5em;
    background-color: rgba(245, 108, 108, 0.3);
}
</style>