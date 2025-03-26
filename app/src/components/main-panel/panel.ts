import { reactive } from 'vue';

interface Tab {
	name: string;
	icon: string;
	type: string;
}

export const tabs = reactive({
	content: [
		{
			name: '空白的测试',
			icon: 'icon-blank',
			type: 'blank'
		}
	] as Tab[],
	activeIndex: 0
});

let tabCounter = 1;

export function addNewTab() {
	const newTab = {
		name: `新标签页 ${tabCounter++}`,
		icon: 'icon-blank',
		type: 'blank'
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