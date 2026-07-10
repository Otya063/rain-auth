<script lang="ts">
    import LangSelectArea from './LangSelectArea.svelte';
    import LL from '$i18n/i18n-svelte';

    let { pathname, hasAuthCode }: { pathname: string; hasAuthCode: boolean } = $props();
    let list = $state(false);

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
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="header_platform"></label>

        <button
            id="sel_btn"
            onclick={() => onClickLangSel()}
            class="header_language_selector"
            class:disabled_elm={pathname.includes('reset-password/') ||
                pathname.includes('link-discord/') ||
                pathname.includes('switch-character/') ||
                (pathname.includes('register/') && hasAuthCode)}
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
