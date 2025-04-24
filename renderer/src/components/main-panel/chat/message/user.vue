<template>
    <div class="message-role"></div>
    <div class="message-text">
        <span>{{ props.message.content }}</span>
    </div>
</template>

<script setup lang="ts">

import { defineProps } from 'vue';

const props = defineProps({
    message: {
        type: Object,
        required: true
    }
});

</script>

<style>
</style>