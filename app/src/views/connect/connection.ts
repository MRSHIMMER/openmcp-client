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

export function onconnectionmethodchange() {
	console.log();
	
}