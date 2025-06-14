// src/background.ts

const SUPABASE_SESSION_KEY = "supabase_session";

// Listener for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SUPABASE_SESSION") {
    // Message from content script with the session details
    if (message.session) {
      console.log(
        "Background: Received session from content script, storing..."
      );
      chrome.storage.local.set(
        { [SUPABASE_SESSION_KEY]: message.session },
        () => {
          if (chrome.runtime.lastError) {
            console.error(
              "Background: Error storing Supabase session:",
              chrome.runtime.lastError
            );
            sendResponse({
              success: false,
              error: chrome.runtime.lastError.message,
            });
          } else {
            console.log("Background: Supabase session stored successfully.");
            sendResponse({ success: true });
          }
        }
      );
    } else {
      // Session is null, meaning logout detected by content script
      console.log(
        "Background: Received null session (logout) from content script, clearing stored session..."
      );
      chrome.storage.local.remove(SUPABASE_SESSION_KEY, () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Background: Error clearing Supabase session:",
            chrome.runtime.lastError
          );
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          console.log("Background: Supabase session cleared successfully.");
          sendResponse({ success: true });
        }
      });
    }
    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  } else if (message.type === "GET_SUPABASE_SESSION") {
    // Message from popup script requesting the current session
    console.log(
      "Background: Received request for Supabase session from popup."
    );
    chrome.storage.local.get(SUPABASE_SESSION_KEY, (result) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Background: Error retrieving Supabase session:",
          chrome.runtime.lastError
        );
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
      } else {
        console.log(
          "Background: Sending session to popup:",
          result[SUPABASE_SESSION_KEY]
        );
        sendResponse({
          success: true,
          session: result[SUPABASE_SESSION_KEY] || null,
        });
      }
    });
    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  } else if (message.type === "LOGOUT_SUPABASE") {
    // Message from popup script to logout
    console.log("Background: Received request to logout from popup.");
    chrome.storage.local.remove(SUPABASE_SESSION_KEY, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Background: Error clearing Supabase session on logout:",
          chrome.runtime.lastError
        );
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
      } else {
        console.log(
          "Background: Supabase session cleared successfully on logout."
        );
        sendResponse({ success: true });
      }
    });
    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  }

  // If the message type is not recognized, do nothing or log an error
  // console.log("Background: Received unhandled message type:", message.type);
  // sendResponse({ success: false, error: "Unknown message type" });
  // No return true here if sendResponse is not called asynchronously for this path
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Reference Radar background script installed.");
});

console.log(
  "Reference Radar background script loaded and listening for messages."
);
