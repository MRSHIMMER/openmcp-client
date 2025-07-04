<template>
	<section class="feature-section">
		<div class="section-title">🐳 Learn More Features & Usage</div>

		<div
		style="margin-bottom: 1.1rem;"
		>Learn more about how to use openmcp to build your AI Agent & MCP fast</div>

		<div class="bilibili-player-container" style="display:flex; width: 100%; justify-content: center;">
		<iframe width="100%" height="580" src="https://www.youtube.com/embed/S7igsEhcLiw?si=6sqvbYJxSRoFS26g" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
		</div>

	</section>
</template>

<style>
.feature-section {
	margin-bottom: 20px;
}

.section-title {
	font-size: 1.5rem;
	font-weight: bold;
	color: #B988D1;
	margin-bottom: 12px;
}

.feature-cards {
	display: flex;
	flex-wrap: wrap;
	gap: 18px;
}

.feature-card {
	background: none;
	border: 1.5px solid #B988D1;
	border-radius: 10px;
	padding: 18px 22px;
	min-width: 180px;
	flex: 1 1 180px;
	color: var(--foreground, #222);
	text-decoration: none;
	transition: box-shadow 0.15s, border 0.15s;
	box-shadow: 0 2px 8px 0 rgba(185, 136, 209, 0.04);
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.feature-card:hover {
	border-color: #8e5bbf;
	box-shadow: 0 4px 16px 0 rgba(185, 136, 209, 0.12);
}

.feature-card-title {
	font-weight: bold;
	color: #B988D1;
	font-size: 1.1em;
}

.feature-card-desc {
	font-size: 0.98em;
	color: var(--foreground, #444);
	opacity: 0.85;
}


.bilibili-player-container {
    position: relative;
    min-width: 377px;
    min-height: 225px;
    width: 52.36vw;
    height: 580px;
    border: 2px solid var(--vp-c-brand-3);
    border-radius: 8px;
    aspect-ratio: 16/9;
	margin: 2rem 0;
    border-radius: .5em;
    overflow: hidden;
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
    box-shadow: 0 4px 12px var(--vscode-widget-shadow);
}

@media (max-width: 2700px) {
    .bilibili-player-container {
        width: 88%;
    }
}

@media (max-width: 1200px) {
    .bilibili-player-container {
        width: 95%;
    }
}

@media screen and (max-width: 741px) {
    .bilibili-player-container iframe {
        width: 100%;
    }
}

.bilibili-player-container:hover {
    border-color: var(--vp-c-brand-1);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
</style>