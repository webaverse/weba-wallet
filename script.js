import { getAddressFromMnemonic } from './blockchain.js';

var source = '';
var origin = '*';
var pk = '';
let chainName = 'mainnet';
const discordClientId = '684141574808272937';
const loginEndpoint = 'https://login.webaverse.com';
const accountsHost = `https://${chainName}sidechain-accounts.webaverse.com`;


window.addEventListener("message", receiveMessage, false);

window.parent.postMessage({
    method: 'wallet_launched'
}, '*');

const password = 'webawallet';


function receiveMessage(event) {

    if ((!event.origin.endsWith('localhost') && !event.origin.endsWith('webaverse.com')) || event.origin.endsWith('wallet.webaverse.com') || !event.isTrusted)
        return;

    source = event.source;
    origin = event.origin;

    try {

        if (event.data.action === 'register') {
            if (pk.length < 1) {
                pk = event.data.key;
                source.postMessage({ 'method': 'wallet_registered' }, origin);
            }
        }
        if (event.data.action === 'signed_message') {
            const { encoded, signature } = event.data.message;
            verifySignature(encoded, signature).then(async (verified) => {
                if (verified) {
                    let _d = JSON.parse(new TextDecoder().decode(encoded));
                    switch (_d.action) {
                        case 'getUserData':
                            await autoLogin();
                            break;
                        case 'doLoginViaDiscord':
                            let { id, code } = _d;
                            let result = await handleDiscordLogin(code, id);
                            await dispatchUserData('wallet_userdata' , result);
                            break;
                        case 'logout':
                            removeKey('mnemonic');
                            dispatchUserData('logout',null);
                            break;


                        default:
                            break;
                    }
                }else{
                    console.warn('Signature Mismatch');
                }
            });
        }
        else {
            return source.postMessage({ "Error": "Invalid request" }, origin);
        }

    } catch (e) {
        //ignore error as it comes due to non-string params.
    }
}

async function verifySignature(encoded, signature) {
    return await window.crypto.subtle.verify({ name: 'ECDSA', hash: { name: "SHA-384" } },
        pk,
        signature,
        encoded
    );
}

function encrypt(val, secret) {
    var cipher = CryptoJS.AES.encrypt(val, secret);
    cipher = cipher.toString();
    return cipher;
}

function decrypt(val, secret) {
    var decipher = CryptoJS.AES.decrypt(val, secret);
    decipher = decipher.toString(CryptoJS.enc.Utf8);
    return decipher;
}

function saveData(key, value) {
    var en_value = encrypt(value, password);
    var currData = localStorage.getItem('data');
    if (currData) {
        var newData = JSON.parse(currData);
        newData[key] = en_value;
        localStorage.setItem('data', JSON.stringify(newData));
    }
    else {
        var data = {};
        data[key] = en_value;
        localStorage.setItem('data', JSON.stringify(data));
    }
}

function removeKey(key){
    var currData = JSON.parse(localStorage.getItem('data'));
    if(currData){
        currData[key] = null;
        localStorage.setItem('data',JSON.stringify(currData));
    }
}

function getKey(key) {
    let data = localStorage.getItem('data')
    if (data) {
        data = JSON.parse(data);
        if (key) {
            if (key in data) {
                var value = data[key];
                if (value) {
                    return decrypt(value, password);
                }
            }
        }
    }
}

const pullUserObject = async (loginToken) => {
    if(!loginToken.mnemonic){
        return {};
    }
    const address = getAddressFromMnemonic(loginToken.mnemonic);
    const res = await fetch(`${accountsHost}/${address}`);
    var result = await res.json();
    saveData('mnemonic', loginToken.mnemonic);
    return result;
}

const handleDiscordLogin = async (code, id) => {
    if (!code || getKey('discordcode') === code) {
        // console.warn('Wallet', 'Invalid Login Attempt');
        autoLogin();
    }

    saveData('discordcode', code);
    try {
        let res = await fetch(loginEndpoint + `?discordid=${encodeURIComponent(id)}&discordcode=${encodeURIComponent(code)}&redirect_uri=${origin}/login`, {
            method: 'POST',
        });
        res = await res.json();
        if (!res.error) {
            return await pullUserObject(res);
        } else {
            console.warn('Unable to login ', res.error);
            return res;
        }
    } catch (e) {
        console.warn('Unable to login ', e);
    }
};


const dispatchUserData = (method, data) =>{
    source.postMessage({ method, data }, origin);
}

const autoLogin = async () => {
    dispatchUserData('wallet_userdata',await pullUserObject({mnemonic:getKey('mnemonic')}));
}