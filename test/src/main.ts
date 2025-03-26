import { app, BrowserWindow } from 'electron';
import express, { Request, Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';

import { createWindow } from './windows';

const corsOptions = {
    // 一些旧版浏览器（如 IE11、各种 SmartTV）在 204 状态下会有问题
    optionsSuccessStatus: 200
};

const backendApp = express();

backendApp.use(express.json());
backendApp.use(cors(corsOptions));
backendApp.use(morgan('dev'));

backendApp.get('/', (req: Request, res: Response) => {
    res.send('<h1>Hello, World!</h1><br><img src="https://picx.zhimg.com/v2-b4251de7d2499e942c7ebf447a90d2eb_l.jpg"/>');
});

// backendApp.post('/vcd/save-view', Vcd.saveView);
// backendApp.post('/vcd/save-view-as', Vcd.saveViewAs);
// backendApp.post('/vcd/load-view', Vcd.loadView);

// backendApp.post('/netlist/save-as-svg', Netlist.saveAsSvg);
// backendApp.post('/netlist/save-as-pdf', Netlist.saveAsPdf);
// backendApp.post('/netlist/goto-definition', Netlist.gotoDefinition);

// backendApp.post('/codedoc/get-doc-ir', CodeDoc.getDocIR);
// backendApp.post('/codedoc/download-svg', CodeDoc.downloadSvg);

const PORT = process.env.PORT || 3000;
backendApp.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// 下面注册 electron 窗口
app.on('ready', () => {
    createWindow();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});