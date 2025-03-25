<template>
	<div class="about-container">

        <span>
            <img src="/protocol.svg" alt="">
        </span>

		OpenMCP Client 0.0.1 由 @锦恢 开发
		
		<p>软件已开源 <a href="https://github.com/LSTM-Kirigaya/openmcp-client" target="_blank">
			LSTM-Kirigaya/openmcp-client
		</a></p>

		<p>请遵循开源协议进行分发和二次开发。</p>
	</div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';

defineComponent({ name: 'about' });
</script>

<style>
.about-container {
    text-align: center;
    height: 90%;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
}
</style>