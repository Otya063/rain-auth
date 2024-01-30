export interface Token {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

/* Application Resource
====================================================*/
interface Application {
    id: string;
    name: string;
    icon: string | null;
    description: string;
    rpc_origins?: string[];
    bot_public: boolean;
    bot_require_code_grant: boolean;
    bot?: Partial<User>;
    terms_of_service_url?: string;
    privacy_policy_url?: string;
    owner?: Partial<User>;
    summary: string; // deprecated and will be removed in v11
    verify_key: string;
    team: Team | null;
    guild_id?: string;
    guild?: Partial<Guild>;
    primary_sku_id?: string;
    slug?: string;
    cover_image?: string;
    flags?: number;
    approximate_guild_count?: number;
    redirect_uris?: string[];
    interactions_endpoint_url?: string;
    role_connections_verification_url?: string;
    tags?: string[];
    install_params?: InstallParams;
    custom_install_url?: string;
}

interface InstallParams {
    scopes: string[];
    permissions: string;
}

/* Channels Resource
====================================================*/
export interface Channel {
    id: string;
    type: number;
    guild_id?: string;
    position?: number;
    permission_overwrites?: Overwrite[];
    name?: string | null;
    topic?: string | null;
    nsfw: boolean;
    last_message_id?: string | null;
    bitrate?: number;
    user_limit?: number;
    rate_limit_per_user?: number;
    recipients?: User[];
    icon?: string | null;
    owner_id?: string;
    application_id?: string;
    managed?: boolean;
    parent_id?: string | null;
    last_pin_timestamp?: string | null; // ISO8601 timestamp
    rtc_region?: string | null;
    video_quality_mode?: number;
    message_count?: number;
    member_count?: number;
    thread_metadata?: ThreadMetadata;
    member?: ThreadMember;
    default_auto_archive_duration?: number;
    permissions?: string;
    flags?: number;
    total_messages_sent?: number;
    available_tags?: Tag[];
    applied_tags?: string[];
    default_reaction_emoji?: DefaultReaction;
    default_thread_rate_limit_per_user?: number;
    default_sort_order?: number | null;
    default_forum_layout?: number;
}

export interface Message {
    id: string;
    channel_id: string;
    author: User;
    content: string;
    timestamp: string; // ISO8601 timestamp
    edited_timestamp: string | null; // ISO8601 timestamp
    tts: boolean;
    mention_everyone: boolean;
    mentions: User[];
    mention_roles: Role[];
    mention_channels?: ChannelMention[];
    attachments: Attachment[];
    embeds: Embed[];
    reactions?: Reaction[];
    nonce?: number | string;
    pinned: boolean;
    webhook_id?: string;
    type: number;
    activity?: MessageActivity;
    application?: Partial<Application>;
    application_id?: string;
    message_reference?: MessageReference;
    flags?: number;
    referenced_message?: Message | null;
    interaction?: MessageInteraction;
    thread?: Channel;
    components?: [];
    sticker_items?: StickerItem[];
    stickers?: Sticker[];
    position?: number;
    role_subscription_data?: RoleSubscriptionData;
    //resolved?: ResolvedData;
}

interface Embed {
    title?: string;
    type?: string;
    description?: string;
    url?: string;
    timestamp?: string; // ISO8601 timestamp
    color?: number;
    footer?: EmbedFooter;
    image?: EmbedImage;
    thumbnail?: EmbedThumbnail;
    video?: EmbedVideo;
    provider?: EmbedProvider;
    author?: EmbedAuthor;
    fields?: EmbedField[];
}

interface EmbedFooter {
    text: string;
    icon_url?: string;
    proxy_icon_url?: string;
}

interface EmbedImage {
    url: string;
    proxy_url?: string;
    height?: number;
    width?: number;
}

interface EmbedThumbnail {
    url: string;
    proxy_url?: string;
    height?: number;
    width?: number;
}

interface EmbedVideo {
    url?: string;
    proxy_url?: string;
    height?: number;
    width?: number;
}

interface EmbedProvider {
    name?: string;
    url?: string;
}

interface EmbedAuthor {
    name?: string;
    url?: string;
    icon_url?: string;
    proxy_icon_url?: string;
}

interface EmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

interface Attachment {
    id: string;
    filename: string;
    description?: string;
    content_type?: string;
    size: number;
    url: string;
    proxy_url: string;
    height?: number | null;
    width?: number | null;
    ephemeral?: boolean;
    duration_secs?: number;
    waveform?: string;
    flags?: number;
}

interface ChannelMention {
    id: string;
    guild_id: string;
    type: number;
    name: string;
}

interface Reaction {
    count: number;
    count_details: {};
    me: boolean;
    me_burst: boolean;
    emoji: Partial<Emoji>;
    burst_colors: [];
}

interface MessageActivity {
    type: number;
    party_id?: string;
}

interface Overwrite {
    id: string;
    type: number;
    allow: string;
    deny: string;
}

interface ThreadMetadata {
    archived: boolean;
    auto_archive_duration: number;
    archive_timestamp: string; // ISO8601 timestamp
    locaked: boolean;
    invitable?: boolean;
    create_timestamp?: string | null; // ISO8601 timestamp
}

interface ThreadMember {
    id?: string;
    user_id?: string;
    join_timestamp: string; // ISO8601 timestamp
    flags: number;
    member?: GuildMember;
}

interface Tag {
    id: string;
    name: string;
    moderated: boolean;
    emoji_id: string | null;
    emoji_name: string | null;
}

interface DefaultReaction {
    emoji_id: string | null;
    emoji_name: string | null;
}

interface MessageReference {
    message_id?: string;
    channel_id?: string;
    guild_id?: string;
    fail_if_not_exists?: boolean;
}

interface MessageInteraction {
    id: string;
    type: InteractionType;
    name: string;
    user: User;
    member?: Partial<GuildMember>;
}

type InteractionType = 'PING' | 'APPLICATION_COMMAND' | 'MESSAGE_COMPONENT' | 'APPLICATION_COMMAND_AUTOCOMPLETE' | 'MODAL_SUBMIT';

interface RoleSubscriptionData {
    role_subscription_listing_id: string;
    tier_name: string;
    total_months_subscribed: number;
    is_renewal: boolean;
}

/* Emoji Resource
====================================================*/
interface Emoji {
    id: string | null;
    name: string | null;
    roles?: Pick<Role, 'id'>[];
    user?: User;
    require_colons?: boolean;
    managed?: boolean;
    animated?: boolean;
    available?: boolean;
}

/* Guild Resource
====================================================*/
interface Guild {
    id: string;
    name: string;
    icon: string | null;
    icon_hash?: string | null;
    splash: string | null;
    discovery_splash: string | null;
    owner?: boolean;
    owner_id: string;
    permissions?: string;
    region?: string | null; // deprecated
    afk_channel_id: string | null;
    afk_timeout: number;
    widget_enabled?: boolean;
    widget_channel_id?: string | null;
    verification_level: number;
    default_message_notifications: number;
    explicit_content_filter: number;
    roles: Role[];
    emojis: Emoji[];
    features: GuildFeatures[];
    mfa_level: number;
    application_id: string | null;
    system_channel_id: string | null;
    system_channel_flags: number;
    rules_channel_id: string | null;
    max_presences?: number | null;
    max_members?: number;
    vanity_url_code: string | null;
    description: string | null;
    banner: string | null;
    premium_tier: number;
    premium_subscription_count?: number;
    preferred_locale: string;
    public_updates_channel_id: string | null;
    max_video_channel_users?: number;
    max_stage_video_channel_users?: number;
    approximate_member_count?: number;
    approximate_presence_count?: number;
    welcome_screen?: WelcomeScreen;
    nsfw_level: number;
    stickers?: Sticker[];
    premium_progress_bar_enabled: boolean;
    safety_alerts_channel_id: string | null;
}

export interface GuildMember {
    user?: User;
    nick?: string | null;
    avatar?: string | null;
    roles: string[];
    joined_at: string; // ISO8601 timestamp
    premium_since?: string | null; // ISO8601 timestamp
    deaf: boolean;
    mute: boolean;
    flags: number;
    pending?: boolean;
    permissions?: string;
    communication_disabled_until?: string | null; // ISO8601 timestamp
}

interface WelcomeScreen {
    description: string | null;
    welcome_channels: WelcomeScreenChannel[];
}

interface WelcomeScreenChannel {
    channel_id: string;
    description: string;
    emoji_id: string | null;
    emoji_name: string | null;
}

type GuildFeatures =
    | 'ANIMATED_BANNER'
    | 'ANIMATED_ICON'
    | 'APPLICATION_COMMAND_PERMISSIONS_V2'
    | 'AUTO_MODERATION'
    | 'BANNER'
    | 'COMMUNITY'
    | 'CREATOR_MONETIZABLE_PROVISIONAL'
    | 'CREATOR_STORE_PAGE'
    | 'DEVELOPER_SUPPORT_SERVER'
    | 'DISCOVERABLE'
    | 'FEATURABLE'
    | 'INVITES_DISABLED'
    | 'INVITE_SPLASH'
    | 'MEMBER_VERIFICATION_GATE_ENABLED'
    | 'MORE_STICKERS'
    | 'NEWS'
    | 'PARTNERED'
    | 'PREVIEW_ENABLED'
    | 'RAID_ALERTS_DISABLED'
    | 'ROLE_ICONS'
    | 'ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE'
    | 'ROLE_SUBSCRIPTIONS_ENABLED'
    | 'TICKETED_EVENTS_ENABLED'
    | 'VANITY_URL'
    | 'VERIFIED'
    | 'VIP_REGIONS'
    | 'WELCOME_SCREEN_ENABLED';

/* Sticker Resource
====================================================*/
interface Sticker {
    id: string;
    pack_id?: string;
    name: string;
    description: string | null;
    tags: string;
    asset?: string; // deprecated, now an empty string
    type: number;
    format_type: number;
    available?: boolean;
    guild_id?: string;
    user?: User;
    sort_value?: number;
}

interface StickerItem {
    id: string;
    name: string;
    format_type: number;
}

/* Users Resource
====================================================*/
export interface User {
    id: string;
    username: string;
    discriminator: string;
    global_name: string | null;
    avatar: string | null;
    bot?: boolean;
    system?: boolean;
    mfa_enabled?: boolean;
    banner?: string | null;
    accent_color?: number | null;
    locale?: string;
    verified?: boolean;
    email?: string | null;
    flags?: number;
    premium_type?: number;
    public_flags?: number;
    avatar_decoration?: string | null;
}

/* Permissions
====================================================*/
interface Role {
    id: string;
    name: string;
    color: number;
    hoist: boolean;
    icon?: string | null;
    unicode_emoji?: string | null;
    position: number;
    permissions: string;
    managed: boolean;
    mentionable: boolean;
    tags?: RoleTags;
    flags: number;
}

interface RoleTags {
    bot_id?: string;
    integration_id?: string;
    premium_subscriber?: null;
    subscription_listing_id?: string;
    available_for_purchase?: null;
    guild_connections?: null;
}

/* Terms
====================================================*/
interface Team {
    icon: string | null;
    id: string;
    members: TeamMember[];
    name: string;
    owner_user_id: string;
}

interface TeamMember {
    membership_state: number;
    team_id: string;
    user: Partial<User>;
    role: string;
}
