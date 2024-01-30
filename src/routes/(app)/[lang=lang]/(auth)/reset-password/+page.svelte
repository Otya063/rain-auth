<script lang="ts">
    import type { ActionData, PageData } from './$types';
    import { applyAction, enhance } from '$app/forms';
    import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
    import LL from '$i18n/i18n-svelte';
    import { showTip, switchBtnInAuth, toggleHidePass } from '$lib/utils';
    import PasswordStrength from '$lib/PasswordStrength.svelte';
    import { onMount } from 'svelte';
    import { slide, fade } from 'svelte/transition';
    import { Turnstile } from 'svelte-turnstile';

    export let data: PageData;
    export let form: ActionData;
    const { username } = data;
    let stage = 1;
    let btnStage = 0;
    let unauthOps = false; // for an unauthorized operation
    let password: string;
    let strengthValue: string | null = '';
    let warning = true;

    const onStrengthChange = (event: CustomEvent<string>) => {
        strengthValue = event.detail;
    };

    onMount(() => {
        // for waiting captcha
        const btnElm = document.getElementById('btn');

        setTimeout(() => {
            warning = false;
            switchBtnInAuth(true, btnElm);
            btnStage = 1;
        }, 3000);
    });
</script>

<main class="main_inner" class:auth_notice={stage === 1} class:auth_verify={stage === 2} class:reset_password_stage3={stage === 3} class:reset_password_stage4={stage === 4}>
    <h1>{$LL.resetPassword['title']()}</h1>

    {#if form?.error || unauthOps || warning}
        <div transition:fade={{ delay: 200 }} class="err_display" class:warning>
            <span class="material-icons">
                {#if form?.error}
                    error
                {:else if warning}
                    warning
                {/if}
            </span>

            <span class="err_text">
                {#if form?.codeNotMatch}
                    {$LL.resetPassword['codeNotMatch']()}
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
                {:else if warning}
                    {$LL.login['captchaInProg']()}
                {:else}
                    {$LL.error['unauthOps']()}
                {/if}
            </span>
        </div>
    {/if}

    <form
        action="?/resetPassword"
        class="form_area"
        method="POST"
        use:enhance={() => {
            // when clicking submit button
            const currentBtnStage = btnStage;
            const btnElm = document.getElementById('btn');
            const labelElm = document.getElementsByClassName('part_label');
            const inputElm = document.querySelectorAll('.part_input, .wrap_part_input');
            switchBtnInAuth(false, btnElm, labelElm, inputElm);
            btnStage = 0;

            return async ({ result }) => {
                await applyAction(result);

                if (stage === form?.currentStage) {
                    // success
                    form?.nextStage === 4 && document.getElementById('password_strength_value')?.remove();
                    form?.nextStage !== 4 && switchBtnInAuth(true, btnElm, labelElm, inputElm);
                    stage = form?.nextStage;
                    btnStage = form?.nextStage;
                    unauthOps = false;
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
            <div out:slide={{ duration: 800, axis: 'y' }} class="form_area_item textbox">
                {@html $LL.register['stage1_1Text']({ min: 10 })}
            </div>
        {:else if stage === 2}
            <div in:slide={{ duration: 800, delay: 800, axis: 'y' }} out:slide={{ duration: 800, axis: 'y' }} class="form_area_item">
                <label for="verification_code" class="part_label">{$LL.resetPassword['stage2Text']()}</label>
                <input class="part_input" class:error_input={form?.errorCode} id="verification_code" name="verification_code" type="text" autocomplete="off" />
            </div>
        {:else if stage === 3}
            <div in:slide={{ duration: 800, delay: 800, axis: 'y' }} out:slide={{ duration: 800, axis: 'y' }} class="form_area_item">
                <span class="part_label">{$LL.resetPassword['stage3Text'][0]()}</span>
                <p class="part_input_fixed">{username}</p>

                <label for="password" class="part_label">{@html $LL.resetPassword['stage3Text'][1]()}</label>
                <div class="wrap_part_input">
                    <input class="part_input" class:error_input={form?.errorPassword} id="password" name="password" type="password" autocomplete="off" bind:value={password} />
                    <button id="password_btn" class="hide_password material-icons" type="button" on:click={(e) => toggleHidePass(e)}>visibility_off</button>
                </div>

                <label for="conf_password" class="part_label">{$LL.resetPassword['stage3Text'][2]()}</label>
                <div class="wrap_part_input">
                    <input class="part_input" class:error_input={form?.errorPassword} id="conf_password" name="conf_password" type="password" autocomplete="off" />
                    <button id="password_btn" class="hide_password material-icons" type="button" on:click={(e) => toggleHidePass(e)}>visibility_off</button>
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
        {:else if stage === 4}
            <div in:slide={{ duration: 800, delay: 800, axis: 'y' }} class="form_area_item textbox">
                <p>{@html $LL.resetPassword['doneReset']()}</p>
            </div>
        {/if}

        <Turnstile siteKey={PUBLIC_TURNSTILE_SITE_KEY} />

        {#if btnStage !== 4}
            <button out:fade={{ delay: 400 }} id="btn" class="blue_btn loading_btn disabled_elm" type="submit">
                {#if btnStage === 0}
                    <span in:fade class="loading"></span>
                {:else if btnStage === 1}
                    <span class="btn_icon material-icons">check</span>
                    <span class="btn_text">{$LL.resetPassword['stage1Btn']()}</span>
                {:else if btnStage === 2}
                    <span in:fade={{ delay: 400 }} class="btn_icon material-icons">login</span>
                    <span in:fade={{ delay: 400 }} class="btn_text">{$LL.resetPassword['stage2Btn']()}</span>
                {:else if btnStage === 3}
                    <span in:fade={{ delay: 400 }} class="btn_icon material-icons">restart_alt</span>
                    <span in:fade={{ delay: 400 }} class="btn_text">{$LL.resetPassword['stage3Btn']()}</span>
                {/if}
            </button>
        {/if}
    </form>
</main>

<svelte:head>
    <title>{$LL.resetPassword['metaTitle']()} | {$LL.serverTitle()}</title>
    <meta name="description" content={$LL.resetPassword['metaDesc']()} />
    <meta property="og:title" content="{$LL.resetPassword['title']()} | {$LL.serverTitle()}" />
    <meta property="og:description" content={$LL.resetPassword['metaDesc']()} />
</svelte:head>
