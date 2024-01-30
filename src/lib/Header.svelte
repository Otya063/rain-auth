<script lang="ts">
    import LangSelectArea from './LangSelectArea.svelte';
    import LL from '$i18n/i18n-svelte';

    export let pathname: string;
    let list = false;

    const onClickLangSel = () => {
        const btn = document.getElementById('sel_btn') as HTMLButtonElement;

        btn.disabled = true;
        btn.classList.toggle('lang_arrow_open');

        if (list) {
            setTimeout(() => {
                btn.disabled = false;
            }, 1000);
            list = false;
        } else {
            setTimeout(() => {
                list = true;
                btn.disabled = false;
            }, 700);
        }
    };
</script>

<header>
    <div class="header_inner">
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="header_platform" />

        <button
            id="sel_btn"
            on:click={() => onClickLangSel()}
            class="header_language_selector"
            class:disabled_elm={pathname.includes('register/done/') || pathname.includes('reset-password/') || pathname.includes('link-discord/')}
        >
            <span class="global_mark material-icons">public</span>
            <span class="current_language">
                {$LL.header['currentLang']()}
            </span>
            <span class="lang_arrow material-symbols-outlined">expand_more</span>

            {#if list}
                <LangSelectArea />
            {/if}
        </button>
    </div>
</header>
