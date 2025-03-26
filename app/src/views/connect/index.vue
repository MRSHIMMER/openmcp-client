<template>
	<div class="connect-panel-container">
		<div class="connection-option">
			<span>{{ t('connection-method') }}</span>
			<span style="width: 200px;">
				<el-select name="language-setting" class="language-setting" v-model="connectionMethods.current"
					@change="onconnectionmethodchange">
					<el-option v-for="option in connectionMethods.data" :value="option.value" :label="option.label"
						:key="option.label"></el-option>
				</el-select>
			</span>
		</div>

		<div class="connection-option">
			<span>{{ t('command') }}</span>
			<span style="width: 310px;">
				<el-input v-model="connectionCommand.commandString"></el-input>
			</span>
		</div>

		<div class="connection-option">
			<span>{{ t('env-var') }}</span>
			<div class="input-env">
				<span class="input-env-container">
					<span>
						<el-input v-model="connectionEnv.newKey" @keyup.enter="addEnvVar"></el-input>
					</span>
					<span>
						<el-input v-model="connectionEnv.newValue" @keyup.enter="addEnvVar"></el-input>
					</span>
					<span>
						<div @click="addEnvVar">
							<span class="iconfont icon-add"></span>
						</div>
					</span>
				</span>

			</div>
			<el-scrollbar height="200px" width="350px" class="display-env-container">
				<div class="display-env">
					<div class="input-env-container" v-for="option of connectionEnv.data" :key="option.key">
						<span> <el-input v-model="option.key"></el-input></span>
						<span> <el-input v-model="option.value" show-password></el-input></span>
						<span @click="deleteEnvVar(option)">
							<span class="iconfont icon-delete"></span>
						</span>
					</div>
				</div>
			</el-scrollbar>
		</div>

		<div class="connect-action">
			<el-button type="primary" size="large">
				Connect
			</el-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { connectionCommand, connectionEnv, connectionMethods, EnvItem, onconnectionmethodchange } from './connection';

defineComponent({ name: 'connect' });

const { t } = useI18n();


/**
 * @description 添加环境变量
 */
function addEnvVar() {
	// 检查是否存在一样的 key
	const currentKey = connectionEnv.newKey;
	const currentValue = connectionEnv.newValue;

	if (currentKey.length === 0 || currentValue.length === 0) {
		return;
	}

	const sameNameItems = connectionEnv.data.filter(item => item.key === currentKey);

	if (sameNameItems.length > 0) {
		const conflictItem = sameNameItems[0];
		conflictItem.value = currentValue;
	} else {
		connectionEnv.data.push({
			key: currentKey, value: currentValue
		});
		connectionEnv.newKey = '';
		connectionEnv.newValue = '';
	}
}

/**
 * @description 删除环境变量
 */
function deleteEnvVar(option: EnvItem) {
	const currentKey = option.key;
	const reserveItems = connectionEnv.data.filter(item => item.key !== currentKey);
	connectionEnv.data = reserveItems;
}

</script>

<style>
.connect-panel-container {
	display: flex;
	flex-direction: column;
	width: 60%;
	padding: 20px;
}

.connection-option {
	display: flex;
	flex-direction: column;
	background-color: var(--background);
	padding: 10px;
	margin-bottom: 20px;
	border-radius: .5em;
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

.input-env-container > span {
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
	margin-top: 20px;
	padding: 10px;
}
</style>