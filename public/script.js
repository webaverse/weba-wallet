$(document).ready(function() { 
  window.opener.postMessage('received', 'app.webaverse.com');
 });

window.addEventListener("message", receiveMessage, false);
var mnemonic = '';
var source = '';
var origin = '';

function receiveMessage(event){
if (event.origin !== 'app.webaverse.com')
    return;

    source = event.source;
    origin = event.origin;

    if(JSON.parse(event.data).mnemonic) {

      mnemonic = JSON.parse(event.data).mnemonic;

      if(JSON.parse(event.data).data) {
        saveData(mnemonic, JSON.parse(event.data).data)
      }
      else {
        getKeys(mnemonic);
      }
    }
    else if(JSON.parse(event.data).p_mnemonic) {
        mnemonic = JSON.parse(event.data).p_mnemonic;
    }
    else {
        return source.postMessage({"Error": "Invalid mnemonic"}, origin);
    }

}

function saveData(mnemonic, newData) {
    var data = {
        mnemonic: mnemonic,
        data: newData
    };

    fetch('/save-data', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            }
        })
        .then(response => response.json())
        .then(json => {
            source.postMessage(json, origin);
        });
}

function getKeys(mnemonic) {
    var data = {
        mnemonic: mnemonic,
    };

    fetch('/get-keys', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            }
        })
        .then(response => response.json())
        .then(json => {
            source.postMessage(json, origin);
        });
}

function submit() {

    var data = {
        mnemonic: mnemonic,
        password: document.getElementById("password").value
    };

    fetch('/validate', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
          'Content-type': 'application/json; charset=UTF-8'
      }
    })
    .then(response => response.json())
    .then(json => {
      if(json.Error) {
        document.getElementById("error").innerHTML = json.Error;
      }
      else {
        document.getElementById("error").innerHTML = "";
        source.postMessage(json, origin);
        $( ".lock" ).toggleClass('unlocked');
      }
    });

}

function lockedFn() {
    var val = document.getElementById("password").value;
    if(val) {
        document.getElementById("login").disabled = false;
    }
    else {
        document.getElementById("login").disabled = true;
    }
}
