<template>
	<div class="connection-option">
		<div class="env-switch">
			<span>{{ t('env-var') }}</span>

			<el-switch
				v-model="envEnabled"
				@change="handleEnvSwitch"
				inline-prompt
				active-text="预设"
				inactive-text="预设"
			></el-switch>
		</div>
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
</template>


<script setup lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { connectionEnv, connectionResult, EnvItem, envVarStatus } from './connection';
import { useMessageBridge } from '@/api/message-bridge';

defineComponent({ name: 'env-var' });

const { t } = useI18n();
const bridge = useMessageBridge();

function lookupEnvVar(varNames: string[]) {
	console.log('enter');
	
	return new Promise<string[] | undefined>((resolve, reject) => {
		bridge.addCommandListener('lookup-env-var', data => {
			const { code, msg } = data;
			
			if (code === 200) {
				connectionResult.logString.push({
					type: 'info',
					message: '预设环境变量同步完成'
				});

				resolve(msg);
			} else {
				connectionResult.logString.push({
					type: 'error',
					message: '预设环境变量同步失败: ' + msg
				});

				resolve(undefined);
			}
		}, { once: true });

		console.log(varNames);
		
		
		bridge.postMessage({
			command: 'lookup-env-var',
			data: {
				keys: varNames
			}
		})
	});
}

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


const envEnabled = ref(true);

async function handleEnvSwitch(enabled: boolean) {
	const presetVars = ['HOME', 'LOGNAME', 'PATH', 'SHELL', 'TERM', 'USER'];

	if (enabled) {
		const values = await lookupEnvVar(presetVars);

		if (values) {
			// 将 key values 合并进 connectionEnv.data 中
			// 若已有相同的 key, 则替换 value
			for (let i = 0; i < presetVars.length; i++) {
				const key = presetVars[i];
				const value = values[i];
				const sameNameItems = connectionEnv.data.filter(item => item.key === key);
				if (sameNameItems.length > 0) {
					const conflictItem = sameNameItems[0];
					conflictItem.value = value;
				} else {
					connectionEnv.data.push({
						key: key, value: value
					});
				}
			}
		}
	} else {
		// 清空 connectionEnv.data 中所有 key 为 presetVars 的项
		const reserveItems = connectionEnv.data.filter(item => !presetVars.includes(item.key));
		connectionEnv.data = reserveItems;
	}
}

onMounted(() => {
	setTimeout(() => {
		if (envVarStatus.launched) {
			return;
		}
		handleEnvSwitch(envEnabled.value);
		envVarStatus.launched = true;
	}, 200);
});

</script>

<style>
.env-switch {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 12px;
}

.env-switch .el-switch .el-switch__action {
	background-color: var(--main-color);
}

.env-switch .el-switch.is-checked .el-switch__action {
    background-color: var(--sidebar);
}

.env-switch .el-switch__core {
    border: 1px solid var(--main-color) !important;
}
</style>