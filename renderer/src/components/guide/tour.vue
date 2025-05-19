<template>
    <el-tour v-model="openTour">
        <el-tour-step
            :next-button-props="{ children: '开始' }"
            :show-close="false"
        >
            <template #header>
                <TourTitle>介绍</TourTitle>
            </template>
            <div style="display: flex; padding: 10px; padding-bottom: 20px;">
                <div class="tour-common-text">
                    欢迎来到大模型与 mcp 的世界！

                    <br><br>

                    OpenMCP 将会助力你快速将任何奇思妙想开发成 mcp 服务器，通过接入大模型，让你的任何 idea 都可以快速落地。

                    <br><br>

                    倘若阁下是第一次使用 OpenMCP，请务必走完我们准备好的引导。
                </div>

            </div>
        </el-tour-step>

        <el-tour-step
            target="#connected-status-container"
            :prev-button-props="{ children: '上一步' }"
            :next-button-props="{ children: '下一步' }"
            :show-close="false"
        >
            <template #header>
                <TourTitle>引导</TourTitle>
            </template>
            <div class="tour-common-text">
                这里会显示当前调试的 mcp 服务器的名称（缩写）和连接状态。只有当连接状态为「已连接」，调试工作才能开始。


                <br><br>

                OpenMCP 通过服务器名称对项目所的所有服务进行统一管理，请避免在同一个项目中使用相同的名称。
            </div>
        </el-tour-step>


        <el-tour-step
            target="#sidebar-connect"
            :prev-button-props="{ children: '上一步' }"
            :next-button-props="{ children: '下一步', onClick: () => router.push(baseUrl + 'connect') }"
            :show-close="false"
        >
            <template #header>
                <TourTitle>连接</TourTitle>
            </template>
            <div class="tour-common-text">
                如果显示「未连接」或阁下想要更改连接参数或者连接方式，可以点击这里进入连接面板。
            </div>
        </el-tour-step>

        <el-tour-step
            :target="client.connectionSettingRef"
            :prev-button-props="{ children: '上一步' }"
            :next-button-props="{ children: '下一步' }"
            :show-close="false"
            placement="right"
        >
            <template #header>
                <TourTitle>连接</TourTitle>
            </template>
            <div class="tour-common-text">
                阁下可以在左侧面板选择与您心爱的 mcp 服务器进行连接的方式，并填入对应的连接参数。

                <br><br>

                对于 openmcp vscode/trae/cursor 插件端的用户，当您通过面板按钮进入 openmcp 的时候，默认就会选择 STDIO 作为连接方式，并根据你的上下文生成启动参数。
                openmcp desktop 的用户可能就需要自己填写了。Anyway，这总比在你的好友电脑中植入 chrome 浏览器密码破解木马简单。
            </div>
        </el-tour-step>

        <el-tour-step
            :target="client.connectionLogRef"
            :prev-button-props="{ children: '上一步' }"
            :next-button-props="{ children: '下一步' }"
            :show-close="false"
            placement="left"
        >
            <template #header>
                <TourTitle>连接</TourTitle>
            </template>
            <div class="tour-common-text">
                连接响应会在这个地方打印出来，如果出现绿色背景的信息，代表连接成功。
            </div>
        </el-tour-step>

        <el-tour-step
            target="#sidebar-debug"
            :prev-button-props="{ children: '上一步' }"
            :next-button-props="{ children: '下一步', onClick: () => router.push(baseUrl + 'debug') }"
            :show-close="false"
        >
            <template #header>
                <TourTitle>调试</TourTitle>
            </template>
            <div class="tour-common-text">
                假设你已经成功连接了 mcp 服务器，那么点击调试按钮，你可以开始你的调试工作。
            </div>
        </el-tour-step>

        <el-tour-step
            :target="welcomeRef"
            :prev-button-props="{ children: '上一步' }"
            :next-button-props="{ children: '下一步' }"
            :show-close="false"
            placement="right"
        >
            <template #header>
                <TourTitle>调试</TourTitle>
            </template>
            <div class="tour-common-text">
                我们目前提供了四种主要调试选项，「资源」、「提词」、「工具」分别和 MCP 协议中的 resources、prompts、tools 对应。

                而「交互测试」则允许你直接将写好的 mcp 服务器放入大模型中直接做全链路测试，从而更加获取更加真实的反馈和数据，进而改进的你的 mcp 服务器。

                <br><br>

                基于我们在 agent 和 rl 方向的最佳实践，我们后续还会推出更多的调试和数据集聚合制作选项，请期待吧！
            </div>
        </el-tour-step>

        <el-tour-step
            target="#sidebar-setting"
            :prev-button-props="{ children: '上一步', onClick: () => router.push(baseUrl + 'debug') }"
            :next-button-props="{ children: '下一步', onClick: () => router.push(baseUrl + 'setting') }"
            :show-close="false"
        >
            <template #header>
                <TourTitle>设置</TourTitle>
            </template>
            <div class="tour-common-text">
                如果要进行交互测试，请不要忘记先配置你常用的大模型 API
            </div>
        </el-tour-step>


        <el-tour-step
            :target="llmSettingRef"
            :prev-button-props="{ children: '上一步' }"
            :next-button-props="{ children: '下一步' }"
            :show-close="false"
            placement="right"
        >
            <template #header>
                <TourTitle>设置</TourTitle>
            </template>
            <div class="tour-common-text">
                OpenMCP 目前支持所有支持 openai 接口规范的大模型，比如 deepseek，openai，kimi 等等。
                本地部署的 ollama 也正在支持。
            </div>
        </el-tour-step>


        <el-tour-step
            target="#add-new-server-button"
            :prev-button-props="{ children: '上一步' }"
            :next-button-props="{ children: '下一步' }"
            :show-close="false"
        >
            <template #header>
                <TourTitle>设置</TourTitle>
            </template>
            <div class="tour-common-text">
                如果需要添加自定义的大模型服务，请点击这里。比如火山云，阿里云，硅基流动等。
            </div>
        </el-tour-step>


        <el-tour-step
            target="#test-llm-button"
            :prev-button-props="{ children: '上一步' }"
            :next-button-props="{ children: '下一步' }"
            :show-close="false"
        >
            <template #header>
                <TourTitle>设置</TourTitle>
            </template>
            <div class="tour-common-text">
                填写完成连接签名后，点击这里来测试 大模型服务是否可以访问。
            </div>
        </el-tour-step>


        <el-tour-step
            target="#save-llm-button"
            :prev-button-props="{ children: '上一步' }"
            :next-button-props="{ children: '下一步' }"
            :show-close="false"
        >
            <template #header>
                <TourTitle>设置</TourTitle>
            </template>
            <div class="tour-common-text">
                最后请不要忘记点击保存按钮，保存你的设置。
            </div>
        </el-tour-step>


        <el-tour-step
            :prev-button-props="{ children: '上一步', onClick: () => router.push(baseUrl + 'setting') }"
            :next-button-props="{ children: '下一步' }"
            :show-close="false"
        >
            <template #header>
                <TourTitle>🎉恭喜</TourTitle>
            </template>
            <div class="tour-common-text">
                🎉恭喜，我的朋友，现在的你已经是半个 mcp 专家了，请充好一杯咖啡，慢慢享用快乐的开发时间吧！

                <br><br>

                如果是插件用户，左侧面板的最下面「入门与帮助」有一些我们准备好的资料，希望能帮到阁下优雅地开发你的 mcp 服务器。
                让我们一起把越来越多的 api 和 sdk 接入 大模型吧。
            </div>
        </el-tour-step>


        <el-tour-step
            :prev-button-props="{ children: '上一步', onClick: () => router.push(baseUrl + 'setting') }"
            :next-button-props="{ children: '结束', onClick: () => finishTour() }"
            :show-close="false"
        >
            <template #header>
                <TourTitle>终章？</TourTitle>
            </template>
            <div class="tour-common-text">
                <pre><code style="color: unset !important; background-color: unset !important;"
                >(base) <span style="color: greenyellow">➜</span>  <span style="color: #6AC2CF">.openmcp</span> <span style="color: #6BC34B">cat</span> <span style="color: #D357DB">KEY</span>
直面恐惧，创造未来
Face your fears, create the future
恐怖に直面し、未来を創り出</code></pre>
            </div>
        </el-tour-step>
    </el-tour>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TourTitle from './tour-title.vue';

import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { welcomeRef } from '@/views/debug/welcome';
import { llmSettingRef } from '@/views/setting/api';
import { userHasReadGuide } from './tour';
import { setTour } from '@/hook/setting';
import { mcpClientAdapter } from '@/views/connect/core';

const openTour = ref(true);

const { t } = useI18n();

const router = useRouter();
const client = mcpClientAdapter.masterNode;

const baseUrl = import.meta.env.BASE_URL;

function finishTour() {
    openTour.value = false;
    userHasReadGuide.value = true;
    setTour();
}

</script>

<style>
.tour-common-text {
    font-size: 1.0rem;
    padding: 10px;
    padding-bottom: 20px;
    line-height: 1.5;
}

.tour-warning {
    display: flex;
    background-color: rgba(230, 162, 60, 0.5);
    border-radius: .5em;
    padding: 5px;
    margin: 5px 0;
}

.tour-common-text code {
    color: unset!important;
    background-color: unset!important;
}
</style>