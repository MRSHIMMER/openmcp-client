<template>
	<el-scrollbar>
		<div class="connection-container">
		<div class="connect-panel-container left"
			:ref="el => client.connectionSettingRef = el"
		>
			<ConnectionMethod :index="props.index" />
			<ConnectionArgs :index="props.index" />
			<ConnectionEnvironment :index="props.index" />

			<div class="connect-action">
				<el-button type="primary" size="large" :loading="isLoading" :disabled="!client.connectionResult"
					@click="connect()">
					<span class="iconfont icon-connect" v-if="!isLoading"></span>
					{{ t('connect.appearance.connect') }}
				</el-button>
			</div>
		</div>

		<div class="connect-panel-container right"
			:ref="el => client.connectionLogRef = el"
		>
			<ConnectionLog :index="props.index" />
		</div>
	</div>
	</el-scrollbar>

</template>

<script setup lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ConnectionMethod from './connection-method.vue';
import ConnectionArgs from './connection-args.vue';
import ConnectionEnvironment from './connection-environment.vue';
import ConnectionLog from './connection-log.vue';

import { getPlatform } from '@/api/platform';
import { mcpClientAdapter } from './core';

defineComponent({ name: 'connection-panel' });

const props = defineProps({
	index: {
		type: Number,
		required: true
	}
});

const client = computed(() => mcpClientAdapter.clients[props.index]);

const { t } = useI18n();

const isLoading = ref(false);

async function connect() {
	isLoading.value = true;

	const platform = getPlatform();
	const ok = await client.value.connect();
	
	if (ok) {
		mcpClientAdapter.saveLaunchSignature();
	}

	isLoading.value = false;
}

</script>

<style>
.connection-container {
	display: flex;
}


.connect-panel-container.left {
	display: flex;
	flex-direction: column;
	width: 45%;
	max-height: 85vh;
	max-width: 500px;
	min-width: 350px;
	padding: 5px 20px;
}

.connect-panel-container.right {
	display: flex;
	flex-direction: column;
	width: 55%;
	max-height: 85vh;
	min-width: 450px;
	padding: 5px 20px;
}


.connection-option {
	display: flex;
	flex-direction: column;
	background-color: var(--background);
	padding: 10px;
	margin-bottom: 20px;
	border-radius: .5em;
	border: 1px solid var(--background);
}

.connection-option>span:first-child {
	margin-bottom: 5px;
}

.input-env-container {
	display: flex;
	margin-bottom: 10px;
}

.display-env {
	padding-top: 10px;
	padding-bottom: 10px;
}

.input-env-container>span {
	width: 150px;
	margin-right: 10px;
	display: flex;
	height: 30px;
	align-items: center;
}

.input-env-container .iconfont {
	font-size: 20px;
	border-radius: 99em;
	color: var(--foreground);
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: var(--animation-3s);
	user-select: none;
}

.input-env-container .iconfont:hover {
	color: var(--main-color);
	transition: var(--animation-3s);
}

.connect-action {
	padding: 10px;
}
</style>