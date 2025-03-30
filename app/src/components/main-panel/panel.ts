import { reactive } from 'vue';

import Resource from './resource/index.vue';
import Chat from './chat/index.vue';
import Prompt from './prompt/index.vue';
import Tool from './tool/index.vue';

interface Tab {
	name: string;
	icon: string;
	type: string;
    component: any;
    storage: Record<string, any>;
}

export const debugModes = [
    Resource, Prompt, Tool, Chat
]

// TODO: 实现对于 tabs 这个数据的可持久化
export const tabs = reactive({
	content: [
		{
			name: '空白测试 1',
			icon: 'icon-blank',
			type: 'blank',
            component: undefined,
            storage: {}
		}
	] as Tab[],
	activeIndex: 0,
    get activeTab() {
        return this.content[this.activeIndex];
    }
});

let tabCounter = 1;

export function addNewTab() {
	const newTab = {
		name: `空白测试 ${++ tabCounter}`,
		icon: 'icon-blank',
		type: 'blank',
        component: undefined,
        storage: {}
	};
	tabs.content.push(newTab);
	tabs.activeIndex = tabs.content.length - 1;
}

export function setActiveTab(index: number) {
	if (index >= 0 && index < tabs.content.length) {
		tabs.activeIndex = index;
	}
}

export function closeTab(index: number) {
	if (tabs.content.length <= 1) return; // 至少保留一个标签页
	
	tabs.content.splice(index, 1);
	
	// 调整活动标签索引
	if (tabs.activeIndex >= index) {
		tabs.activeIndex = Math.max(0, tabs.activeIndex - 1);
	}
}