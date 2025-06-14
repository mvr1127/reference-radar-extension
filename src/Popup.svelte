<script lang="ts">
  import { onMount } from 'svelte';

  let iframeUrl = '';
  let authStatus: 'checking' | 'loggedIn' | 'loggedOut' = 'checking';
  let errorMessage = '';

  const loginUrl = 'https://reference-radar.vercel.app/login'; // Define login URL

  onMount(() => {
    chrome.runtime.sendMessage({ type: 'AUTH_CHECK' }, (response) => {
      if (chrome.runtime.lastError) {
        // Handle errors from chrome.runtime.sendMessage itself
        console.error('Error sending message to background:', chrome.runtime.lastError.message);
        errorMessage = 'Error checking authentication status. Please try again.';
        authStatus = 'loggedOut'; // Or a specific error state
        return;
      }

      if (response) {
        if (response.loggedIn) {
          authStatus = 'loggedIn';
          // Construct iframe URL only if logged in
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                console.error('Error querying tabs:', chrome.runtime.lastError.message);
                errorMessage = 'Could not get current tab information.';
                authStatus = 'loggedOut'; // Or handle error appropriately
                return;
            }
            const currentTab = tabs[0];
            if (currentTab) {
              const url = encodeURIComponent(currentTab.url || '');
              const title = encodeURIComponent(currentTab.title || '');
              iframeUrl = `https://reference-radar.vercel.app/create-reference?embed=true&url=${url}&title=${title}`;
            } else {
                errorMessage = 'Could not get current tab information.';
                authStatus = 'loggedOut'; // Or handle error appropriately
            }
          });
        } else {
          authStatus = 'loggedOut';
          if (response.error) {
            errorMessage = `Authentication check failed: ${response.error}`;
          } else {
            errorMessage = 'You are not logged in to Reference Radar.';
          }
        }
      } else {
        // No response, which can happen if background script has an issue
        // or doesn't call sendResponse
        errorMessage = 'No response from authentication check.';
        authStatus = 'loggedOut';
      }
    });

    // Keep existing message listener for when reference is added
    window.addEventListener('message', (event) => {
      if (event.data === 'reference-added') {
        window.close();
      }
    });
  });
</script>

<main class="w-[22rem] h-[34rem] overflow-hidden">
  {#if authStatus === 'checking'}
    <p class="p-4 text-sm">Checking authentication status...</p>
  {:else if authStatus === 'loggedIn'}
    {#if iframeUrl}
      <iframe
        src={iframeUrl}
        class="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    {:else}
      <p class="p-4 text-sm">Loading Reference Radar...</p>
      <!-- This state could occur briefly if tabs.query is slow or errors -->
      {#if errorMessage}
        <p class="p-4 text-sm text-red-600">{errorMessage}</p>
      {/if}
    {/if}
  {:else if authStatus === 'loggedOut'}
    <div class="p-4 text-sm">
      <p>{errorMessage || 'Please log in to Reference Radar to save references.'}</p>
      <a
        href={loginUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="mt-2 inline-block px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded"
      >
        Go to Login
      </a>
    </div>
  {/if}
</main>

<style>
  /* Add some basic styling for the link/button if not using Tailwind or similar */
  .button-link {
    display: inline-block;
    padding: 8px 12px;
    margin-top: 10px;
    color: white;
    background-color: #007bff;
    text-decoration: none;
    border-radius: 4px;
    text-align: center;
  }
  .button-link:hover {
    background-color: #0056b3;
  }
  .text-red-600 { /* Simple error color if not using Tailwind */
    color: #dc2626;
  }
</style>
