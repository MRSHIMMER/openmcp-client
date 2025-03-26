import * as path from 'path';
import * as fs from 'fs';

import { Request, Response } from 'express';
import { showOpenViewDialog, showSaveViewDialog } from './windows';
import * as pako from 'pako';
import puppeteer, { LowerCasePaperFormat, PDFOptions } from 'puppeteer-core';
import { PDFDocument } from 'pdf-lib';

export async function saveAsSvg(req: Request, res: Response) {
    try {
        const { svgBuffer, moduleName } = req.body;
        const svgString = pako.ungzip(svgBuffer, { to: 'string' });
        // 询问新的路径        
        const defaultFilename = moduleName + '.svg';
        const savePath = await showSaveViewDialog({
            title: 'Save As Svg',
            defaultPath: path.resolve(__dirname, '../test', defaultFilename),
            buttonLabel: 'Save',
            filters: [
                { name: 'svg', extensions: ['svg'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        });

        if (savePath) {
            fs.writeFileSync(savePath, svgString);
            res.send({
                savePath,
                success: true
            });
        } else {
            res.send({
                success: false
            });
        }
    } catch (error) {
        console.log('error happen in /save-as-svg, ' + error);
        res.send({
            success: false
        });
    }   
}