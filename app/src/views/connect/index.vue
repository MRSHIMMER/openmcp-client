<template>
	<div class="connect-panel-container">
		<div class="connection-option">
			<span>{{ t('connection-method') }}</span>
			<span style="width: 200px;">
				<el-select name="language-setting" class="language-setting"
					v-model="connectionMethods.current"
					@change="onconnectionmethodchange"
				>
					<el-option v-for="option in connectionMethods.data"
						:value="option.value"
						:label="option.label"
						:key="option.label"
					></el-option>
				</el-select>
			</span>
		</div>

		<div class="connection-option">
			<span>{{ t('command') }}</span>
			<span
				style="width: 300px;"
			>
				<el-input v-model="connectionCommand.commandString"></el-input>
			</span>
		</div>

		<div class="connection-option">
			<span>{{ t('env-var') }}</span>
			
		</div>



	</div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { connectionCommand, connectionMethods, onconnectionmethodchange } from './connection';

defineComponent({ name: 'connect' });

const { t } = useI18n();

</script>

<style>
.connect-panel-container {
	display: flex;
	flex-direction: column;
	width: 60%;
	padding: 50px 60px;
}

.connection-option {
	display: flex;
	flex-direction: column;
	margin-bottom: 20px;
}

.connection-option > span:first-child {
	margin-bottom: 5px;
}
</style>