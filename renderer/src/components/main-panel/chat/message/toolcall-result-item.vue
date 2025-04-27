<template>
    <el-scrollbar width="100%">
        <div v-if="props.item.type === 'text'" class="tool-text">
            {{ props.item.text }}
        </div>

        <div v-else-if="props.item.type === 'image'" class="tool-image">
            <div class="media-item">
                <img :src="thumbnail" alt="screenshot"/>
                <span class="float-container">
                    <span class="iconfont icon-image"></span>
                </span>
            </div>

            <span v-if="!finishProcess">
                <el-progress
                    class="progress"
                    :percentage="progress"
                    :stroke-width="3"
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
import { getBlobUrlByFilename } from '@/hook/util';
import { defineComponent, PropType, defineProps, ref, defineEmits } from 'vue';

defineComponent({ name: 'toolcall-result-item' });
const emit = defineEmits(['update:item', 'update:ocr-done']);

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
const progressText = ref('OCR');
const finishProcess = ref(true);

if (ocr) {
    finishProcess.value = false;
    const bridge = useMessageBridge();
    const cancel = bridge.addCommandListener('ocr/worker/log', data => {
        finishProcess.value = false;
        const { id, progress: p = 1.0, status = 'finish' } = data;
        if (id === workerId) {
            progressText.value = status;
            progress.value = Math.min(Math.ceil(Math.max(p * 100 ,0)), 100);
        }
    }, { once: false });

    bridge.addCommandListener('ocr/worker/done', () => {
        progress.value = 1;
        finishProcess.value = true;

        if (props.item._meta) {
            const { _meta, ...rest } = props.item;
            emit('update:item', { ...rest });
        }

        emit('update:ocr-done');

        cancel();
    }, { once: true });
}


const thumbnail = ref('');

if (props.item.data) {
    console.log(props.item.data);
    getBlobUrlByFilename(props.item.data).then(url => {
        console.log(url);
        
        if (url) {
            thumbnail.value = url;
        }
    });
}

</script>

<style>
.tool-image {
    position: relative;
}

.tool-image .progress {
    margin-top: 10px;
}

.percentage-label {
    margin-right: 10px;
}

.tool-image .media-item {
    position: relative;
    width: 100px;
    height: 100px;
    background-color: var(--sidebar);
    border-radius: .5em;
    display: flex;
    justify-content: center;
    align-items: center;
}

.tool-image .media-item .iconfont {
    font-size: 40px;
}

.tool-image .media-item {
    object-fit: cover;
    overflow: hidden;
}

.tool-image .media-item > img {
    position: absolute;
    top: 50%;
    height: 100%;
    width: 100%;
    object-fit: cover;
    transform: translateY(-50%);
}

.tool-image .media-item .float-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100px;
    height: 100px;
    background-color: rgba(0, 0, 0, 0.5);
    opacity: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: var(--animation-3s);
}

.tool-image .media-item .float-container .iconfont {
    color: var(--background);
}

.tool-image .media-item:hover .float-container {
    opacity: 1;
}

</style>