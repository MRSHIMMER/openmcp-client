import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { VSCODE_WORKSPACE } from '../hook/setting.js';
import { IConfig } from './setting.dto.js';
import { llms } from '../hook/llm.js';

function getConfigurationPath() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.openmcp');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    return path.join(configDir, 'setting.json');
}

function getDefaultLanguage() {
    if (process.env.VSCODE_PID) {
        // TODO: 获取 vscode 内部的语言

    }
    return 'zh';
}

const DEFAULT_CONFIG: IConfig = {
    MODEL_INDEX: 0,
    LLM_INFO: llms,
    LANG: getDefaultLanguage(),    MCP_TIMEOUT_SEC: 60
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

export function loadSetting(): IConfig {
    const configPath = getConfigurationPath();
    
    if (!fs.existsSync(configPath)) {
        return createConfig();
    }
    
    try {
        const configData = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configData) as IConfig;
        if (!config.LLM_INFO || (Array.isArray(config.LLM_INFO) && config.LLM_INFO.length === 0)) {
            config.LLM_INFO = llms;
        }        
        return config;
    } catch (error) {
        console.error('Error loading config file, creating new one:', error);
        return createConfig();
    }
}

export function saveSetting(config: Partial<IConfig>): void {
    const configPath = getConfigurationPath();
    console.log('save to ' + configPath);
    
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving config file:', error);
        throw error;
    }
}

export function getTour() {
    const configPath = getConfigurationPath();
    const KEY = path.join(path.dirname(configPath), 'KEY');
    console.log(KEY);
    
    if (!fs.existsSync(KEY)) {
        return {
            userHasReadGuide: false
        };
    }
    return {
        userHasReadGuide: true
    };
}

export function setTour(userHasReadGuide: boolean): void {
    const configPath = getConfigurationPath();
    const KEY = path.join(path.dirname(configPath), 'KEY');
    if (userHasReadGuide) {
        const key = `直面恐惧，创造未来
Face your fears, create the future
恐怖に直面し、未来を創り出す`;
        fs.writeFileSync(KEY, key, 'utf-8');
    }
}