<script lang="ts">
    import { page } from '$app/stores';
    import LL, { locale } from '$i18n/i18n-svelte';
    import { locales } from '$i18n/i18n-util';
    import { loadArticle } from '$lib/utils';
    import { fade } from 'svelte/transition';
</script>

<dl out:fade={{ duration: 300 }} in:fade class="language_select_area_list">
    {#each locales as l}
        <button on:click={(e) => loadArticle(e, $page.url, l)} class="language_names" class:lang_selected={l === $locale}>
            <span class="language_main_name">
                {$LL.header['langSelectArea'][l].mainName()}
            </span>
            <span class="language_sub_name">
                {$LL.header['langSelectArea'][l].subName()}
            </span>
        </button>
    {/each}
</dl>
