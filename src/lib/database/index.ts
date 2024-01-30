import {
    PrismaClient,
    type characters,
    type discord,
    type discord_register,
    type launcher_banner,
    type launcher_info,
    type launcher_system,
    type suspended_account,
    type users,
} from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { DATABASE_URL } from '$env/static/private';
import type { InformationType } from '$lib/types';
import _ from 'lodash';

export const db = new PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL,
        },
    },
}).$extends(withAccelerate());

class ServerDataManager {
    /* Characters
    ====================================================*/
    public async getAllCharacters(): Promise<characters[]> {
        return await db.characters.findMany({});
    }

    public async getCharactersByUserId(user_id: number): Promise<characters[]> {
        return await db.characters.findMany({
            where: {
                user_id,
            },
        });
    }

    /* Discord (Character)
    ====================================================*/
    public async getAllLinkedCharacters(): Promise<discord[]> {
        return await db.discord.findMany({});
    }

    public async getLinkedCharactersByDiscordId(discord_id: string): Promise<discord | null> {
        return await db.discord.findFirst({
            where: {
                discord_id,
            },
        });
    }

    public async getLinkedCharacterByCharId(char_id: number): Promise<discord | null> {
        return await db.discord.findFirst({
            where: {
                char_id,
            },
        });
    }

    /* Discord Register (User Account)
    ====================================================*/
    public async getLinkedUserByUserId(user_id: number): Promise<discord_register | null> {
        return await db.discord_register.findFirst({
            where: {
                user_id,
            },
        });
    }

    public async getLinkedUserByDiscordId(discord_id: string): Promise<discord_register | null> {
        return await db.discord_register.findFirst({
            where: {
                discord_id,
            },
        });
    }

    /* Launcher Banner
    ====================================================*/
    public async getBannerData(): Promise<launcher_banner[]> {
        return await db.launcher_banner.findMany({});
    }

    /* Launcher Information
    ====================================================*/
    public async getInformation(type: InformationType): Promise<launcher_info[] | { [key: string]: launcher_info[] }> {
        switch (type) {
            // important info
            case 'IMP': {
                return await db.launcher_info.findMany({
                    where: {
                        type: 'Important',
                    },
                });
            }

            // defects and trobles info
            case 'DNT': {
                return await db.launcher_info.findMany({
                    where: {
                        type: 'Defects and Troubles',
                    },
                });
            }

            // management and service info
            case 'MAS': {
                return await db.launcher_info.findMany({
                    where: {
                        type: 'Management and Service',
                    },
                });
            }

            // in-game events info
            case 'IGE': {
                return await db.launcher_info.findMany({
                    where: {
                        type: 'In-Game Events',
                    },
                });
            }

            // updates and maintenance info
            case 'UAM': {
                return await db.launcher_info.findMany({
                    where: {
                        type: 'Updates and Maintenance',
                    },
                });
            }

            // all info
            case 'ALL': {
                return {
                    Important: await db.launcher_info.findMany({
                        where: {
                            type: 'Important',
                        },
                    }),

                    'Defects and Troubles': await db.launcher_info.findMany({
                        where: {
                            type: 'Defects and Troubles',
                        },
                    }),

                    'Management and Service': await db.launcher_info.findMany({
                        where: {
                            type: 'Management and Service',
                        },
                    }),

                    'In-Game Events': await db.launcher_info.findMany({
                        where: {
                            type: 'In-Game Events',
                        },
                    }),

                    'Updates and Maintenance': await db.launcher_info.findMany({
                        where: {
                            type: 'Updates and Maintenance',
                        },
                    }),
                };
            }

            default:
                return [
                    {
                        id: 0,
                        title: '',
                        url: '',
                        type: '',
                        created_at: new Date(),
                    },
                ];
        }
    }

    /* Launcher System
    ====================================================*/
    public async getLauncherSystem(): Promise<launcher_system | null> {
        return await db.launcher_system.findUnique({
            where: {
                id: 1,
            },
        });
    }

    /* Suspended Account
    ====================================================*/
    public async getAllSuspendedUsers(): Promise<suspended_account[]> {
        return await db.suspended_account.findMany({});
    }

    public async getSuspendedUsersByUsername(username: string): Promise<suspended_account | null> {
        return await db.suspended_account.findFirst({
            where: {
                username,
            },
        });
    }

    public async getSuspendedUsersByUserId(user_id: number): Promise<suspended_account | null> {
        return await db.suspended_account.findFirst({
            where: {
                user_id,
            },
        });
    }

    /* Users
    ====================================================*/
    public async getAllUsers(): Promise<users[]> {
        return await db.users.findMany({});
    }

    public async getUserByUsername(username: string): Promise<users | null> {
        return await db.users.findUnique({
            where: {
                username,
            },
        });
    }

    public async getUserByUserId(id: number): Promise<users | null> {
        return await db.users.findUnique({
            where: {
                id,
            },
        });
    }

    public async getUserByAuthToken(web_login_key: string): Promise<users | null> {
        return await db.users.findFirst({
            where: {
                web_login_key,
            },
        });
    }
}

const ServerData = new ServerDataManager();

export default ServerData;
