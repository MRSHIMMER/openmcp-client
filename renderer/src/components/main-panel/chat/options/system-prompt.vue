<template>
    <el-tooltip :content="t('system-prompt')" placement="top">
        <div class="setting-button" :class="{ 'active': hasSystemPrompt }" size="small"
            @click="showSystemPromptDialog = true">
            <span class="iconfont icon-prompt"></span>
        </div>
    </el-tooltip>

    <!-- System Prompt对话框 -->
    <el-dialog v-model="showSystemPromptDialog" :title="t('system-prompt')" width="600px">
        <el-input v-model="tabStorage.settings.systemPrompt" type="textarea" :rows="8"
            :placeholder="t('system-prompt.placeholder')" clearable />
        <template #footer>
            <el-button @click="showSystemPromptDialog = false">{{ t("cancel") }}</el-button>
            <el-button type="primary" @click="showSystemPromptDialog = false">{{ t("save") }}</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChatStorage } from '../chat';

const { t } = useI18n();

const tabStorage = inject('tabStorage') as ChatStorage;

const showSystemPromptDialog = ref(false);

const hasSystemPrompt = computed(() => {
	return !!tabStorage.settings.systemPrompt?.trim();
});


</script>

<style></style>