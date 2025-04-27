<template>
    <el-scrollbar width="100%">
        <div v-if="props.item.type === 'text'" class="tool-text">
            {{ props.item.text }}
        </div>

        <div v-else-if="props.item.type === 'image'" class="tool-image">
            #{{ props.item.data }}
            <span v-if="!finishProcess">
                <el-progress 
                    :percentage="progress"
                    :stroke-width="2"
                    :show-text="false"
                >
                    <template #default="{ percentage }">
                        <span class="percentage-label">{{ progressText }}</span>
                        <span class="percentage-value">{{ percentage }}%</span>
                    </template>
                </el-progress>
            </span>
        </div>

        <div v-else class="tool-other">{{ JSON.stringify(props.item) }}</div>
    </el-scrollbar>
</template>

<script setup lang="ts">
import { useMessageBridge } from '@/api/message-bridge';
import { ToolCallContent } from '@/hook/type';
import { defineComponent, PropType, defineProps, ref, defineEmits } from 'vue';
import { tabs } from '../../panel';
import { IRenderMessage } from '../chat';

defineComponent({ name: 'toolcall-result-item' });
const emit = defineEmits(['update:item']);

const props = defineProps({
    item: {
        type: Object as PropType<ToolCallContent>,
        required: true
    }
});

const metaInfo = props.item._meta || {};
const { ocr = false, workerId = '' } = metaInfo;

// 确认当前已经完成，如果没有完成，说明
const progress = ref(0);
const progressText = ref('');
const finishProcess = ref(true);

if (ocr) {
    finishProcess.value = false;
    const bridge = useMessageBridge();
    const cancel = bridge.addCommandListener('ocr/worker/log', data => {
        finishProcess.value = false;
        const { id, progress: p = 1.0, status = 'finish' } = data;
        if (id === workerId) {
            progressText.value = status;
            progress.value = Math.min(Math.max(p * 100 ,0), 100);
        }
    }, { once: false });

    bridge.addCommandListener('ocr/worker/done', () => {
        progress.value = 1;
        finishProcess.value = true;

        if (props.item._meta) {
            const { _meta, ...rest } = props.item;
            emit('update:item', { ...rest });
        }

        cancel();
    }, { once: true });
}
</script>

<style>
.tool-image {
    position: relative;
}

.el-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
}
</style>