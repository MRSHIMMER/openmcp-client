<template>
    <el-dialog v-model="showDiagram" width="800px" append-to-body class="no-padding-dialog">
        <template #title>
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span>Tool Diagram</span>
                <el-button size="small" type="primary" @click="() => {}">开启自检程序</el-button>
            </div>
        </template>
		<el-scrollbar height="80vh">
        	<Diagram />
		</el-scrollbar>
    </el-dialog>
    <!-- <el-button @click="showDiagram = true" type="primary" style="margin-bottom: 16px;">
        Show Tool Diagram
    </el-button> -->
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Diagram from './diagram.vue';

const showDiagram = ref(true);

</script>

<style>
.no-padding-dialog {
	margin-top: 30px !important;
}

</style>