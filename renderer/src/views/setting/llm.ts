import { reactive } from 'vue';
import { pinkLog } from './util';
import { saveSetting } from '@/hook/setting';

export const llms = reactive<any[]>([]);

export const llmManager = reactive({
	currentModelIndex: 0,
});
