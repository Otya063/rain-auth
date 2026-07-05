import { error } from '@sveltejs/kit';
import { DateTime } from 'luxon';
import type { ActionTableTypeMap, InputType, ReturnType, ConstructorParams, UserRow, CharacterRow, DiscordRow, DiscordRegisterRow } from '$lib/types';
import { getDb } from '.';

export class PostgresManager<O extends keyof ActionTableTypeMap, T extends keyof ActionTableTypeMap[O]> {
    private readonly action: O;
    private readonly table: T;
    private readonly object?: InputType<O, T>;
    private get sql() {
        return getDb(); // 必要な時に取得
    }

    private readonly functionsMap: {
        [K in keyof ActionTableTypeMap]: {
            [U in keyof ActionTableTypeMap[K]]: (object: InputType<K, U>) => Promise<ReturnType<K, U>>;
        };
    } = {
        create: {
            account: this.createAccount.bind(this),
            discordLink: this.createDiscordLink.bind(this),
        },
        get: {
            chkUserExist: this.chkUserExist.bind(this),
            chkDiscordExist: this.chkDiscordExist.bind(this),
            discordData: this.getDiscordData.bind(this),
            userByUsername: this.getUserByUsername.bind(this),
            userById: this.getUserById.bind(this),
            charactersByUserId: this.getCharactersByUserId.bind(this),
            characterById: this.getCharacterById.bind(this),
        },
        update: {
            loginKey: this.updateLoginKey.bind(this),
            password: this.updatePassword.bind(this),
            discordCharId: this.updateDiscordCharId.bind(this),
        },
    };

    // 条件型を使用したコンストラクタ（第三引数が不要な場合とそうでない場合のサポートのため）
    constructor(...params: ConstructorParams<O, T>) {
        const [action, table, object] = params;
        this.action = action;
        this.table = table;
        this.object = object;
    }

    public async execute(): Promise<ReturnType<O, T>> {
        const executeActFunc = this.functionsMap[this.action];
        const executeFunc = executeActFunc[this.table];

        // 指定したアクションが有効かどうか、またそのアクション内で指定したテーブルがサポートされているか確認
        if (executeFunc) {
            return (await executeFunc(this.object as any)) as ReturnType<O, T>;
        } else {
            error(400, { message: '', message1: undefined, message2: [`Operation ${this.action} for table ${String(this.table)} isn't supported.`], message3: undefined });
        }
    }

    private async createAccount(obj: InputType<'create', 'account'>): Promise<ReturnType<'create', 'account'>> {
        try {
            const { userId, charId } = await this.sql.begin(async (sql) => {
                const [{ id: userId }] = await sql`
                    INSERT INTO users (username, password, return_expires) VALUES (${obj.username}, ${obj.hashedPassword}, ${DateTime.fromJSDate(new Date()).toString()}) RETURNING id
                `;
                const [{ id: charId }] = await sql`
                    INSERT INTO characters (user_id, is_female, is_new_character, name, unk_desc_string, hrp, gr, weapon_type, last_login)
                    VALUES (${userId}, '0', '1', '', '', 0, 0, 0, ${Math.floor(Date.now() / 1000)})
                    RETURNING id
                `;

                return { userId, charId };
            });

            return { success: true, message: '', userId, charId };
        } catch (err) {
            if (err instanceof Error) {
                return { success: false, message: err.message };
            } else if (typeof err === 'string') {
                return { success: false, message: err };
            } else {
                return { success: false, message: '' };
            }
        }
    }

    private async createDiscordLink(obj: InputType<'create', 'discordLink'>): Promise<ReturnType<'create', 'discordLink'>> {
        try {
            await this.sql.begin(async (sql) => {
                await sql`INSERT INTO discord (char_id, discord_id) VALUES (${obj.charId}, ${obj.discordId})`;
                await sql`INSERT INTO discord_register (user_id, discord_id) VALUES (${obj.userId}, ${obj.discordId})`;
            });

            return { success: true, message: '' };
        } catch (err) {
            if (err instanceof Error) {
                return { success: false, message: err.message };
            } else if (typeof err === 'string') {
                return { success: false, message: err };
            } else {
                return { success: false, message: '' };
            }
        }
    }

