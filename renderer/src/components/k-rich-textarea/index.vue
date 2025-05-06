<template>
    <div class="k-rich-textarea">
        <div
            ref="editor"
            contenteditable="true"
            class="rich-editor"
            :placeholder="placeholder"
            @input="handleInput"
            @keydown.enter="handleKeydown"
            @compositionstart="handleCompositionStart"
            @compositionend="handleCompositionEnd"
        ></div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, watch } from 'vue';
import type { RichTextItem } from './textarea.dto';

const props = defineProps({
    modelValue: {
        type: Array as () => RichTextItem[],
        required: true
    },
    placeholder: {
        type: String,
        default: '输入消息...'
    },
    customClass: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['update:modelValue', 'pressEnter']);

const editor = ref<HTMLElement | null>(null);

const renderRichText = (items: RichTextItem[]) => {
    return items.map(item => {
        if (item.type === 'prompt' || item.type === 'resource') {
            return `<span class="rich-item rich-item-${item.type}">${item.text}</span>`;
        }
        return item.text;
    }).join('');
};

const handleInput = (event: Event) => {
    if (editor.value) {
        console.log(editor.value);
        
        const items: RichTextItem[] = [];
        // 解析编辑器内容并转换为 RichTextItem[]
        // ... 实现解析逻辑
        emit('update:modelValue', items);
    }
};

watch(() => props.modelValue, (newValue) => {
    if (editor.value) {
        editor.value.innerHTML = renderRichText(newValue);
    }
}, { immediate: true });

const isComposing = ref(false);

const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey && !isComposing.value) {
        event.preventDefault();
        emit('pressEnter', event);
    }
};

const handleCompositionStart = () => {
    isComposing.value = true;
};

const handleCompositionEnd = () => {
    isComposing.value = false;
};
</script>

<style>
.k-rich-textarea {
    border-radius: .9em;
    border: 1px solid #DCDFE6;
    padding: 5px;
}

.rich-editor {
    min-height: 100px;
    outline: none;
}

.rich-editor:empty::before {
    content: attr(placeholder);
    color: #C0C4CC;
}

.rich-item {
    padding: 2px 4px;
    border-radius: 4px;
    margin: 0 2px;
}

.rich-item-prompt {
    background-color: #e8f0fe;
    color: #1a73e8;
}

.rich-item-resource {
    background-color: #f1f3f4;
    color: #202124;
}
</style>