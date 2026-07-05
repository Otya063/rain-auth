import postgres from 'postgres';
import type { DatabaseConfig } from '$lib/types';

let _sql: ReturnType<typeof postgres> | null = null;

/**
 * データベースを初期化する
 *
 * @param config - データベース接続に必要な情報を含むオブジェクト
 */
export const initDb = (config: DatabaseConfig): void => {
    if (_sql) {
        return; // 既に初期化済みならスキップ
    }

    _sql = postgres({
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password,
    });

    return;
};

/**
 * データベース接続インスタンスを取得する
 *
 * @returns データベース接続インスタンス
 */
export const getDb = (): ReturnType<typeof postgres> => {
    if (!_sql) {
        throw new Error('DB is not initialized. Call initDb() first.');
    }

    return _sql;
};
