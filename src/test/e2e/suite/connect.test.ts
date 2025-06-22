import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';


suite('连接管理测试', () => {
    vscode.window.showInformationMessage('开始测试连接管理');

    let inputBoxStub: sinon.SinonStub;
    let quickPickStub: sinon.SinonStub;

    setup(async () => {
        // mock showQuickPick
        // quickPickStub = sinon.stub(vscode.window, 'showQuickPick');
        // // mock showInputBox
        // inputBoxStub = sinon.stub(vscode.window, 'showInputBox');
        await vscode.commands.executeCommand('workbench.view.extension.openmcp-sidebar');
    
    });

      teardown(() => {
        sinon.restore();
      });

    test('新建STDIO连接', async function () {
        this.timeout(15000); 
        // await vscode.commands.executeCommand('openmcp.sidebar.workspace-connection.addConnection');
        // quickPickStub.onFirstCall().resolves('STDIO');
        // await new Promise(resolve => setTimeout(resolve, 5000));
        // inputBoxStub.onFirstCall().resolves('echo'); // command
        // await new Promise(resolve => setTimeout(resolve, 5000));
        // inputBoxStub.onSecondCall().resolves(''); // cwd
    
        await vscode.commands.executeCommand('openmcp.sidebar.workspace-connection.addConnection');
    });

    
	test('等待以便观察窗口', async function () {
		this.timeout(15000); 
		await new Promise(resolve => setTimeout(resolve, 10000));
	});

    
});