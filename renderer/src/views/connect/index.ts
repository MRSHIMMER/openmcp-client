import { getTour, loadSetting } from "@/hook/setting";
import { ElLoading } from "element-plus";
import { pinkLog } from "../setting/util";
import { mcpClientAdapter } from "./core";

export async function initialise() {

	pinkLog('准备请求设置');
    
    const loading = ElLoading.service({
		fullscreen: true,
		lock: true,
		text: 'Loading',
		background: 'rgba(0, 0, 0, 0.7)'
	});
    
	// 加载全局设置
	loadSetting();

	// 获取引导状态
	await getTour();

    // 尝试进行初始化连接
    await mcpClientAdapter.launch();

	// loading panels
	await mcpClientAdapter.loadPanels();

	loading.close();
}