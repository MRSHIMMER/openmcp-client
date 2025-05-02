import { RegisterCommand } from "../common";
import * as vscode from 'vscode';
import * as path from 'path';
import Tesseract from 'tesseract.js';


export class HookController {

    @RegisterCommand('openmcp.hook.test-ocr')
    async testOcr(context: vscode.ExtensionContext) {
        try {
            const testImage = path.join(context.extensionPath, 'icons/openmcp.resource.png');

            console.log('test ocr begin');

            console.log('cachePath', context.extensionPath);
            
            const { data: { text } } = await Tesseract.recognize(
                testImage,
                'eng+chi_sim',
                {
                    logger: (m) => console.log(m),
                    langPath: './',
                    gzip: false,
                    cacheMethod: 'cache',
                    cachePath: context.extensionPath
                }
            );
    
            console.log('ocr result: ' + text);
        } catch (error) {
            vscode.window.showErrorMessage(error as string);
        }
    }

}