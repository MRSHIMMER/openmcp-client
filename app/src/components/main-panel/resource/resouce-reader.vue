<template>
    <div class="resource-reader-container">
        <el-form :model="formData" :rules="formRules" ref="formRef" label-position="top">
            <el-form-item v-for="param in currentResource?.params" :key="param.name"
                :label="`${param.name}${param.required ? '*' : ''}`" :prop="param.name" :rules="getParamRules(param)">
                <!-- 根据不同类型渲染不同输入组件 -->
                <el-input v-if="param.type === 'string'" v-model="formData[param.name]"
                    :placeholder="param.description || `请输入${param.name}`" />

                <el-input-number v-else-if="param.type === 'number'" v-model="formData[param.name]"
                    :placeholder="param.description || `请输入${param.name}`" />

                <el-switch v-else-if="param.type === 'boolean'" v-model="formData[param.name]" />
            </el-form-item>

            <el-form-item>
                <el-button type="primary" :loading="loading" @click="handleSubmit">
                    submit
                </el-button>
                <el-button @click="resetForm">
                    reset
                </el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup lang="ts">
import { defineComponent, defineProps, watch, ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { tabs } from '../panel';
import { ResourceStorage } from './resources';
import { ResourcesReadResponse } from '@/hook/type';

defineComponent({ name: 'resource-reader' });

const props = defineProps({
    tabId: {
        type: Number,
        required: true
    }
});

const tab = tabs.content[props.tabId];
const tabStorage = tab.storage as ResourceStorage;

// 表单相关状态
const formRef = ref<FormInstance>();
const formData = ref<Record<string, any>>({});
const loading = ref(false);
const responseData = ref<ResourcesReadResponse>();

// 当前资源协议
const currentResource = computed(() => props.resource);

// 表单验证规则
const formRules = computed<FormRules>(() => {
    const rules: FormRules = {}
    currentResource.value?.params.forEach(param => {
        rules[param.name] = [
            {
                required: param.required,
                message: `${param.name} 是必填字段`,
                trigger: 'blur'
            }
        ]
    });

    return rules;
})

// 根据参数类型获取特定规则
const getParamRules = (param: ResourceProtocol['params'][0]) => {
    const rules: FormRules[number] = []

    if (param.required) {
        rules.push({
            required: true,
            message: `${param.name}是必填字段`,
            trigger: 'blur'
        })
    }

    if (param.type === 'number') {
        rules.push({
            type: 'number',
            message: `${param.name}必须是数字`,
            trigger: 'blur'
        })
    }

    return rules
}

// 初始化表单数据
const initFormData = () => {
    formData.value = {}
    currentResource.value?.params.forEach(param => {
        formData.value[param.name] = param.type === 'number' ? 0 :
            param.type === 'boolean' ? false : ''
    })
}

// 重置表单
const resetForm = () => {
    formRef.value?.resetFields();
    responseData.value = undefined;
}

// 提交表单
const handleSubmit = async () => {
    console.log('submit');
}

// 监听资源变化重置表单
watch(() => tabStorage.currentResourceName, () => {
    initFormData();
    resetForm();
}, { immediate: true });

</script>

<style></style>