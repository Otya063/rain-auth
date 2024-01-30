import type { WeaponType } from '$lib/types';

/* Convert FormData Into Object
====================================================*/
export const convFormDataToObj = (data: FormData): Record<string, FormDataEntryValue> => {
    const obj = Object.fromEntries(data.entries());

    return obj;
};

/* Convert Hrp Into True HR
====================================================*/
export const convHrpToHr = (hrp: number | null): number => {
    switch (hrp) {
        case 999: {
            return 7;
        }

        case 998: {
            return 6;
        }
        case 299: {
            return 5;
        }
        case 99: {
            return 4;
        }

        case 50: {
            return 3;
        }

        case 30: {
            return 2;
        }
        case 1: {
            return 1;
        }

        default: {
            return 0;
        }
    }
};

/* Get Weapon Type by Dec
====================================================*/
export const getWpnTypeByDec = (dec: number | null, lang: string): WeaponType => {
    switch (lang) {
        case 'ja': {
            switch (dec) {
                case 0: {
                    return '大剣';
                }

                case 1: {
                    return 'ヘビィボウガン';
                }

                case 2: {
                    return 'ハンマー';
                }

                case 3: {
                    return 'ランス';
                }

                case 4: {
                    return '片手剣';
                }

                case 5: {
                    return 'ライトボウガン';
                }

                case 6: {
                    return '双剣';
                }

                case 7: {
                    return '太刀';
                }

                case 8: {
                    return '狩猟笛';
                }

                case 9: {
                    return 'ガンランス';
                }

                case 10: {
                    return '弓';
                }

                case 11: {
                    return '穿龍棍';
                }

                case 12: {
                    return 'スラッシュアックスF';
                }

                case 13: {
                    return 'マグネットスパイク';
                }
            }
        }

        case 'en': {
            switch (dec) {
                case 0: {
                    return 'Great Sword';
                }
                case 1: {
                    return 'Heavy Bowgun';
                }

                case 2: {
                    return 'Hammer';
                }

                case 3: {
                    return 'Lance';
                }

                case 4: {
                    return 'Sword & Shield';
                }

                case 5: {
                    return 'Light Bowgun';
                }

                case 6: {
                    return 'Dual Swords';
                }

                case 7: {
                    return 'Long Sword';
                }

                case 8: {
                    return 'Hunting Horn';
                }

                case 9: {
                    return 'Gunlance';
                }

                case 10: {
                    return 'Bow';
                }

                case 11: {
                    return 'Tonfa';
                }

                case 12: {
                    return 'Switch Axe F';
                }

                case 13: {
                    return 'Magnet Spike';
                }
            }
        }

        default: {
            return 'Invalid Input';
        }
    }
};