    private async chkUserExist(obj: InputType<'get', 'chkUserExist'>): Promise<ReturnType<'get', 'chkUserExist'>> {
        const [user] = await this.sql`SELECT id FROM users WHERE username = ${obj.username}`;

        return !!user;
    }

    private async chkDiscordExist(obj: InputType<'get', 'chkDiscordExist'>): Promise<ReturnType<'get', 'chkDiscordExist'>> {
        const [discordRegister] = await this.sql`SELECT user_id FROM discord_register WHERE user_id = ${obj.userId}`;

        return !!discordRegister;
    }

    private async getDiscordData(obj: InputType<'get', 'discordData'>): Promise<ReturnType<'get', 'discordData'>> {
        const [discord] = await this.sql<DiscordRow[]>`SELECT char_id FROM discord WHERE discord_id = ${obj.discordId}`;
        const [discordRegister] = await this.sql<DiscordRegisterRow[]>`SELECT user_id FROM discord_register WHERE discord_id = ${obj.discordId}`;

        return { charId: discord?.char_id ?? null, userId: discordRegister?.user_id ?? null };
    }

    private async getUserByUsername(obj: InputType<'get', 'userByUsername'>): Promise<ReturnType<'get', 'userByUsername'>> {
        const [user] = await this.sql<UserRow[]>`SELECT id, username, password FROM users WHERE username = ${obj.username}`;

        return user ?? null;
    }

    private async getUserById(obj: InputType<'get', 'userById'>): Promise<ReturnType<'get', 'userById'>> {
        const [user] = await this.sql<Pick<UserRow, 'id' | 'username'>[]>`SELECT id, username FROM users WHERE id = ${obj.id}`;

        return user ?? null;
    }

    private async getCharactersByUserId(obj: InputType<'get', 'charactersByUserId'>): Promise<ReturnType<'get', 'charactersByUserId'>> {
        return await this.sql<CharacterRow[]>`SELECT id, name, hrp, gr, weapon_type FROM characters WHERE user_id = ${obj.userId}`;
    }

    private async getCharacterById(obj: InputType<'get', 'characterById'>): Promise<ReturnType<'get', 'characterById'>> {
        const [character] = await this.sql<Omit<CharacterRow, 'id'>[]>`SELECT name, hrp, gr, weapon_type FROM characters WHERE id = ${obj.charId}`;

        return character ?? null;
    }

    private async updateLoginKey(obj: InputType<'update', 'loginKey'>): Promise<ReturnType<'update', 'loginKey'>> {
        try {
            await this.sql`UPDATE users SET ${this.sql(obj.column)} = ${obj.value} WHERE username = ${obj.username}`;

            return { success: true, message: '' };
        } catch (err) {
            if (err instanceof Error) {
                return { success: false, message: err.message };
            } else if (typeof err === 'string') {
                return { success: false, message: err };
            } else {
                return { success: false, message: '' };
            }
        }
    }

    private async updatePassword(obj: InputType<'update', 'password'>): Promise<ReturnType<'update', 'password'>> {
        try {
            const [updated] = await this.sql`UPDATE users SET password = ${obj.value} WHERE id = ${obj.id} AND username = ${obj.username} RETURNING id`;

            return { success: !!updated, message: '' };
        } catch (err) {
            if (err instanceof Error) {
                return { success: false, message: err.message };
            } else if (typeof err === 'string') {
                return { success: false, message: err };
            } else {
                return { success: false, message: '' };
            }
        }
    }

    private async updateDiscordCharId(obj: InputType<'update', 'discordCharId'>): Promise<ReturnType<'update', 'discordCharId'>> {
        try {
            const [updated] = await this.sql`UPDATE discord SET char_id = ${obj.charId} WHERE discord_id = ${obj.discordId} RETURNING char_id`;

            return { success: !!updated, message: '' };
        } catch (err) {
            if (err instanceof Error) {
                return { success: false, message: err.message };
            } else if (typeof err === 'string') {
                return { success: false, message: err };
            } else {
                return { success: false, message: '' };
            }
        }
    }
}
