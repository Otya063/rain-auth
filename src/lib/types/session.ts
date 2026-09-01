/* 会員登録フローの一時セッションデータ（discord認証前はusername/hashedPasswordのみ）
====================================================*/
export interface PreRegisterData {
    username: string;
    hashedPassword: string;
    discordId?: string;
    hashedVerificationCode?: string;
}

/* ディスコード連携フローの一時セッションデータ
====================================================*/
export interface LinkDiscordData {
    discordId: string;
    discordUsername: string;
    discordAvatar: string | null;
    hashedVerificationCode: string;
    userId?: number;
}

/* パスワード再設定フローの一時セッションデータ
====================================================*/
export interface ResetPasswordData {
    userId: number;
    username: string;
    hashedVerificationCode: string;
}

/* キャラクター切り替えフローの一時セッションデータ
====================================================*/
export interface SwitchCharacterData {
    discordId: string;
    userId: number;
    currentCharId: number;
    hashedVerificationCode: string;
}
