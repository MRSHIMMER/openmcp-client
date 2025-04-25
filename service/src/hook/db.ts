import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import * as os from 'os';
import * as path from 'path';

interface Entity {
    id: string | number;
    [key: string]: any;
}

export class LocalDB<T extends Entity> {
    private db: any;

    constructor(private tableName: string) {
        this.init();
    }

    private async init() {
        // 默认存储在用户目录的 .openmcp 目录下
        const homedir = os.homedir();
        const filename = path.join(homedir, '.openmcp', 'index.db');
        
        this.db = await open({
            filename,
            driver: sqlite3.Database
        });

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