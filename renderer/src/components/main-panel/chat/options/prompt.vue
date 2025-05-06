<template>
    <el-tooltip :content="t('prompts')" placement="top">
        <div class="setting-button" @click="showChoosePrompt = true">
            <span class="iconfont icon-chat"></span>
        </div>
    </el-tooltip>

    <!-- 上下文长度设置 - 改为滑块形式 -->
    <el-dialog v-model="showChoosePrompt" :title="t('prompts')" width="400px">

        <div class="prompt-template-container-scrollbar" v-if="!selectPrompt">
            <PromptTemplates
                :tab-id="-1"
                @prompt-selected="prompt => selectPrompt = prompt"
            />
        </div>
        <div v-else>
            <PromptReader
                :tab-id="-1"
                :current-prompt-name="selectPrompt!.name"
                @prompt-get-response="msg => whenGetPromptResponse(msg)"    
            />
        </div>

        <template #footer>
            <el-button v-if="selectPrompt" @click="selectPrompt = undefined;">{{ t('return') }}</el-button>
            <el-button @click="showChoosePrompt = false; selectPrompt = undefined;">{{ t("cancel") }}</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { inject, ref, defineProps, PropType, defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChatStorage } from '../chat';
import { PromptsGetResponse, PromptTemplate } from '@/hook/type';

import PromptTemplates from '../../prompt/prompt-templates.vue';
import PromptReader from '../../prompt/prompt-reader.vue';
import { ElMessage } from 'element-plus';

const { t } = useI18n();

const tabStorage = inject('tabStorage') as ChatStorage;

const props = defineProps({
    modelValue: {
        type: String,
        required: true
    }
});
const emits = defineEmits([ 'update:modelValue' ]);

let selectPrompt = ref<PromptTemplate | undefined>(undefined);

const showChoosePrompt = ref(false);

function whenGetPromptResponse(msg: PromptsGetResponse) {
    try {
        const content = msg.messages[0].content;

        if (content) {
            emits('update:modelValue', props.modelValue + content);
        }
        
        showChoosePrompt.value = false;
        
    } catch (error) {
        ElMessage.error((error as Error).message);
    }
}

</script>

<style>
.icon-length {
    font-size: 16px;
}
</style>