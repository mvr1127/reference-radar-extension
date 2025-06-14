<script lang="ts">
  let iframeUrl = "https://example.com";
</script>

<main style="width: 22rem; height: 34rem; overflow: hidden;">
  <iframe
    src={iframeUrl}
    class="w-full h-full border-0"
    sandbox="allow-scripts allow-same-origin allow-forms"
  />
</main>
