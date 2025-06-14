import * as path from 'path';

import { runTests } from '@vscode/test-electron';
import { fileURLToPath } from 'url';

// 将 import.meta.url 转换为文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
		console.log('Extension Path:', extensionDevelopmentPath); // 添加日志验证路径
		// The path to the extension test script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index.js');

		// Download VS Code, unzip it and run the integration test
		await runTests({ 
            extensionDevelopmentPath:  extensionDevelopmentPath,
            extensionTestsPath: extensionTestsPath,
        });
	} catch (err) {
		console.error('Failed to run tests');
        console.error(err);
		process.exit(1);
	}
}

main();