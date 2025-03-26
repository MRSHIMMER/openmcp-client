import { reactive } from 'vue';

export const connectionMethods = reactive({
	current: 'stdio',
	data: [
		{
			value: 'stdio',
			label: 'stdio'
		},
		{
			value: 'sse',
			label: 'sse'
		}
	]
});

export const connectionCommand = reactive({
	commandString: ''
});

export interface EnvItem {
	key: string
	value: string
}

export interface IConnectionEnv {
	data: EnvItem[]
	newKey: string
	newValue: string
}

export const connectionEnv = reactive<IConnectionEnv>({
	data: [],
	newKey: '',
	newValue: ''
});

export function onconnectionmethodchange() {
	console.log();
	
}