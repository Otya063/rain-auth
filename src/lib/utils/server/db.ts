import { AsyncLocalStorage } from 'node:async_hooks';
import postgres from 'postgres';
import type { ExecutionContext } from '@cloudflare/workers-types';

type Sql = ReturnType<typeof postgres>;

/**
 * Workersでは、あるリクエストで生成したI/Oオブジェクト（TCP接続など）を
 * 別のリクエストから触れないため、接続はモジュールスコープで使い回さず
 * リクエストごとに生成し、AsyncLocalStorageでそのリクエスト内に閉じ込める
 */
const dbStore = new AsyncLocalStorage<Sql>();

/**
 * リクエストスコープのデータベース接続を張り、その中で処理を実行する
 *
 * @param connectionString - Hyperdrive経由の接続文字列
 * @param ctx - 応答後に接続を閉じるためのExecutionContext
 * @param fn - 接続下で実行する処理
 * @returns fnの戻り値
 */
export const withDb = async <T>(connectionString: string, ctx: ExecutionContext | undefined, fn: () => T | Promise<T>): Promise<T> => {
    const sql = postgres(connectionString, {
        // Workersの同時接続上限は6。Hyperdrive側でプールされるため、Worker単体では少なくてよい
        max: 5,
        // 接続時のカタログ問い合わせ（1往復）を省く
        fetch_types: false,
        // デフォルトは30秒。長く待たせずエラーとして扱う
        connect_timeout: 10,
    });

    try {
        return await dbStore.run(sql, fn);
    } finally {
        // 応答をブロックしないようにバックグラウンドで切断する（放置するとDB側の接続が枯渇する）
        // ponytail: load内でawaitせずpromiseを返すストリーミングを使うと、この切断が先に走る。その時はストリーム完了後に閉じること
        const closing = sql.end({ timeout: 5 });
        ctx ? ctx.waitUntil(closing) : await closing;
    }
};

/**
 * データベース接続インスタンスを取得する
 *
 * @returns データベース接続インスタンス
 */
export const getDb = (): Sql => {
    const sql = dbStore.getStore();

    if (!sql) {
        throw new Error('DB is not initialized. Call withDb() first.');
    }

    return sql;
};
