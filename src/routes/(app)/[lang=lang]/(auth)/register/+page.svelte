<script lang="ts">
    import type { ActionData, PageData } from './$types';
    import { applyAction, enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { PUBLIC_AUTH_DOMAIN, PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
    import LL, { locale } from '$i18n/i18n-svelte';
    import { showTip, toggleHidePass, disableHidePass, switchBtnInAuth, loadArticle } from '$lib/utils';
    import PasswordStrength from '$lib/PasswordStrength.svelte';
    import { fade, slide } from 'svelte/transition';
    import { Turnstile } from 'svelte-turnstile';

    export let data: PageData;
    export let form: ActionData;
    let stage = 1;
    let btnStage = 1;
    let unauthOps = false; // for an unauthorized operation
    let password: string;
    let strengthValue: string | null = '';

    const onStrengthChange = (event: CustomEvent<string>) => {
        strengthValue = event.detail;
    };
</script>

<main class="main_inner" class:register_stage1={stage === 1} class:register_stage2={stage === 2}>
    <h1>{$LL.register['title']()}</h1>

    {#if form?.error || unauthOps}
        <div transition:fade={{ delay: 200 }} class="err_display">
            <span class="material-icons">error</span>

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
                {:else if form?.unauthOps}
                    {$LL.error['unauthOps']()}
                {:else if form?.errorCaptcha}
                    {form?.errorCaptchaMsg}
                {:else}
                    {$LL.error['unauthOps']()}
                {/if}
            </span>
        </div>
    {/if}

    <form
        class="form_area"
        action="?/prepRegister"
        method="POST"
        use:enhance={() => {
            // when clicking submit button
            const currentBtnStage = btnStage;
            const btnElm = document.getElementById('btn');
            const labelElm = document.getElementsByClassName('part_label');
            const inputElm = document.querySelectorAll('.wrap_part_input');
            switchBtnInAuth(false, btnElm, labelElm, inputElm);
            btnStage = 0;

            return async ({ result }) => {
                await applyAction(result);

                if (stage === form?.currentStage) {
                    // success
                    const hidePass = document.getElementsByClassName('hide_password');
                    const strengthValueElm = document.getElementById('password_strength_value');
                    disableHidePass(hidePass);
                    unauthOps = false;

                    form?.currentStage === 2
                        ? goto(`${PUBLIC_AUTH_DOMAIN}/${data.locale}/login/?type=register`)
                        : (switchBtnInAuth(true, btnElm, labelElm, inputElm), (stage = form?.nextStage), (btnStage = form?.nextStage), strengthValueElm && (strengthValueElm.innerHTML = ''));
                } else if (result.type === 'failure') {
                    // failure
                    switchBtnInAuth(true, btnElm, labelElm, inputElm);
                    btnStage = currentBtnStage;
                    unauthOps = false;
                } else {
                    // unauthorized operation
                    switchBtnInAuth(true, btnElm, labelElm, inputElm);
                    btnStage = currentBtnStage;
                    unauthOps = true;
                }
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
                    <button id="password_btn" class="hide_password material-icons" type="button" on:click={(e) => toggleHidePass(e)}>visibility_off</button>
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
                    <button id="conf_password_btn" class="hide_password material-icons" type="button" on:click={(e) => toggleHidePass(e)}>visibility_off</button>
                </div>

                <p
                    class="part_label_no_input"
                    on:mouseenter={() => {
                        showTip.update((boolean) => (boolean = true));
                    }}
                    on:mouseleave={() => {
                        showTip.update((boolean) => (boolean = false));
                    }}
                >
                    {$LL.register['stage1Text'][3]()}
                    <span class="material-icons">info</span>
                </p>
                <span id="password_strength_value" class="password_strength_value">{strengthValue}</span>
                <PasswordStrength on:strengthChange={onStrengthChange} {password} />
            </div>

            <button out:slide={{ duration: 700, axis: 'y' }} class="form_area_msg_only" on:click={(e) => loadArticle(e, $page.url, $locale, 'login/')} type="button"
                >{$LL.register['haveAccount']()}</button
            >
        {:else if stage === 2}
            <div in:slide={{ duration: 800, delay: 800, axis: 'y' }} class="form_area_item textbox">
                <p>{@html $LL.register['stage2Text']()}</p>
            </div>
        {/if}

        <Turnstile siteKey={PUBLIC_TURNSTILE_SITE_KEY} />

        <button id="btn" class="blue_btn" type="submit">
            {#if btnStage === 0}
                <span in:fade class="loading"></span>
            {:else if btnStage === 1}
                <span in:fade={{ delay: 100 }} class="btn_icon material-icons">app_registration</span>
                <span in:fade={{ delay: 100 }} class="btn_text">{$LL.register['stage1Btn']()}</span>
            {:else if btnStage === 2}
                <span in:fade={{ delay: 400 }} class="btn_icon material-icons">double_arrow</span>
                <span in:fade={{ delay: 400 }} class="btn_text">{$LL.register['stage2Btn']()}</span>
            {/if}
        </button>
    </form>
</main>

<svelte:head>
    <title>{$LL.register['metaTitle']()} | {$LL.serverTitle()}</title>
    <meta name="description" content={$LL.register['metaDesc']()} />
    <meta property="og:title" content="{$LL.register['metaTitle']()} | {$LL.serverTitle()}" />
    <meta property="og:description" content={$LL.register['metaDesc']()} />
</svelte:head>
