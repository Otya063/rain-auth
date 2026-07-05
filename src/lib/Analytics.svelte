<script module lang="ts">
    declare function gtag(command: string, ...args: unknown[]): void;
</script>

<script lang="ts">
    import { page } from '$app/state';

    $effect(() => {
        if (typeof gtag !== 'undefined') {
            gtag('config', 'G-VZ70964E0G', {
                page_title: document.title,
                page_path: page.url.pathname,
            });
        }
    });
</script>

<svelte:head>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-VZ70964E0G"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() {
            dataLayer.push(arguments);
        }
        gtag('js', new Date());

        gtag('config', 'G-VZ70964E0G');
    </script>
</svelte:head>
