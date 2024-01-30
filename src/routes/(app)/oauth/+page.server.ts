import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { LL } }) => {
    throw error(400, {
        message: '',
        message1: LL.error['oauth'].message1(),
        message2: [LL.error['oauth'].noDataForAuth()],
        message3: LL.error['oauth'].noDataForAuthMsg3(),
    });
};
