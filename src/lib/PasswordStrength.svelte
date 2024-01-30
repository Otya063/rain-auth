<script lang="ts">
    import LL from '$i18n/i18n-svelte';
    import { showTip } from '$lib/utils';
    import checkPasswordStrength from 'check-password-strength';
    import type { Options } from 'check-password-strength';
    import { createEventDispatcher } from 'svelte';
    import { get } from 'svelte/store';
    import { fade, slide } from 'svelte/transition';

    export let password: string;
    const dispatch = createEventDispatcher<{ strengthChange: string }>();
    const checkOptions: Options<string> = [
        {
            id: 0,
            value: get(LL).register['passwordStrength'][0](),
            minDiversity: 0,
            minLength: 0,
        },
        {
            id: 1,
            value: get(LL).register['passwordStrength'][1](),
            minDiversity: 2,
            minLength: 6,
        },
        {
            id: 2,
            value: get(LL).register['passwordStrength'][2](),
            minDiversity: 3,
            minLength: 8,
        },
        {
            id: 3,
            value: get(LL).register['passwordStrength'][3](),
            minDiversity: 4,
            minLength: 10,
        },
    ];
    $: strength = checkPasswordStrength.passwordStrength(password, checkOptions);
    $: {
        dispatch('strengthChange', strength.value);
    }
    const symbol: string = '!@#$%^&*()_+{}[]:;<>,.?~/-';
    $: count = password !== undefined ? password.length : 0;
</script>

<div class="color_indicators">
    {#if password !== undefined}
        <span class="color_indicators_bar" transition:slide={{ axis: 'x', duration: 700 }}></span>
    {/if}

    {#if strength.id >= 1}
        <span class="color_indicators_bar" transition:slide={{ axis: 'x', duration: 700 }}></span>
    {/if}

    {#if strength.id >= 2}
        <span class="color_indicators_bar" transition:slide={{ axis: 'x', duration: 700 }}></span>
    {/if}

    {#if strength.id >= 3}
        <span class="color_indicators_bar" transition:slide={{ axis: 'x', duration: 700 }}></span>
    {/if}

    {#if $showTip}
        <ul transition:fade={{ duration: 200 }} id="strength_list" class="strength_list">
            <p>{$LL.register['passwordStrengthList'][0]()}</p>

            <li class="strength_list_item" class:valid={password !== undefined && count >= 10 && count <= 32}>
                {#if password !== undefined && count >= 10 && count <= 32}
                    <span class="material-icons">check</span>
                {:else}
                    <span class="material-icons">dangerous</span>
                {/if}
                <span>{$LL.register['passwordStrengthList'][1]()}</span>
            </li>
            <li class="strength_list_item" class:valid={strength.contains.includes('lowercase') && strength.contains.includes('uppercase')}>
                {#if strength.contains.includes('lowercase') && strength.contains.includes('uppercase')}
                    <span class="material-icons">check</span>
                {:else}
                    <span class="material-icons">dangerous</span>
                {/if}
                <span>{$LL.register['passwordStrengthList'][2]()}</span>
            </li>
            <li class="strength_list_item" class:valid={strength.contains.includes('number')}>
                {#if strength.contains.includes('number')}
                    <span class="material-icons">check</span>
                {:else}
                    <span class="material-icons">dangerous</span>
                {/if}
                <span>{$LL.register['passwordStrengthList'][3]()}</span>
            </li>
            <li class="strength_list_item" class:valid={strength.contains.includes('symbol')}>
                {#if strength.contains.includes('symbol')}
                    <span class="material-icons">check</span>
                {:else}
                    <span class="material-icons">dangerous</span>
                {/if}
                <span>{$LL.register['passwordStrengthList'][4]({ symbol })}</span>
            </li>
        </ul>
    {/if}
</div>
