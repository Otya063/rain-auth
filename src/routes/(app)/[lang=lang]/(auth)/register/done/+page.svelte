<script lang="ts">
    import type { ActionData } from '../$types';
    import { applyAction, enhance } from '$app/forms';
    import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
    import LL from '$i18n/i18n-svelte';
    import { switchBtnInAuth } from '$lib/utils';
    import { onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { Turnstile } from 'svelte-turnstile';

    export let form: ActionData;
    let stage = 1;
    let btnStage = 0;
    let unauthOps = false; // for an unauthorized operation
    let warning = true;

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

<main class="main_inner" class:auth_notice={stage === 1} class:auth_verify={stage === 2} class:register_done_stage3={stage === 3}>
    <h1>{$LL.register['title']()}</h1>

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
        class="form_area"
        action="?/register"
        method="POST"
        use:enhance={() => {
            // when clicking submit button
            const currentBtnStage = btnStage;
            const btnElm = document.getElementById('btn');
            const labelElm = document.getElementsByClassName('part_label');
            const inputElm = document.querySelectorAll('.part_input');
            switchBtnInAuth(false, btnElm, labelElm, inputElm);
            btnStage = 0;

            return async ({ result }) => {
                await applyAction(result);

                if (stage === form?.currentStage) {
                    // success
                    form?.nextStage !== 3 && switchBtnInAuth(true, btnElm, labelElm, inputElm);
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
                {@html $LL.register['stage1_1Text']({ min: 5 })}
            </div>
        {:else if stage === 2}
            <div in:slide={{ duration: 800, delay: 800, axis: 'y' }} out:slide={{ duration: 800, axis: 'y' }} class="form_area_item">
                <label for="verification_code" class="part_label">{$LL.resetPassword['stage2Text']()}</label>
                <input class="part_input" class:error_input={form?.errorCode} id="verification_code" name="verification_code" type="text" autocomplete="off" />
            </div>
        {:else if stage === 3}
            <div in:slide={{ duration: 800, delay: 800, axis: 'y' }} class="form_area_item textbox">
                <p>{@html $LL.register['doneRegister']()}</p>
            </div>
        {/if}

        <Turnstile siteKey={PUBLIC_TURNSTILE_SITE_KEY} />

        {#if btnStage !== 3}
            <button out:fade={{ delay: 400 }} id="btn" class="blue_btn loading_btn disabled_elm" type="submit">
                {#if btnStage === 0}
                    <span in:fade class="loading"></span>
                {:else if btnStage === 1}
                    <span class="btn_icon material-icons">check</span>
                    <span class="btn_text">{$LL.resetPassword['stage1Btn']()}</span>
                {:else if btnStage === 2}
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
