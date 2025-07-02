<template>
    <el-dialog v-model="showDiagram" width="800px" append-to-body class="no-padding-dialog">
        <template #title>
            <div style="display: flex; align-items: center;">
                <span>Tool Diagram</span>
                &ensp;
                <el-button size="small" type="primary" @click="() => context.reset()">重置</el-button>
                <el-button size="small" type="primary" @click="() => startTest()">开启自检程序</el-button>
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
    <!-- <el-button @click="showDiagram = true" type="primary" style="margin-bottom: 16px;">
        Show Tool Diagram
    </el-button> -->
</template>

<script setup lang="ts">
import { nextTick, provide, ref } from 'vue';
import Diagram from './diagram.vue';
import { topoSortParallel, type DiagramState } from './diagram';
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

interface DiagramContext {
	reset: () => void,
	state?: DiagramState,
	setCaption: (value: string) => void
}

const context: DiagramContext = {
    reset: () => {},
	state: undefined,
	setCaption
};

provide('context', context);

async function startTest() {
	const state = context.state;
	if (state) {
		const dispatches = topoSortParallel(state);
		// for (const layer of dispatches) {
		// 	await Promise.all(
		// 		layer.map(nodeId => state.nodes[nodeId].run())
		// 	);
		// }
		
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
    box-shadow: 0 2px 8px 0 rgba(0,0,0,0.06);
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