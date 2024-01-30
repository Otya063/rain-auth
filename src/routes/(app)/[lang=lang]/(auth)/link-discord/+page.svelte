<script lang="ts">
    import type { ActionData, PageData } from './$types';
    import { applyAction, enhance } from '$app/forms';
    import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
    import LL from '$i18n/i18n-svelte';
    import { linkCharsData, switchBtnInAuth, toggleHidePass } from '$lib/utils';
    import { onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { Turnstile } from 'svelte-turnstile';

    export let data: PageData;
    export let form: ActionData;
    const { discordId, discordUsername } = data;
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

<main
    class="main_inner"
    class:auth_notice={stage === 1}
    class:auth_verify={stage === 2}
    class:link_discord_done_stage3={stage === 3}
    class:link_discord_done_stage4={stage === 4}
    class:link_discord_done_stage5={stage === 5}
>
    <h1>{$LL.linkDiscord['title']()}</h1>

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
                {:else if form?.invalidUsername}
                    {$LL.register['invUsername']()}
                {:else if form?.invalidPassword}
                    {$LL.register['invPassword']()}
                {:else if form?.noUser}
                    {$LL.login['noUser']()}
                {:else if form?.incPassword}
                    {$LL.login['incPassword']()}
                {:else if form?.userLinked}
                    {$LL.linkDiscord['userLinked']()}
                {:else if form?.existLinkedChar}
                    {$LL.linkDiscord['existLinkedChar']()}
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
        action="?/linkDiscord"
        method="POST"
        class="form_area"
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
                    form?.nextStage === 4 && linkCharsData.set(form?.characterData);
                    form?.nextStage !== 5 && switchBtnInAuth(true, btnElm, labelElm, inputElm);
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
                <span class="part_label">{$LL.linkDiscord['discordUserIDLabel']()}</span>
                <p class="part_input_fixed">{discordId}</p>

                <span class="part_label">{$LL.linkDiscord['discordUsernameLabel']()}</span>
                <p class="part_input_fixed">{discordUsername}</p>

                <label for="username" class="part_label">{$LL.login['usernameLabel']()}</label>
                <div class="wrap_part_input">
                    <input class="part_input" class:error_input={form?.errorUsername} id="username" name="username" type="text" autocomplete="off" />
                </div>

                <label for="password" class="part_label">{$LL.login['passwordLabel']()}</label>
                <div class="wrap_part_input">
                    <input class="part_input" class:error_input={form?.errorPassword} id="password" name="password" type="password" autocomplete="off" />
                    <button id="password_btn" class="hide_password material-icons" type="button" on:click={(e) => toggleHidePass(e)}>visibility_off</button>
                </div>
            </div>
        {:else if stage === 4}
            <div in:slide={{ duration: 800, delay: 800, axis: 'y' }} out:slide={{ duration: 800, axis: 'y' }} class="form_area_item">
                <label for="character_data" class="part_label">{$LL.linkDiscord['characterName']()}</label>
                <select name="character_data" id="character_data" class="part_input">
                    {#each $linkCharsData as linkCharData}
                        <option value="{linkCharData.id}-{linkCharData.name}-{$LL.linkDiscord['opitonText'][0]()}{linkCharData.hr}／{$LL.linkDiscord['opitonText'][1]()}{linkCharData.gr}"
                            >{linkCharData.name} [{$LL.linkDiscord['opitonText'][0]()}{linkCharData.hr}／{$LL.linkDiscord['opitonText'][1]()}{linkCharData.gr}／{$LL.linkDiscord[
                                'opitonText'
                            ][2]()}{linkCharData.weapon}]</option
                        >
                    {/each}
                </select>
            </div>
        {:else if stage === 5}
            <div in:slide={{ duration: 800, delay: 800, axis: 'y' }} class="form_area_item textbox">
                <p>{@html $LL.linkDiscord['doneLinkDiscord']()}</p>

                <div class="box_group" in:fade={{ duration: 800, delay: 1600 }}>
                    <div class="box">
                        <h2 class="box_title">{$LL.linkDiscord['discordLabel']()}</h2>
                        <div class="box_body">
                            <img
                                src={!form?.discordAvatar
                                    ? 'https://cdn.discordapp.com/embed/avatars/0.png'
                                    : `https://cdn.discordapp.com/avatars/${discordId}/${form?.discordAvatar}.png?size=512`}
                                alt="discord_avatar"
                            />
                            <p>{form?.discordUsername}</p>
                        </div>
                    </div>

                    <svg class="link_icon link_icon1" xmlns="http://www.w3.org/2000/svg" width="76" height="76" viewBox="0 0 30 30"
                        ><path
                            style="transform: translate(2px, 2px);"
                            d="M6.188 8.719c.439-.439.926-.801 1.444-1.087 2.887-1.591 6.589-.745 8.445 2.069l-2.246 2.245c-.644-1.469-2.243-2.305-3.834-1.949-.599.134-1.168.433-1.633.898l-4.304 4.306c-1.307 1.307-1.307 3.433 0 4.74 1.307 1.307 3.433 1.307 4.74 0l1.327-1.327c1.207.479 2.501.67 3.779.575l-2.929 2.929c-2.511 2.511-6.582 2.511-9.093 0s-2.511-6.582 0-9.093l4.304-4.306zm6.836-6.836l-2.929 2.929c1.277-.096 2.572.096 3.779.574l1.326-1.326c1.307-1.307 3.433-1.307 4.74 0 1.307 1.307 1.307 3.433 0 4.74l-4.305 4.305c-1.311 1.311-3.44 1.3-4.74 0-.303-.303-.564-.68-.727-1.051l-2.246 2.245c.236.358.481.667.796.982.812.812 1.846 1.417 3.036 1.704 1.542.371 3.194.166 4.613-.617.518-.286 1.005-.648 1.444-1.087l4.304-4.305c2.512-2.511 2.512-6.582.001-9.093-2.511-2.51-6.581-2.51-9.092 0z"
                        /></svg
                    >

                    <svg class="link_icon link_icon2" xmlns="http://www.w3.org/2000/svg" width="76" height="76" viewBox="0 0 30 30"
                        ><path
                            style="transform: translate(2px, 2px);"
                            d="M6.188 8.719c.439-.439.926-.801 1.444-1.087 2.887-1.591 6.589-.745 8.445 2.069l-2.246 2.245c-.644-1.469-2.243-2.305-3.834-1.949-.599.134-1.168.433-1.633.898l-4.304 4.306c-1.307 1.307-1.307 3.433 0 4.74 1.307 1.307 3.433 1.307 4.74 0l1.327-1.327c1.207.479 2.501.67 3.779.575l-2.929 2.929c-2.511 2.511-6.582 2.511-9.093 0s-2.511-6.582 0-9.093l4.304-4.306zm6.836-6.836l-2.929 2.929c1.277-.096 2.572.096 3.779.574l1.326-1.326c1.307-1.307 3.433-1.307 4.74 0 1.307 1.307 1.307 3.433 0 4.74l-4.305 4.305c-1.311 1.311-3.44 1.3-4.74 0-.303-.303-.564-.68-.727-1.051l-2.246 2.245c.236.358.481.667.796.982.812.812 1.846 1.417 3.036 1.704 1.542.371 3.194.166 4.613-.617.518-.286 1.005-.648 1.444-1.087l4.304-4.305c2.512-2.511 2.512-6.582.001-9.093-2.511-2.51-6.581-2.51-9.092 0z"
                        /></svg
                    >

                    <div class="box">
                        <h2 class="box_title">{$LL.linkDiscord['frontierLabel']()}</h2>
                        <div class="box_body">
                            <img src="/icon-512.png" alt="rain_logo_512" />
                            <p>{form?.selectedCharName} [{form?.selectedCharInfo}]</p>
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        <Turnstile siteKey={PUBLIC_TURNSTILE_SITE_KEY} />

        {#if btnStage !== 5}
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
                    <span in:fade={{ delay: 400 }} class="btn_icon material-icons">navigate_next</span>
                    <span in:fade={{ delay: 400 }} class="btn_text">{$LL.linkDiscord['stage3Btn']()}</span>
                {:else if btnStage === 4}
                    <span in:fade={{ delay: 400 }} class="btn_icon material-icons">link</span>
                    <span in:fade={{ delay: 400 }} class="btn_text">{$LL.linkDiscord['buttonLabel']()}</span>
                {/if}
            </button>
        {/if}
    </form>
</main>

<svelte:head>
    <title>{$LL.linkDiscord['metaTitle']()} | {$LL.serverTitle()}</title>
    <meta name="description" content={$LL.linkDiscord['metaDesc']()} />
    <meta property="og:title" content="{$LL.linkDiscord['title']()} | {$LL.serverTitle()}" />
    <meta property="og:description" content={$LL.linkDiscord['metaDesc']()} />
</svelte:head>
