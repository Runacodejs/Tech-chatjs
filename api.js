
// This file contains functions for making API requests.

/**
 * Sends a POST request to a given URL with a bearer token.
 *
 * @param {string} url The URL to send the request to.
 * @param {string} token The bearer token for authorization.
 * @param {object} body The JSON body of the request.
 * @returns {Promise<object>} The JSON response from the server.
 */
async function sendPostRequest(url, token, body) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending POST request:", error);
    throw error;
  }
}

// Example of how to use the function with the data you provided:
/*
const fcmUrl = 'https://fcm.googleapis.com/v1/projects/myproject-b5ae1/messages:send';
const oauthToken = 'ya29.ElqKBGN2Ri_Uz...HnS_uNreA'; // This should be a valid, non-expired token

const messageBody = {
  "message": {
    "topic": "Tech",
    "android": {
      "ttl": "3600s",
      "notification": {
        "body_loc_key": "STOCK_NOTIFICATION_BODY",
        "body_loc_args": ["FooCorp", "11.80", "835.67", "1.43"],
      },
    },
    "apns": {
      "payload": {
        "aps": {
          "alert": {
            "loc-key": "STOCK_NOTIFICATION_BODY",
            "loc-args": ["FooCorp", "11.80", "835.67", "1.43"],
          },
        },
      },
    },
  },
};

// You would call the function like this:
// sendPostRequest(fcmUrl, oauthToken, messageBody)
//   .then(data => console.log('Success:', data))
//   .catch(error => console.error('Error:', error));

// NOTE: Running this directly in the browser is not recommended for services like FCM.
// The Authorization token and server logic should be handled on a secure server,
// not exposed on the client-side.
*/
