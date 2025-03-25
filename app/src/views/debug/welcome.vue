<template>
	<div class="debug-welcome">
		<span>选择一个项目进行调试</span>
		<div class="welcome-container">
			<span
				class="debug-option"
				v-for="(option, index) of debugOptions"
				:key="index"	
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
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';

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

</style>