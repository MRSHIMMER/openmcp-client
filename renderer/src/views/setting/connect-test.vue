<template>
    <div class="connect-test" v-if="simpleTestResult.done || simpleTestResult.error">
        <div class="test-result">
            <div class="result-item" v-if="simpleTestResult.done">
                <span class="iconfont icon-dui"></span>
                <span>{{ " okey dockey :D" }}</span>
                <span v-if="simpleTestResult.tps" class="tps">{{ simpleTestResult.tps }} token/s</span>
                <span v-else class="tps">{{ t("server-not-support-statistic") }}</span>
            </div>
            <div class="result-item error" v-if="simpleTestResult.error">
                <span class="iconfont icon-cuo"></span>
                <span>{{ ' ' + simpleTestResult.error }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { simpleTestResult } from './api';

const { t } = useI18n();

</script>

<style scoped>
.connect-test {
    margin-top: 20px;
    padding: 12px;
    border-radius: 4px;
    background-color: var(--el-bg-color);
}

.test-result {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.result-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-color-success);
    padding: 6px 12px;
    border-radius: 4px;
}

.connect-test .tps {
    margin-left: 5px;
    color: var(--foreground);
    background-color: var(--el-fill-color-light);
    padding: 2px 6px;
    border-radius: 4px;
}

.result-item.error {
    color: var(--el-color-danger);
}

.result-item .iconfont {
    font-size: 16px;
}
</style>