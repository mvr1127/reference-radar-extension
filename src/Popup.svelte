<script lang="ts">
  import { onMount } from 'svelte';
  let iframeUrl = '';

  onMount(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = encodeURIComponent(tabs[0]?.url || '');
      const title = encodeURIComponent(tabs[0]?.title || '');

      // 👇 Replace with your live SvelteKit route
      iframeUrl = `https://reference-radar.vercel.app/create-reference?embed=true&url=${url}&title=${title}`;
    });

    window.addEventListener('message', (event) => {
      if (event.data === 'reference-added') {
        window.close();
      }
    });
  });
</script>

<main class="w-[22rem] h-[34rem] overflow-hidden">
  {#if iframeUrl}
    <iframe
      src={iframeUrl}
      class="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  {:else}
    <p class="p-4 text-sm">Loading…</p>
  {/if}
</main>
