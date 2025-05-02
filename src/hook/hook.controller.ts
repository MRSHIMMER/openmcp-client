import { RegisterCommand } from "../common";
import * as vscode from 'vscode';
import * as path from 'path';
import Tesseract from 'tesseract.js';


export class HookController {

    @RegisterCommand('openmcp.hook.test-ocr')
    async testOcr(context: vscode.ExtensionContext) {
        const testImage = path.join(context.extensionPath, 'icons/openmcp.resource.png');
        
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

        vscode.window.showInformationMessage('ocr result: ' + text);
    }

}