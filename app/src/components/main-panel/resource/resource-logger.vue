<template>
    <div class="resource-logger">
		<span>{{ "Response" }}</span>
		<el-scrollbar height="300px">
			<div
				class="output-content"
				contenteditable="false"
			>
				<span v-for="(content, index) of tabStorage.lastResourceReadResponse?.contents || []" :key="index">
                    {{ content.text }}
                </span>
			</div>
		</el-scrollbar>
    </div>
</template>

<script setup lang="ts">
import { defineComponent, defineProps } from 'vue';
import { tabs } from '../panel';
import { ResourceStorage } from './resources';

defineComponent({ name: 'resource-logger' });

const props = defineProps({
    tabId: {
        type: Number,
        required: true
    }
});

const tab = tabs.content[props.tabId];
const tabStorage = tab.storage as ResourceStorage;



</script>

<style>

.resource-logger {
    border-radius: .5em;
    background-color: var(--background);
    padding: 10px;
}

.resource-logger .output-content {
	border-radius: .5em;
	padding: 15px;
	min-height: 300px;
	height: fit-content;
	font-family: var(--code-font-family);
	white-space: pre-wrap;
	word-break: break-all;
	user-select: text;
	cursor: text;
	font-size: 15px;
	line-height: 1.5;
	background-color: var(--sidebar);
}

</style>