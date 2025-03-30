<template>
    <div class="lexicon-module">
        <h2>题词模块</h2>
        <!-- 题词模块内容将在这里实现 -->
    </div>
</template>

<script setup lang="ts">
import { defineComponent, defineProps } from 'vue';

defineComponent({ name: 'prompt' });

const props = defineProps({
    tabId: {
        type: Number,
        required: true
    }
});

</script>

<style scoped>
.lexicon-module {
    padding: 20px;
    height: 100%;
}
</style>