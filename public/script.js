// saveData('mujabs', 'muneeb');
getKeys('');

// $(document).ready(function() { 
//   window.opener.postMessage('received', 'http://localhost:3000');
//  });

// window.addEventListener("message", receiveMessage, false);
// // var mnemonic = '';
// var source = '';
// var origin = '';

// function receiveMessage(event){
// if (event.origin !== 'http://localhost:3000')
//     return;

//     source = event.source;
//     origin = event.origin;

//     // if(JSON.parse(event.data).mnemonic) {

//     //   mnemonic = JSON.parse(event.data).mnemonic;

//     //   if(JSON.parse(event.data).data) {
//     //     saveData(mnemonic, JSON.parse(event.data).data)
//     //   }
//     //   else {
//     //     getKeys(mnemonic);
//     //   }
//     // }
//     // else if(JSON.parse(event.data).p_mnemonic) {
//     //     mnemonic = JSON.parse(event.data).p_mnemonic;
//     // }
//     // else {
//     //     return source.postMessage({"Error": "Invalid mnemonic"}, origin);
//     // }

// }

function saveData(key, value) {
    var data = {
        key: key,
        value: value
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
            if(json.Success) {
                var currData = localStorage.getItem('data');
                if(currData) {
                    var newData = JSON.parse(currData)[key] = json.data;
                    localStorage.setItem('data', newData);
                }
                else {
                    var data = {};
                    data[key] = JSON.parse(json.data)
                    localStorage.setItem('data', JSON.stringify({data}));
                }
            }
            // source.postMessage(json, origin);
        });
}

function getKeys(key) {
    var data = {
        key: key,
        value: localStorage.getItem('data'),
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
            console.log('json', json);
            // source.postMessage(json, origin);
        });
}

// function submit() {

//     var data = {
//         mnemonic: mnemonic,
//         password: document.getElementById("password").value
//     };

//     fetch('/validate', {
//       method: 'POST',
//       body: JSON.stringify(data),
//       headers: {
//           'Content-type': 'application/json; charset=UTF-8'
//       }
//     })
//     .then(response => response.json())
//     .then(json => {
//       if(json.Error) {
//         document.getElementById("error").innerHTML = json.Error;
//       }
//       else {
//         document.getElementById("error").innerHTML = "";
//         source.postMessage(json, origin);
//         $( ".lock" ).toggleClass('unlocked');
//       }
//     });

// }

function lockedFn() {
    var val = document.getElementById("password").value;
    if(val) {
        document.getElementById("login").disabled = false;
    }
    else {
        document.getElementById("login").disabled = true;
    }
}
