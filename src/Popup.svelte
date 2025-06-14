<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let iframeUrl = '';
  let loggedIn = false;
  let isLoading = true;
  let currentTabUrl = '';
  let currentTabTitle = '';

  async function checkLoginStatus() {
    isLoading = true;
    try {
      const response = await chrome.runtime.sendMessage({ type: "GET_SUPABASE_SESSION" });
      if (response && response.success && response.session) {
        console.log("Popup: Session received", response.session);
        loggedIn = true;
        // Construct iframe URL with session parameters in the hash
        // Standard format: #access_token=...&expires_in=...&refresh_token=...&token_type=bearer
        // Supabase session object usually contains these directly or within provider_token/provider_refresh_token
        // Adjust based on the actual structure of your Supabase session object.
        // Assuming response.session is the standard Supabase session object.
        const session = response.session;
        let hashParams = `access_token=${encodeURIComponent(session.access_token)}`;
        if (session.refresh_token) {
          hashParams += `&refresh_token=${encodeURIComponent(session.refresh_token)}`;
        }
        if (session.expires_in) {
          hashParams += `&expires_in=${encodeURIComponent(session.expires_in)}`;
        }
        hashParams += `&token_type=${session.token_type || 'bearer'}`;
        
        // Ensure currentTabUrl and currentTabTitle are populated
        if (currentTabUrl || currentTabTitle) {
           iframeUrl = `https://reference-radar.vercel.app/create-reference?embed=true&url=${currentTabUrl}&title=${currentTabTitle}#${hashParams}`;
        } else {
          // Fallback or wait until tab info is loaded - this case should ideally be handled by sequencing
           iframeUrl = `https://reference-radar.vercel.app/create-reference?embed=true#${hashParams}`;
        }
        console.log("Popup: Constructed iframe URL:", iframeUrl);
      } else {
        console.log("Popup: No active session found or error.", response?.error);
        loggedIn = false;
        iframeUrl = ''; // Clear iframe URL if not logged in
      }
    } catch (e) {
      console.error("Popup: Error checking login status", e);
      loggedIn = false;
      iframeUrl = '';
    }
    isLoading = false;
  }

  function handleLogin() {
    // Open the login page in a new tab.
    // The content script on that page will handle sending the token to the background script.
    // The user will likely need to reopen the popup to see the logged-in state,
    // or this popup could listen for messages from background about session changes.
    chrome.tabs.create({ url: "https://reference-radar.vercel.app/login" }); // Assuming /login is the path
    // Optionally, you can close the popup after directing to login.
    // window.close(); 
  }

  async function handleLogout() {
    isLoading = true;
    try {
      await chrome.runtime.sendMessage({ type: "LOGOUT_SUPABASE" });
      loggedIn = false;
      iframeUrl = '';
      console.log("Popup: Logout successful");
    } catch (e) {
      console.error("Popup: Error during logout", e);
    }
    isLoading = false;
  }

  onMount(() => {
    // Get current tab URL and title first
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      currentTabUrl = encodeURIComponent(tabs[0]?.url || '');
      currentTabTitle = encodeURIComponent(tabs[0]?.title || '');
      // Now check login status, which will use these tab details if login is successful
      checkLoginStatus();
    });

    const messageListener = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
      if (message.type === 'SUPABASE_SESSION_UPDATED') {
        console.log("Popup: Received session update from background. Re-checking status.");
        checkLoginStatus(); // Re-check login status if background indicates a change
      }
      if (message.data === 'reference-added' && event.origin === 'https://reference-radar.vercel.app') {
        console.log("Popup: 'reference-added' message received from iframe.");
        window.close();
      }
    };
    
    chrome.runtime.onMessage.addListener(messageListener);

    // Listener for messages from the iframe (e.g., when a reference is added)
    // This needs to be specific about the origin for security.
    const iframeMessageListener = (event: MessageEvent) => {
      if (event.origin !== 'https://reference-radar.vercel.app') {
        return;
      }
      if (event.data === 'reference-added') {
        console.log("Popup: 'reference-added' message received from iframe via window.postMessage.");
        window.close();
      }
      // You could also listen for 'login-required' from the iframe if it's designed to send that
      // if (event.data === 'login-required') {
      //   loggedIn = false;
      //   isLoading = false;
      //   iframeUrl = '';
      // }
    };

    window.addEventListener('message', iframeMessageListener);

    onDestroy(() => {
      chrome.runtime.onMessage.removeListener(messageListener);
      window.removeEventListener('message', iframeMessageListener);
    });
  });
</script>

<main class="w-[22rem] h-[34rem] overflow-hidden bg-gray-50">
  {#if isLoading}
    <div class="flex items-center justify-center h-full">
      <p class="p-4 text-sm text-gray-600">Loading session...</p>
    </div>
  {:else if loggedIn && iframeUrl}
    <iframe
      src={iframeUrl}
      class="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      title="Reference Radar Content"
    />
  {:else}
    <div class="flex flex-col items-center justify-center h-full p-6 space-y-4">
      <h1 class="text-lg font-medium text-gray-700">Reference Radar</h1>
      <p class="text-sm text-center text-gray-500">
        Please log in to save references from the current page.
      </p>
      <button
        on:click={handleLogin}
        class="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        Log In
      </button>
    </div>
  {/if}

  {#if loggedIn && !isLoading}
    <div class="absolute top-2 right-2">
      <button
        on:click={handleLogout}
        class="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
      >
        Logout
      </button>
    </div>
  {/if}
</main>

<style>
  /* Add any additional global styles if needed, or use Tailwind classes directly */
  main {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  }
</style>
