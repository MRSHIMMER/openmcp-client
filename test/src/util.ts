import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function getConfigurationPath() {
    // 如果是 vscode 插件下，则修改为 ~/.openmcp/config.json
    if (process.env.VSCODE_PID) {
        // 在 VSCode 插件环境下
        const homeDir = os.homedir();
        const configDir = path.join(homeDir, '.openmcp');
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        return path.join(configDir, 'config.json');
    }
    return 'config.json';
}

interface IConfig {
    MODEL_BASE_URL: string;
    MODEL_NAME: string;
    API_TOKEN: string;
    [key: string]: any;
}

const DEFAULT_CONFIG: IConfig = {
    MODEL_BASE_URL: '',
    MODEL_NAME: '',
    API_TOKEN: ''
};

function createConfig(): IConfig {
    const configPath = getConfigurationPath();
    const configDir = path.dirname(configPath);
    
    // 确保配置目录存在
    if (configDir && !fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    
    // 写入默认配置
    fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
    return DEFAULT_CONFIG;
}

export function loadConfig(): IConfig {
    const configPath = getConfigurationPath();
    
    if (!fs.existsSync(configPath)) {
        return createConfig();
    }
    
    try {
        const configData = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(configData) as IConfig;
    } catch (error) {
        console.error('Error loading config file, creating new one:', error);
        return createConfig();
    }
}

export function saveConfig(config: Partial<IConfig>, merge: boolean = true): void {
    const configPath = getConfigurationPath();
    let currentConfig: IConfig = DEFAULT_CONFIG;
    
    if (merge && fs.existsSync(configPath)) {
        try {
            currentConfig = loadConfig();
        } catch (error) {
            console.error('Error loading existing config:', error);
        }
    }
    
    const newConfig = { ...currentConfig, ...config };
    
    try {
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving config file:', error);
        throw error;
    }
}