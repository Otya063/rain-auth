import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ platform }) => {
    if (platform?.env.MAINTENANCE_MODE !== 'true') {
        throw error(404);
    } else {
        const date = platform?.env.MAINTENANCE_DATE;
        return { date };
    }
};
