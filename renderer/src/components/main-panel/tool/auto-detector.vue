<template>
    <el-dialog v-model="showDiagram" width="800px" append-to-body class="no-padding-dialog">
        <template #title>
            <div style="display: flex; align-items: center;">
                <span>Tool Diagram</span>
                &ensp;
                <el-button size="small" type="primary" @click="() => context.reset()">重置</el-button>
                <!-- 自检程序弹出表单 -->
                <el-popover placement="top" width="350" trigger="click" v-model:visible="testFormVisible">
                    <template #reference>
                        <el-button size="small" type="primary">
                            开启自检程序
                        </el-button>
                    </template>

                    <el-input type="textarea" v-model="testPrompt" :rows="2" style="margin-bottom: 8px;"
                        placeholder="请输入 prompt" />
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <el-switch v-model="enableXmlWrapper" style="margin-right: 8px;" />
                        <span style="opacity: 0.7;">enableXmlWrapper</span>
                    </div>
                    <div style="text-align: right;">
                        <el-button size="small" @click="testFormVisible = false">取消</el-button>
                        <el-button size="small" type="primary" @click="onTestConfirm">
                            确认
                        </el-button>
                    </div>
                </el-popover>
            </div>
        </template>
        <el-scrollbar height="80vh">
            <Diagram />
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

const showDiagram = ref(true);

const caption = ref('');
const showCaption = ref(false);

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
    reset: () => {},
    render: () => {},
    state: undefined,
    setCaption
};

provide('context', context);

// 新增：自检参数表单相关
const testFormVisible = ref(false);
const enableXmlWrapper = ref(false);
const testPrompt = ref('please call the tool {tool} to make some test');

async function onTestConfirm() {
    testFormVisible.value = false;
    // 这里可以将 enableXmlWrapper.value 和 testPrompt.value 传递给自检逻辑
    const state = context.state;
    if (state) {
        const dispatches = topoSortParallel(state);
        for (const nodeIds of dispatches) {
            await Promise.all(
                nodeIds.map(id => {
                    const node = state.dataView.get(id);
                    if (node) {
                        return makeNodeTest(node, enableXmlWrapper.value, testPrompt.value, context)
                    }
                })
            )
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