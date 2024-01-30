<script lang="ts">
    import LL from '$i18n/i18n-svelte';
</script>

<footer>
    <section class="footer_inner">
        <img class="footer_logo" src="/img/common/rain_textlogo.webp" alt="rain_textlogo" />
        <p class="footer_text">
            {@html $LL.footerText()}
            <br />
            {@html $LL.captchaText()}
        </p>
    </section>
</footer>
