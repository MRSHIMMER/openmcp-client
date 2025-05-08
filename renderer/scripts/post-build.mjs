import fsPath from 'node:path';
import fs from 'node:fs';
import * as process from "node:process";

const cwd = process.cwd();
const sdkPath = fsPath.join(cwd, 'openmcp-sdk');
console.log(cwd);
// fs.rmSync(sdkPath, { recursive: true, force: true });

