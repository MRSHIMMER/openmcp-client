<template>
	<div class="debug-welcome">
		<span>{{ t('choose-a-project-debug') }}</span>
		<div class="welcome-container">
			<!-- TODO: 支持更多的 server -->
			<span
				class="debug-option"
				:class="{ 'disable': !connectionResult.success }"
				v-for="(option, index) of debugOptions"
				:key="index"
                @click="chooseDebugMode(index)"
			>
				<span>
					<span :class="`iconfont ${option.icon}`"></span>
				</span>
				<span>{{ option.name }}</span>
			</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { debugModes, tabs } from '@/components/main-panel/panel';
import { defineComponent, markRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { connectionResult } from '../connect/connection';
import { ElMessage } from 'element-plus';

defineComponent({ name: 'welcome' });

const { t } = useI18n();

const debugOptions = [
	{
		icon: 'icon-file',
		name: t("resources"),
		ident: 'resources'
	},
	{
		icon: 'icon-chat',
		name: t("prompts"),
		ident: 'prompts'
	},
	{
		icon: 'icon-tool',
		name: t("tools"),
		ident: 'tool'
	},
	{
		icon: 'icon-robot',
		name: t("interaction-test"),
		ident: 'interaction'
	}
];

function chooseDebugMode(index: number) {

	// TODO: 支持更多的 server
	if (connectionResult.success) {
		const activeTab = tabs.activeTab;
		activeTab.component = markRaw(debugModes[index]);
		activeTab.icon = debugOptions[index].icon;
		activeTab.name = debugOptions[index].name;
	} else {
		const message = t('warning.click-to-connect')
			.replace('$1', t('connect'));
		
		ElMessage({
			message,
			type: 'error',
			duration: 3000,
			showClose: true,
		});
	}
}

</script>

<style>
.debug-welcome {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.debug-welcome > span {
	font-size: 30px;
    margin: 50px;
}


.welcome-container {
	display: flex;
	flex-wrap: wrap;
	gap: 100px;
}

.welcome-container > span {
	flex: 1 1 calc(50% - 100px);
	box-sizing: border-box;
}

.debug-option {
	display: flex;
	flex-direction: column;
	align-items: center;
	font-size: 24px;
	padding: 30px 0; 
	border-radius: .5em;
	cursor: pointer;
	border: 1px solid var(--sidebar);
	transition: var(--animation-3s);
}

.debug-option > span:first-child {
	margin-bottom: 15px;
}

.debug-option:hover {
	border: 1px solid var(--main-color);
	transition: var(--animation-3s);
}

.debug-option .iconfont {
	font-size: 48px;
}

.debug-welcome {
	user-select: none;
}

.debug-option.disable {
	cursor: not-allowed;
	opacity: 0.5;
}

</style>