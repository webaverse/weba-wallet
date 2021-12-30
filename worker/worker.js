let mnemonic = '';


async function login(id, code) {
    try {
        const response = await fetch(`https://login.webaverse.com/?discordid=${id}&discordcode=${code}&redirect_uri=https://staging.webaverse.com/login`, {
            "method": "POST",
        });
        const jsonResponse = await response.json();
        if (jsonResponse.error) {
            throw new Error(jsonResponse.error);
        }
        mnemonic = jsonResponse.mnemonic;
        postMessage(JSON.stringify({
            action: 'Login',
            error: null
        }));
    } catch (error) {
        postMessage(JSON.stringify({
            action: 'Login',
            error: error.message
        }));
    }
}


/* 
 * Here action is the name of the command to be performed.
 * And the payload is the data to be passed to the command.
*/
onmessage = async (message) => {
    try {
        const {
            action,
            payload
        } = JSON.parse(message.data);

        if (action === 'Login') {
            await login(payload.id, payload.code);
        }
    } catch (error) {
        postMessage(error.message);
    }
};