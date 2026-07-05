<script lang="ts">
    import type { ActionData, PageData } from './$types';
    import { applyAction, enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { PUBLIC_AUTH_DOMAIN, PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
    import LL, { locale } from '$i18n/i18n-svelte';
    import { showTip, toggleHidePass, switchBtnInAuth, loadArticle } from '$lib/utils/client';
    import PasswordStrength from '$lib/PasswordStrength.svelte';
    import { onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { Turnstile } from 'svelte-turnstile';

    let { data, form }: { data: PageData; form: ActionData } = $props();

    // codeパラメータがある場合discordから既にリダイレクトされてきている
    const postOauth = page.url.searchParams.has('code');
    let stage = $state(postOauth ? 3 : 1);
    let submitting = $state(false);
    let unauthOps = $state(false); // 不正操作用フラグ
    let warning = $state(postOauth);
    let password = $state<string>();
    let strengthValue = $state<string | null>('');

    const onStrengthChange = (value: string) => {
        strengthValue = value;
    };

    onMount(() => {
        if (!postOauth) return;

        // キャプチャ待機用
        const btnElm = document.getElementById('btn');
        setTimeout(() => {
            warning = false;
            switchBtnInAuth(true, btnElm);
        }, 3000);
    });
</script>

<main
    class="main_inner"
    class:register_stage1={stage === 1}
    class:register_stage2={stage === 2}
    class:auth_notice={stage === 3}
    class:auth_verify={stage === 4}
    class:register_done_stage3={stage === 5}
>
    <h1>{$LL.register['title']()}</h1>

    {#if form?.error || unauthOps || warning}
        <div transition:fade={{ delay: 200 }} class="err_display" class:warning>
            <span class="material-icons">
                {#if form?.error || unauthOps}
                    error
                {:else if warning}
                    warning
                {/if}
            </span>

            <span class="err_text">
                {#if form?.userExist}
                    {$LL.register['userExist']()}
                {:else if form?.invalidUsername}
                    {$LL.register['invUsername']()}
                {:else if form?.invalidUsernameChar}
                    {$LL.register['invUsernameChar']()}
                {:else if form?.invalidPassword}
                    {$LL.register['invPassword']()}
                {:else if form?.invalidPasswordStrength}
                    {$LL.register['invalidPasswordStrength']()}
                {:else if form?.invalidConfPassword}
                    {$LL.register['invConfPassword']()}
                {:else if form?.codeNotMatch}
                    {$LL.resetPassword['codeNotMatch']()}
                {:else if form?.unauthOps || unauthOps}
                    {$LL.error['unauthOps']()}
                {:else if form?.errorCaptcha}
                    {form?.errorCaptchaMsg}
                {:else if warning}
                    {$LL.login['captchaInProg']()}
                {:else}
                    {$LL.error['unauthOps']()}
                {/if}
            </span>
        </div>
    {/if}

    <form
        class="form_area"
        action="?/register"
        method="POST"
        use:enhance={() => {
            // 送信ボタンクリック時
            const btnElm = document.getElementById('btn');
            const labelElm = document.getElementsByClassName('part_label');
            const inputElm = document.querySelectorAll('.wrap_part_input, .part_input');
            switchBtnInAuth(false, btnElm, labelElm, inputElm);
            submitting = true;

            return async ({ result }) => {
                await applyAction(result);

                if (stage === form?.currentStage) {
                    // 成功
                    unauthOps = false;

                    if (form.currentStage === 2) {
                        // discord認証ページへ遷移
                        goto(`${PUBLIC_AUTH_DOMAIN}/${data.locale}/login/?type=register`);
                    } else {
                        switchBtnInAuth(true, btnElm, labelElm, inputElm);
                        stage = form.nextStage;
                    }
                } else if (result.type === 'failure') {
                    // 失敗
                    switchBtnInAuth(true, btnElm, labelElm, inputElm);
                    unauthOps = false;
                } else {
                    // 不正操作
                    switchBtnInAuth(true, btnElm, labelElm, inputElm);
                    unauthOps = true;
                }

                submitting = false;
            };
        }}
    >
        <input id="stage" name="stage" type="hidden" value={stage} />

        {#if stage === 1}
            <div class="form_area_item" out:slide={{ duration: 700, axis: 'y' }}>
                <label for="username" class="part_label">{@html $LL.register['stage1Text'][0]()}</label>
                <div class="wrap_part_input">
                    <input class="part_input" class:error_input={form?.errorUsername} id="username" name="username" placeholder={$LL.login['usernameLabel']()} type="text" autocomplete="off" />
                </div>

                <label for="password" class="part_label">{@html $LL.register['stage1Text'][1]()}</label>
                <div class="wrap_part_input">
                    <input
                        class="part_input"
                        class:error_input={form?.errorPassword}
                        id="password"
                        name="password"
                        type="password"
                        placeholder={$LL.login['passwordLabel']()}
                        autocomplete="off"
                        bind:value={password}
                    />
                    <button id="password_btn" class="hide_password material-icons" type="button" onclick={(e) => toggleHidePass(e)}>visibility_off</button>
                </div>

                <label for="conf_password" class="part_label">{$LL.register['stage1Text'][2]()}</label>
                <div class="wrap_part_input">
                    <input
                        class="part_input"
                        class:error_input={form?.errorPassword}
                        id="conf_password"
                        name="conf_password"
                        type="password"
                        placeholder={$LL.register['stage1Text'][2]()}
                        autocomplete="off"
                    />
                    <button id="conf_password_btn" class="hide_password material-icons" type="button" onclick={(e) => toggleHidePass(e)}>visibility_off</button>
                </div>

                <p class="part_label_no_input" onmouseenter={() => showTip.set(true)} onmouseleave={() => showTip.set(false)}>
                    {$LL.register['stage1Text'][3]()}
                    <span class="material-icons">info</span>
                </p>
                <span id="password_strength_value" class="password_strength_value">{strengthValue}</span>
                <PasswordStrength onstrengthChange={onStrengthChange} password={password ?? ''} />
            </div>

            <button out:slide={{ duration: 700, axis: 'y' }} class="form_area_msg_only" onclick={(e) => loadArticle(e, page.url, $locale, 'login/')} type="button">
                <span class="material-icons-outlined">chevron_right</span>
                {$LL.register['haveAccount']()}
            </button>
        {:else if stage === 2}
            <div in:slide={{ duration: 800, delay: 800, axis: 'y' }} class="form_area_item textbox">
                <p>{@html $LL.register['stage2Text']()}</p>
            </div>
        {:else if stage === 3}
            <div out:slide={{ duration: 800, axis: 'y' }} class="form_area_item textbox">
                {@html $LL.register['stage1_1Text']({ min: 5 })}
            </div>
        {:else if stage === 4}
            <div in:slide={{ duration: 800, delay: 800, axis: 'y' }} out:slide={{ duration: 800, axis: 'y' }} class="form_area_item">
                <label for="verification_code" class="part_label">{$LL.resetPassword['stage2Text']()}</label>
                <input class="part_input" class:error_input={form?.errorCode} id="verification_code" name="verification_code" type="text" autocomplete="off" />
            </div>
        {:else if stage === 5}
            <div in:slide={{ duration: 800, delay: 800, axis: 'y' }} class="form_area_item textbox">
                <p>{@html $LL.register['doneRegister']()}</p>
            </div>
        {/if}

        <Turnstile siteKey={PUBLIC_TURNSTILE_SITE_KEY} />

        {#if stage !== 5}
            <button out:fade={{ delay: 400 }} id="btn" class={postOauth ? 'blue_btn loading_btn disabled_elm' : 'blue_btn'} type="submit">
                {#if submitting || warning}
                    <span in:fade class="loading"></span>
                {:else if stage === 1}
                    <span in:fade={{ delay: 100 }} class="btn_icon material-icons">app_registration</span>
                    <span in:fade={{ delay: 100 }} class="btn_text">{$LL.register['stage1Btn']()}</span>
                {:else if stage === 2}
                    <span in:fade={{ delay: 400 }} class="btn_icon material-icons">double_arrow</span>
                    <span in:fade={{ delay: 400 }} class="btn_text">{$LL.register['stage2Btn']()}</span>
                {:else if stage === 3}
                    <span class="btn_icon material-icons">check</span>
                    <span class="btn_text">{$LL.resetPassword['stage1Btn']()}</span>
                {:else if stage === 4}
                    <span in:fade={{ delay: 400 }} class="btn_icon material-icons">login</span>
                    <span in:fade={{ delay: 400 }} class="btn_text">{$LL.resetPassword['stage2Btn']()}</span>
                {/if}
            </button>
        {/if}
    </form>
</main>

<svelte:head>
    <meta name="robots" content="noindex,nofollow,noarchive" />
    <title>{$LL.register['metaTitle']()} | {$LL.serverTitle()}</title>
    <meta name="description" content={$LL.register['metaDesc']()} />
    <meta property="og:title" content="{$LL.register['metaTitle']()} | {$LL.serverTitle()}" />
    <meta property="og:description" content={$LL.register['metaDesc']()} />
</svelte:head>
