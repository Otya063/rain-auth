<script lang="ts">
    import type { ActionData, PageData } from './$types';
    import { applyAction, enhance } from '$app/forms';
    import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
    import LL from '$i18n/i18n-svelte';
    import { linkCharsData, switchBtnInAuth } from '$lib/utils/client';
    import { onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { Turnstile } from 'svelte-turnstile';

    let { data, form }: { data: PageData; form: ActionData } = $props();

    let stage = $state(1);
    let submitting = $state(false);
    let unauthOps = $state(false); // 不正操作用フラグ
    let warning = $state(true);

    onMount(() => {
        // キャプチャ待機用
        const btnElm = document.getElementById('btn');
        setTimeout(() => {
            warning = false;
            switchBtnInAuth(true, btnElm);
        }, 3000);
    });
</script>

<main class="main_inner" class:auth_notice={stage === 1} class:auth_verify={stage === 2} class:link_discord_done_stage3={stage === 3} class:switch_character_done_stage4={stage === 4}>
    <h1>{$LL.switchCharacter['title']()}</h1>

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
        action="?/switchCharacter"
        method="POST"
        class="form_area"
        use:enhance={() => {
            // 送信ボタンクリック時
            const btnElm = document.getElementById('btn');
            const labelElm = document.getElementsByClassName('part_label');
            const inputElm = document.querySelectorAll('.part_input, .wrap_part_input');
            switchBtnInAuth(false, btnElm, labelElm, inputElm);
            submitting = true;

            return async ({ result }) => {
                await applyAction(result);

                if (stage === form?.currentStage) {
                    // 成功
                    if (form.nextStage === 3) linkCharsData.set(form.characterData);
                    if (form.nextStage !== 4) switchBtnInAuth(true, btnElm, labelElm, inputElm);
                    stage = form.nextStage;
                    unauthOps = false;
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
            <div out:slide={{ duration: 800, axis: 'y' }} class="form_area_item textbox">
                {@html $LL.register['stage1_1Text']({ min: 10 })}
            </div>
        {:else if stage === 2}
            <div in:slide={{ duration: 800, delay: 800, axis: 'y' }} out:slide={{ duration: 800, axis: 'y' }} class="form_area_item">
                <label for="verification_code" class="part_label">{$LL.resetPassword['stage2Text']()}</label>
                <input class="part_input" class:error_input={form?.errorCode} id="verification_code" name="verification_code" type="text" autocomplete="off" />
            </div>
        {:else if stage === 3}
            <div in:slide={{ duration: 800, delay: 800, axis: 'y' }} class="form_area_item">
                <span class="part_label">{$LL.linkDiscord['discordUserIDLabel']()}</span>
                <p class="part_input_fixed">{data.discordId}</p>

                <span class="part_label">{$LL.linkDiscord['discordUsernameLabel']()}</span>
                <p class="part_input_fixed">{data.discordUsername}</p>

                <span class="part_label">{$LL.switchCharacter['currentLinkedLabel']()}</span>
                <p class="part_input_fixed">
                    {data.currentLinkedCharacterData.name} [{$LL.linkDiscord['opitonText'][0]()}{data.currentLinkedCharacterData.hr}／{$LL.linkDiscord['opitonText'][1]()}{data
                        .currentLinkedCharacterData.gr}／{$LL.linkDiscord['opitonText'][2]()}{data.currentLinkedCharacterData.weapon}]
                </p>

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
        {:else if stage === 4}
            <div in:slide={{ duration: 800, delay: 800, axis: 'y' }} class="form_area_item textbox">
                <p>{@html $LL.switchCharacter['doneSwitchChar']()}</p>
            </div>
        {/if}

        <Turnstile siteKey={PUBLIC_TURNSTILE_SITE_KEY} />

        {#if stage !== 4}
            <button out:fade={{ delay: 400 }} id="btn" class="blue_btn loading_btn disabled_elm" type="submit">
                {#if submitting || warning}
                    <span in:fade class="loading"></span>
                {:else if stage === 1}
                    <span class="btn_icon material-icons">check</span>
                    <span class="btn_text">{$LL.resetPassword['stage1Btn']()}</span>
                {:else if stage === 2}
                    <span in:fade={{ delay: 400 }} class="btn_icon material-icons">login</span>
                    <span in:fade={{ delay: 400 }} class="btn_text">{$LL.resetPassword['stage2Btn']()}</span>
                {:else if stage === 3}
                    <span in:fade={{ delay: 400 }} class="btn_icon material-icons">link</span>
                    <span in:fade={{ delay: 400 }} class="btn_text">{$LL.linkDiscord['buttonLabel']()}</span>
                {/if}
            </button>
        {/if}
    </form>
</main>

<svelte:head>
    <title>{$LL.switchCharacter['metaTitle']()} | {$LL.serverTitle()}</title>
    <meta name="description" content={$LL.switchCharacter['metaDesc']()} />
    <meta property="og:title" content="{$LL.switchCharacter['title']()} | {$LL.serverTitle()}" />
    <meta property="og:description" content={$LL.switchCharacter['metaDesc']()} />
</svelte:head>
