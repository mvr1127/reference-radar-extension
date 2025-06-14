// src/background.ts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'AUTH_CHECK') {
    const targetUrl = 'https://reference-radar.vercel.app/create-reference';
    // We fetch the page that is normally loaded into the iframe.
    // If the user is logged in to reference-radar.vercel.app,
    // the browser should automatically send cookies.
    fetch(targetUrl, { credentials: 'include' })
      .then(response => {
        // If the response is OK and the final URL after redirects doesn't look like a login page
        if (response.ok && !response.url.includes('/login') && !response.url.includes('/signin')) {
          // Assuming that if we get a 200 OK and it's not a login page, the user is authenticated
          // and the content is what the iframe expects.
          sendResponse({ loggedIn: true });
        } else {
          // Either not response.ok (e.g. 401, 403, 500) or redirected to a login page
          sendResponse({ loggedIn: false });
        }
      })
      .catch(error => {
        console.error('Auth check fetch failed:', error);
        sendResponse({ loggedIn: false, error: error.message });
      });
    return true; // Indicates that the response is sent asynchronously
  }
});
