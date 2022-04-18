import type { IMessageReceived, IMessageSent } from "./types";
import { config } from "./config";
import { Blockchain } from "./methods";

const blockhcain = new Blockchain();

const sendMessage = (message: IMessageSent) => {
  try {
    const strMessage = JSON.stringify(message);
    window.parent.postMessage(strMessage, "*");
  } catch (error) {
    console.log({ message });
    console.log(error);
  }
};

const receiveMessage = async (event: MessageEvent) => {
  if (!config.allowedOrigins.includes(event.origin)) {
    return;
  }
  let req: IMessageReceived = {
    data: {},
    method: "",
  };
  try {
    req = JSON.parse(event.data);
  } catch (error) {
    console.log("error");
    console.log(event);
  }
  const { data, method } = req;
  if (method === "check_auth") {
    const jwt = localStorage.getItem("jwt");
    console.log("found jwt", jwt);
    let auth = false;
    if (jwt) {
      try {
        await blockhcain.setupWallet(jwt);
        auth = true;
      } catch (error) {
        localStorage.removeItem("jwt");
        console.log(error);
      }
    }
    sendMessage({
      data: {
        auth: auth,
      },
      method: method,
      type: "response",
      error: null,
    });
  } else if (method === "initiate_wallet_metamask") {
    try {
      let fetchRes = await fetch(`${config.authServerURL}/metamask-login`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: data.address,
          signedMessage: data.signedMessage,
        }),
      });
      let fetchResJson = await fetchRes.json();
      if (fetchRes.status >= 400) {
        return sendMessage({
          data: null,
          method: method,
          type: "response",
          error: "Authentication failed",
        });
      }
      const jwtToken = fetchResJson.jwtToken;

      await blockhcain.setupWallet(jwtToken);
      localStorage.setItem("jwt", jwtToken);
      sendMessage({
        data: {
          message: "Wallet initialized",
        },
        method: method,
        type: "response",
        error: null,
      });
    } catch (error) {
      sendMessage({
        data: null,
        method: method,
        type: "response",
        error: error.message,
      });
    }
  } else if (method === "initiate_wallet_discord") {
    try {
      let fetchRes = await fetch(`${config.authServerURL}/discord-login`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discordid: data.discordid,
          discordcode: data.discordcode,
        }),
      });
      let fetchResJson = await fetchRes.json();
      if (fetchRes.status >= 400) {
        return sendMessage({
          data: null,
          method: method,
          type: "response",
          error: "Authentication failed",
        });
      }
      const jwtToken = fetchResJson.jwtToken;

      await blockhcain.setupWallet(jwtToken);
      localStorage.setItem("jwt", jwtToken);
      sendMessage({
        data: {
          message: "Wallet initialized",
        },
        method: method,
        type: "response",
        error: null,
      });
    } catch (error) {
      sendMessage({
        data: null,
        method: method,
        type: "response",
        error: error.message,
      });
    }
  } else if (method === "get_profile") {
    try {
      const profile = await blockhcain.getProfile();
      sendMessage({
        data: profile,
        method: method,
        type: "response",
        error: null,
      });
    } catch (error) {
      sendMessage({
        data: null,
        method: method,
        type: "response",
        error: error.message,
      });
    }
  } else if (method === "set_profile") {
    try {
      const { key, value } = data;
      await blockhcain.setProfile(key, value);
      sendMessage({
        data: {
          message: "Profile updated",
        },
        method: method,
        type: "response",
        error: null,
      });
    } catch (error) {
      console.log(error);
      sendMessage({
        data: null,
        method: method,
        type: "response",
        error: "Something went wrong",
      });
    }
  } else {
    sendMessage({
      data: null,
      method: method,
      type: "response",
      error: "Invalid method",
    });
  }
};

window.addEventListener("message", receiveMessage, false);

window.onload = () => {
  sendMessage({
    type: "event",
    method: "wallet_launched",
    error: null,
    data: {},
  });
};
