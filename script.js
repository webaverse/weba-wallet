window.addEventListener("message", receiveMessage, false);
var source = '';
var origin = '*';
const password = 'webawallet';

function receiveMessage(event){

    if (!event.origin.endsWith('webaverse.com') || event.origin.endsWith('wallet.weabaverse.com')  || !event.isTrusted)
        return;

    source = event.source;
    origin = event.origin;
    
    try{
        if(JSON.parse(event.data).action == 'getKey') {
            getKeys(JSON.parse(event.data).key);
        }
        else if(JSON.parse(event.data).action == 'getAllKeys') {
            getKeys();
        }
        else if(JSON.parse(event.data).action == 'storeKey') {
            saveData(JSON.parse(event.data).key, JSON.parse(event.data).value);
        }
        else {
           return source.postMessage({"Error": "Invalid request"}, origin);
        }

    }catch(e){
        //ignore error as it comes due to non-string params.
    }
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
    if(currData) {
        var newData = JSON.parse(currData);
        newData[key] = en_value;
        localStorage.setItem('data', JSON.stringify(newData));
    }
    else {
        var data = {};
        data[key] = en_value;
        localStorage.setItem('data', JSON.stringify(data));
    }
    source.postMessage("Success", origin);
}

function getKeys(key) {

    var result = {};
    if(JSON.parse(localStorage.getItem('data'))) {
        if(key) {
            if(key in JSON.parse(localStorage.getItem('data'))) {
                var value = JSON.parse(localStorage.getItem('data'))[key];
                if(value) {
                    var dc_value = decrypt(value, password);
                    result[key] = dc_value;
                }
            }
            else {
                source.postMessage({"Error": "Key doesn't exist"}, origin);
            }
        }
        else if(JSON.parse(localStorage.getItem('data'))) {
          for (const [key, value] of Object.entries(JSON.parse(localStorage.getItem('data')))) {
            var dc_value = decrypt(value, password);
            result[key] = dc_value;
          }
        }
    }
    source.postMessage(result, origin);
}

function lockedFn() {
    var val = document.getElementById(password).value;
    if(val) {
        document.getElementById("login").disabled = false;
    }
    else {
        document.getElementById("login").disabled = true;
    }
}
