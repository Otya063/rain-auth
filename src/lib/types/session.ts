/* 会員登録フローの一時セッションデータ
====================================================*/
export interface PreRegisterData {
    discordAccessToken: string;
    discordId: string;
    username: string;
    hashedPassword: string;
}

/* ディスコード連携フローの一時セッションデータ
====================================================*/
export interface LinkDiscordData {
    discordAccessToken: string;
    discordId: string;
    discordUsername: string;
    discordAvatar: string | null;
    userId?: number;
}

/* パスワード再設定フローの一時セッションデータ
====================================================*/
export interface ResetPasswordData {
    discordAccessToken: string;
    discordId: string;
    userId: number;
    username: string;
}

/* キャラクター切り替えフローの一時セッションデータ
====================================================*/
export interface SwitchCharacterData {
    discordId: string;
    discordUsername: string;
    userId: number;
    currentCharId: number;
}
