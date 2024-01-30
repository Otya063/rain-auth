/* Rain API POST Response
====================================================*/
export interface RainApiPostResponseData {
    user_key: string;
    expire_ttl: number;
}

/*=========================================================
　　　　　Pre-Register API
=======================================================*/
/* POST (Request Body) / Get (Response)
====================================================*/
export interface PreRegisterGetData {
    discord_access_token: string;
    discord_id: string;
    username: string;
    hashed_password: string;
}

/*=========================================================
　　　　　Link Discord API
=======================================================*/
/* POST (Request Body) / GET (Response)
====================================================*/
export interface LinkDiscordGetData {
    discord_access_token: string;
    discord_id: string;
    discord_username: string;
    discord_avatar: string;
    user_id?: number;
}

/*=========================================================
　　　　　Reset Password
=======================================================*/
/* POST (Request Body) / GET (Response)
====================================================*/
export interface ResetPasswordGetData {
    discord_access_token: string;
    discord_id: string;
    user_id: number;
    username: string;
}
