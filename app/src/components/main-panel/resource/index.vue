<template>
    <div class="resource-module">
        <div class="left">
            <h2>
                <span class="iconfont icon-file"></span>
                资源模块
            </h2>
            <h3><code>resources/templates/list</code></h3>
            
            <ResourceTemplates></ResourceTemplates>
        </div>
        <div class="right">

        </div>
</div>
</template>

<script setup lang="ts">
import ResourceTemplates from './resource-templates.vue';

</script>

<style scoped>
.resource-module {
    padding: 20px;
    height: 100%;
}

.resource-module .left {
    width: 45%;
}

.resource-module .right {
    width: 45%;
}


</style>