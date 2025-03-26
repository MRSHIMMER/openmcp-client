import { reactive } from 'vue';

export const tabs = reactive({
	content: [
		{
			name: '空白的测试',
			icon: 'icon-blank',
			type: 'blank'
		}
	],
});

export function addNewTab() {
	console.log();
}