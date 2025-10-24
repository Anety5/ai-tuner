// This script runs in the background and listens for the extension icon to be clicked.
chrome.action.onClicked.addListener((tab) => {
  // When the icon is clicked, create a new window.
  chrome.windows.create({
    url: chrome.runtime.getURL('index.html'),
    type: 'popup', // Creates a standalone window without browser chrome.
    width: 850,   // Set the width of the window.
    height: 700,  // Set the height of the window.
  });
});
