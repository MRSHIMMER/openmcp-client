<script setup lang="ts">
import OmHeader from './components/Header.vue';
import OmWhatNews from './components/WhatNews.vue';
import OmMoreFeature from './components/MoreFeature.vue';
import OmCoreFeature from './components/CoreFeature.vue';
import OmSponsor from './components/Sponsor.vue';
import OmResource from './components/Resource.vue';
import OmTroubleshoot from './components/Troubleshoot.vue';

const version = '0.1.9';
const changelogs = [
	'增加 mook 功能：可以利用随机种子或者AI生成来自动化填充测试 tool 的表单数据',
	'增加工具自检功能：openmcp 的 tool 下可以点击「工具模块」 右侧的 「工具自检」进入自检模式，该模式下，用户可以自己定义工具执行的拓扑顺序，然后一次性进行自动检测。',
	'修复 issue #44: 完成链接跳转的平台适配',
	'修复 issue #36: 完成非文件夹打开下的成功启动',
	'修复 issue #45: 数组类型参数不支持',
	'修复多行对话粘贴进入对话框样式异常的问题'
];

</script>

<template>
	<main class="openmcp-news-root">
		<om-header :version="version" />

		<!-- 1. 📣 What is news in OpenMCP -->
		<om-what-news :version="version" :changelogs="changelogs" />

		<!-- 2. 🐳 Learn more features -->
		<om-more-feature />

		<!-- 3. ✨ Core Features -->
		<om-core-feature />

		<!-- 4. ❤️ How to sponsor -->
		<om-sponsor />

		<!-- 5. 📚 Resources -->
		<om-resource />

		<!-- 6. 🔧 Troubleshooting -->
		<om-troubleshoot />
	</main>
</template>

<style>
body {
	color: var(--foreground, #222);
	background: var(--background, #fff);
	font-size: var(--vscode-font-size);
	max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
}

.openmcp-news-root {
	color: var(--foreground, #222);
	background: var(--background, #fff);
	padding: 32px 0 64px 0;
	min-height: 100vh;
	box-sizing: border-box;
	max-width: 820px;
	margin: 0 auto;
}

.release-link {
	color: #B988D1;
	font-weight: 500;
	text-decoration: underline;
	margin-bottom: 8px;
	display: inline-block;
	transition: color 0.2s;
}

.release-link:hover {
	color: #8e5bbf;
}

.news-list {
	list-style: none;
	padding: 0;
	margin: 0;
}

.news-badge {
	display: inline-block;
	background: #B988D1;
	color: #fff;
	border-radius: 8px;
	font-size: 0.85em;
	padding: 2px 10px;
	margin-right: 10px;
	font-weight: 500;
	vertical-align: middle;
}

.openmcp-header {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 24px;
	margin: 0 0 32px 0;
	padding: 0 0 16px 0;
	border-bottom: 1px solid #B988D1;
}

.openmcp-logo {
	width: 84px;
	height: 84px;
	border-radius: 16px;
	background: var(--vscode-sideBar-background);
	box-shadow: 0 2px 8px 0 rgba(185, 136, 209, 0.08);
}

.margin-bottom {
	margin-bottom: 32px;
}
</style>