<template>
    <div class="interaction-module">
        <h2>交互测试模块</h2>
        <!-- 交互测试模块内容将在这里实现 -->
    </div>
</template>

<script setup lang="ts">
import { defineComponent, defineProps } from 'vue';

defineComponent({ name: 'chat' });

const props = defineProps({
    tabId: {
        type: Number,
        required: true
    }
});

</script>

<style scoped>
.interaction-module {
    padding: 20px;
    height: 100%;
}
</style>