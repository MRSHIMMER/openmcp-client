import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

interface Entity {
    id: string | number;
    [key: string]: any;
}

const dbConnections: Record<string, any> = {};

export class LocalDB<T extends Entity> {
    private db: any;

    constructor(private tableName: string) {
        this.init();
    }

    private async init() {
        const homedir = os.homedir();
        const filename = path.join(homedir, '.openmcp', 'index.db');

        if (!dbConnections[filename]) {
            dbConnections[filename] = await open({
                filename,
                driver: sqlite3.Database
            });
        }

        this.db = dbConnections[filename];

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS ${this.tableName} (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL
            )
        `);
    }

    async insert(entity: T): Promise<void> {
        await this.db.run(
            `INSERT OR REPLACE INTO ${this.tableName} (id, data) VALUES (?, ?)`,
            entity.id,
            JSON.stringify(entity)
        );
    }

    async findById(id: string | number): Promise<T | undefined> {
        const row = await this.db.get(
            `SELECT data FROM ${this.tableName} WHERE id = ?`,
            id
        );
        return row ? JSON.parse(row.data) : undefined;
    }

    async findAll(): Promise<T[]> {
        const rows = await this.db.all(
            `SELECT data FROM ${this.tableName}`
        );
        return rows.map((row: any) => JSON.parse(row.data));
    }

    async delete(id: string | number): Promise<void> {
        await this.db.run(
            `DELETE FROM ${this.tableName} WHERE id = ?`,
            id
        );
    }

    async close(): Promise<void> {
        await this.db.close();
    }
}


class DiskStorage {
    #storageHome: string;

    constructor() {
        const homedir = os.homedir();
        const imageStorageFolder = path.join(homedir, '.openmcp', 'storage');
        
        // 确保存储目录存在
        if (!fs.existsSync(imageStorageFolder)) {
            fs.mkdirSync(imageStorageFolder, { recursive: true });
        }

        this.#storageHome = imageStorageFolder;
    }

    public async get(filename: string): Promise<Buffer | null> {
        const filePath = path.join(this.#storageHome, filename);
        if (fs.existsSync(filePath)) {
            return fs.promises.readFile(filePath);
        }
        return null;
    }

    public async set(filename: string, data: string | Buffer, options?: fs.WriteFileOptions): Promise<void> {
        const filePath = path.join(this.#storageHome, filename);
        await fs.promises.writeFile(filePath, data, options);
    }

    public async delete(filename: string): Promise<void> {
        const filePath = path.join(this.#storageHome, filename);
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    }

    public getSync(filename: string): Buffer | null {
        const filePath = path.join(this.#storageHome, filename);
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath);
        }
        return null;
    }

    public setSync(filename: string, data: string | Buffer, options?: fs.WriteFileOptions): void {
        const filePath = path.join(this.#storageHome, filename);
        fs.writeFileSync(filePath, data, options);
    }

    public getStoragePath(filename: string): string {
        return path.join(this.#storageHome, filename);
    }

    public deleteSync(filename: string): void {
        const filePath = path.join(this.#storageHome, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

interface SettingItem extends Entity {
    MODEL_INDEX: number;
    [key: string]: any;
}

interface OcrItem extends Entity {
    filename: string;
    text?: string;
    createTime: number;
}

export const diskStorage = new DiskStorage();

export const settingDB = new LocalDB<SettingItem>('setting');
export const ocrDB = new LocalDB<OcrItem>('ocr');