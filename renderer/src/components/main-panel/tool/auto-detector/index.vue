<template>
    <el-dialog v-model="showDiagram" width="800px" append-to-body class="no-padding-dialog">
        <template #header>
            <div style="display: flex; align-items: center;">
                <span>Tool Diagram</span>
                &ensp;
                <el-button size="small" type="primary" @click="() => context.reset()">{{ t("reset") }}</el-button>
                <!-- 自检程序弹出表单 -->
                <el-popover placement="top" width="350" trigger="click" v-model:visible="testFormVisible">
                    <template #reference>
                        <el-button size="small" type="primary">
                            {{ t('start-auto-detect') }}
                        </el-button>
                    </template>

                    <el-input type="textarea" v-model="testPrompt" :rows="2" style="margin-bottom: 8px;"
                        placeholder="请输入 prompt" />
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <el-switch v-model="enableXmlWrapper" style="margin-right: 8px;" />
                        <span :style="{
                            opacity: enableXmlWrapper ? 1 : 0.7,
                            color: enableXmlWrapper ? 'var(--main-color)' : undefined
                        }">XML</span>
                    </div>
                    <div style="text-align: right;">
                        <el-button size="small" @click="testFormVisible = false">{{ t("cancel") }}</el-button>
                        <el-button size="small" type="primary" @click="onTestConfirm">
                            {{ t("confirm") }}
                        </el-button>
                    </div>
                </el-popover>
            </div>
        </template>
        <el-scrollbar height="80vh">
            <Diagram :tab-id="props.tabId" />
        </el-scrollbar>
        <transition name="main-fade" mode="out-in">
            <div class="caption" v-show="showCaption">
                {{ caption }}
            </div>
        </transition>
    </el-dialog>
</template>

<script setup lang="ts">
import { nextTick, provide, ref } from 'vue';
import Diagram from './diagram.vue';
import { makeNodeTest, topoSortParallel, type DiagramContext, type DiagramState } from './diagram';
import { ElMessage } from 'element-plus';

import { useI18n } from 'vue-i18n';
import type { ToolStorage } from '../tools';
import { tabs } from '../../panel';

const showDiagram = ref(true);
const { t } = useI18n();

const caption = ref('');
const showCaption = ref(false);

const props = defineProps({
    tabId: {
        type: Number,
        required: true
    }
});

function setCaption(text: string) {
    caption.value = text;
    if (caption.value) {
        nextTick(() => {
            showCaption.value = true;
        });
    } else {
        nextTick(() => {
            showCaption.value = false;
        });
    }
}

const context: DiagramContext = {
    reset: () => { },
    render: () => { },
    state: undefined,
    setCaption
};

provide('context', context);

const tab = tabs.content[props.tabId];
const tabStorage = tab.storage as ToolStorage;
const autoDetectDiagram = tabStorage.autoDetectDiagram;

if (autoDetectDiagram) {
    // ...
} else {
    tabStorage.autoDetectDiagram = {
        edges: [],
        views: []
    };
}

// 新增：自检参数表单相关
const testFormVisible = ref(false);
const enableXmlWrapper = ref(false);
const testPrompt = ref('please call the tool {tool} to make some test');

async function onTestConfirm() {
    testFormVisible.value = false;
    // 这里可以将 enableXmlWrapper.value 和 testPrompt.value 传递给自检逻辑
    const state = context.state;


    tabStorage.autoDetectDiagram!.views = [];

    if (state) {
        const dispatches = topoSortParallel(state);
        for (const nodeIds of dispatches) {
            for (const id of nodeIds) {
                const view = state.dataView.get(id);
                if (view) {
                    await makeNodeTest(view, enableXmlWrapper.value, testPrompt.value, context)
                    tabStorage.autoDetectDiagram!.views!.push({
                        tool: view.tool,
                        status: view.status,
                        function: view.function,
                        result: view.result
                    });
                }
            }
        }
    } else {
        ElMessage.error('error');
    }


}
</script>

<style>
.no-padding-dialog {
    margin-top: 30px !important;
}

.no-padding-dialog .caption {
    position: absolute;
    left: 20px;
    bottom: 10px;
    margin: 0 auto;
    width: fit-content;
    min-height: 32px;
    background: rgba(245, 247, 250, 0.05);
    border-radius: 8px;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.06);
    color: var(--main-color);
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 16px;
    z-index: 10;
    transition: background 0.2s;
}
</style>