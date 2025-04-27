import { Controller, RequestClientType } from "../common";
import { PostMessageble } from "../hook/adapter";
import { loadTabSaveConfig, saveTabSaveConfig } from "./panel.service";

export class PanelController {
    @Controller('panel/save')
    async savePanel(client: RequestClientType, data: any, webview: PostMessageble) {
        const serverInfo = client?.getServerVersion();
		saveTabSaveConfig(serverInfo, data);

        return {
            code: 200,
            msg: 'Settings saved successfully'
        };
    }


    @Controller('panel/load')
    async loadPanel(client: RequestClientType, data: any, webview: PostMessageble) {
        const serverInfo = client?.getServerVersion();
		const config = loadTabSaveConfig(serverInfo);

        return {
            code: 200,
            msg: config
        };
    }
}