export * from './discord';
export * from './api';

/* Discord Account Linking Character Data
====================================================*/
export interface LinkedCharacterData {
    id: number;
    name: string | null;
    hr: number;
    gr: number | null;
    weapon: string;
}

/* Rain Web Information Type
====================================================*/
export type InformationType = 'IMP' | 'DNT' | 'MAS' | 'IGE' | 'UAM' | 'ALL';

/* Weapon Name Type
====================================================*/
export type WeaponType = WeaponJapanse | WeaponEnglish | 'Invalid Input';

type WeaponJapanse =
    | '大剣'
    | 'ヘビィボウガン'
    | 'ハンマー'
    | 'ランス'
    | '片手剣'
    | 'ライトボウガン'
    | '双剣'
    | '太刀'
    | '狩猟笛'
    | 'ガンランス'
    | '弓'
    | '穿龍棍'
    | 'スラッシュアックスF'
    | 'マグネットスパイク';

type WeaponEnglish =
    | 'Great Sword'
    | 'Heavy Bowgun'
    | 'Hammer'
    | 'Lance'
    | 'Sword & Shield'
    | 'Light Bowgun'
    | 'Dual Swords'
    | 'Long Sword'
    | 'Hunting Horn'
    | 'Gunlance'
    | 'Bow'
    | 'Tonfa'
    | 'Switch Axe F'
    | 'Magnet Spike';

/* Validate Token
====================================================*/
export interface ValidateToken {
    validateSuccess: boolean;
    validateError: string | null;
}

/* Turnstile Fetch Response
====================================================*/
export interface TokenValidateResponse {
    'error-codes': string[];
    success: boolean;
    action: string;
    cdata: string;
}
