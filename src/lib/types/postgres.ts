/**
 * データベース認証情報
 */
export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
}

/**
 * usersテーブルの行データ
 */
export type UserRow = {
    id: number;
    username: string;
    password: string;
};

/**
 * charactersテーブルの行データ（一部カラムのみ）
 */
export type CharacterRow = {
    id: number;
    name: string | null;
    hrp: number | null;
    gr: number | null;
    weapon_type: number | null;
};

/**
 * discordテーブルの行データ（一部カラムのみ）
 */
export type DiscordRow = {
    char_id: number;
};

/**
 * discord_registerテーブルの行データ（一部カラムのみ）
 */
export type DiscordRegisterRow = {
    user_id: number;
};

/**
 * 引数の「アクション名」と「テーブル名」に基づく入力と戻り値の型マッピング
 */
export type ActionTableTypeMap = {
    create: {
        account: {
            input: {
                username: string;
                hashedPassword: string;
            };
            return: {
                success: boolean;
                message: string;
                userId?: number;
                charId?: number;
            };
        };
        discordLink: {
            input: {
                charId: number;
                userId: number;
                discordId: string;
            };
            return: {
                success: boolean;
                message: string;
            };
        };
    };
    get: {
        chkUserExist: {
            input: {
                username: string;
            };
            return: boolean;
        };
        chkDiscordExist: {
            input: {
                userId: number;
            };
            return: boolean;
        };
        discordData: {
            input: {
                discordId: string;
            };
            return: {
                charId: number | null;
                userId: number | null;
            };
        };
        userByUsername: {
            input: {
                username: string;
            };
            return: UserRow | null;
        };
        userById: {
            input: {
                id: number;
            };
            return: Pick<UserRow, 'id' | 'username'> | null;
        };
        charactersByUserId: {
            input: {
                userId: number;
            };
            return: CharacterRow[];
        };
        characterById: {
            input: {
                charId: number;
            };
            return: Omit<CharacterRow, 'id'> | null;
        };
    };
    update: {
        loginKey: {
            input: {
                username: string;
                column: 'web_login_key' | 'web_login_key_mobile';
                value: string;
            };
            return: {
                success: boolean;
                message: string;
            };
        };
        password: {
            input: {
                id: number;
                username: string;
                value: string;
            };
            return: {
                success: boolean;
                message: string;
            };
        };
        discordCharId: {
            input: {
                discordId: string;
                charId: number;
            };
            return: {
                success: boolean;
                message: string;
            };
        };
    };
};

/**
 * 引数の「アクション名」と「テーブル名」に基づいて第三引数に渡す`データの型`を抽出するユーティリティタイプ
 */
export type InputType<O extends keyof ActionTableTypeMap, T extends keyof ActionTableTypeMap[O]> = 'input' extends keyof ActionTableTypeMap[O][T] ? ActionTableTypeMap[O][T]['input'] : never;

/**
 * 引数の「アクション名」と「テーブル名」に基づいて`戻り値の型`を抽出するユーティリティタイプ
 */
export type ReturnType<O extends keyof ActionTableTypeMap, T extends keyof ActionTableTypeMap[O]> = 'return' extends keyof ActionTableTypeMap[O][T] ? ActionTableTypeMap[O][T]['return'] : never;

/**
 * コンストラクタ引数用条件型\
 * 第一引数と第二引数の値に応じて、第三引数が必要かどうか判断する
 */
export type ConstructorParams<O extends keyof ActionTableTypeMap, T extends keyof ActionTableTypeMap[O]> = InputType<O, T> extends undefined ? [O, T] : [O, T, InputType<O, T>];
