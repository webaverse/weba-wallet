$(document).ready(function() { 
  window.opener.postMessage('received', 'https://secure.webaverse.com');
 });

window.addEventListener("message", receiveMessage, false);
var token = '';
var source = '';
var origin = '';

function receiveMessage(event){
if (event.origin !== 'https://secure.webaverse.com')
    return;

    if(JSON.parse(event.data).temp_token) {
      if(JSON.parse(event.data).data) {
        saveData(JSON.parse(event.data).temp_token, JSON.parse(event.data).token, JSON.parse(event.data).data)
      }
      else {
        getKeys(JSON.parse(event.data).temp_token, JSON.parse(event.data).token);
      }
    }

    token = JSON.parse(event.data).token;
    source = event.source;
    origin = event.origin;

}

function saveData(temp_token, token, newData) {
    var data = {
        token: token,
        temp_token: temp_token,
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

function getKeys(temp_token, token) {
    var data = {
        token: token,
        temp_token: temp_token,
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
        token: token,
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
