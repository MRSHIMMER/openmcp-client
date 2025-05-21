import { Controller, RequestClientType } from "../common";
import { PostMessageble } from "../hook/adapter";
import { diskStorage } from "../hook/db";
import { createOcrWorker, saveBase64ImageData } from "./ocr.service";

export class OcrController {
    @Controller('ocr/get-ocr-image')
    async getOcrImage(data: any, webview: PostMessageble) {
        const { filename } = data;
        const buffer = diskStorage.getSync(filename);
        const base64String = buffer ? buffer.toString('base64'): undefined;
        return {
            code: 200,
            msg: {
                base64String
            }
        }
    }

    @Controller('ocr/start-ocr')
    async startOcr(data: any, webview: PostMessageble) {
        const { base64String, mimeType } = data;

        const filename = saveBase64ImageData(base64String, mimeType);
        const worker = createOcrWorker(filename, webview);

        return {
            code: 200,
            msg: {
                filename,
                workerId: worker.id
            }
        }   
    }

}