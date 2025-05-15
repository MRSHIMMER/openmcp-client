import { Controller, RequestClientType } from "../common";
import { PostMessageble } from "../hook/adapter";
import { getTour, loadSetting, saveSetting, setTour } from "./setting.service";

export class SettingController {

    @Controller('setting/save')
    async saveSetting(client: RequestClientType, data: any, webview: PostMessageble) {
        saveSetting(data);
        console.log('Settings saved successfully');
        
        return {
            code: 200,
            msg: 'Settings saved successfully'
        };
    }

    @Controller('setting/load')
    async loadSetting(client: RequestClientType, data: any, webview: PostMessageble) {
        
        const config = loadSetting();
        return {
            code: 200,
            msg: config
        }
    }

    @Controller('setting/set-tour')
    async setTourController(client: RequestClientType, data: any, webview: PostMessageble) {
        
        const { userHasReadGuide } = data;

        setTour(userHasReadGuide);

        return {
            code: 200,
            msg: 'setTour success'
        }
    }

    @Controller('setting/get-tour')
    async getTourController(client: RequestClientType, data: any, webview: PostMessageble) {
        
        const { userHasReadGuide } = getTour();

        return {
            code: 200,
            msg:{
                userHasReadGuide
            }
        }
    }
}