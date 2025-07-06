<script setup lang="ts">
const props = defineProps({
	version: {
		type: String,
		default: '0.1.9'
	},
	changelogs: {
		type: Array as () => string[],
		default: () => [
			'Brand new VSCode WebView adaptation, smoother experience',
			'Support for AI Mock, toolchain visualization, and automatic topology detection',
			'Multi-model concurrency, enhanced plugin capabilities'
		]
	}
});
</script>

<template>
	<section class="news-section">
		<div class="news-title">
			<span>📣 What's New in <span class="highlight">{{ props.version }}</span></span>
		</div>
		<div class="news-content">
			<ul class="news-list">
				<li v-for="(log, index) in props.changelogs" :key="index">
					<span class="news-badge">{{ '/' }}</span>
					<span>{{ log }}</span>
				</li>
			</ul>
			<br>
			<a class="release-link" href="https://kirigaya.cn/openmcp/preview/changelog.html" target="_blank"
				rel="noopener">View History Changelog →</a>
		</div>
	</section>
</template>

<style>
.news-section {
	margin-bottom: 20px;
}

.news-title {
	display: flex;
	align-items: center;
	font-size: 1.5rem;
	font-weight: bold;
	color: #B988D1;
	margin-bottom: 10px;
}

.news-title .logo {
	width: 38px;
	height: 38px;
	margin-right: 12px;
	vertical-align: middle;
}

.news-title .highlight {
	color: #B988D1;
}

.news-content {
	border-radius: 12px;
	padding: 2rem;
	margin: 2rem 0;
	background-color: var(--vscode-sideBar-background);
	box-shadow: 0 2px 8px var(--vscode-widget-shadow);
}

.news-content li {
	margin-bottom: 0.7rem;
}
</style>