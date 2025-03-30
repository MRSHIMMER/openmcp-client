<template>
    <div class="tools-module">
        <h2>工具模块</h2>
        <!-- 工具模块内容将在这里实现 -->
    </div>
</template>

<script setup lang="ts">
import { defineComponent, defineProps } from 'vue';

defineComponent({ name: 'tool' });

const props = defineProps({
    storage: {
        type: Object,
        required: true
    }
});

</script>

<style scoped>
.tools-module {
    padding: 20px;
    height: 100%;
}
</style>