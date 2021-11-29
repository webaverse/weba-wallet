let express = require('express'),
  bodyParser = require('body-parser');
  axios =  require('axios');
  var path = require('path')

var CryptoJS = require("crypto-js");
const { uuid } = require('uuidv4');
var { createStore } = require('./storage-module/build/secure-storage');

const store = createStore()

// store.saveKey('login-token', '123', 'password', { privateKey: 'token' });
// const { privateKey } = store.getPrivateKeyData('login-token', 'password', value);
// if(!privateKey) {
//   return resp.send({'Error': 'Decryption failed. Wrong password.'});
// }
// var dynamo = require('dynamodb');
// var Joi = require('joi');
// var config = require('./aws-config.json');

// check if config file exists
// if(config) {
//   dynamo.AWS.config.update({
//     "accessKeyId":config.accessKeyId,
//     "secretAccessKey":config.secretAccessKey,
//     "region":config.region
//   });
// }
// else {
//   throw new Error;
// }

// var WebaWallet = dynamo.define(config.tableName, {
//   hashKey : 'mnemonic',
 
//   // add the timestamp attributes (updatedAt, createdAt)
//   timestamps : true,
 
//   schema : {
//     mnemonic   : Joi.string(),
//     password    : Joi.string(),
//     data: Joi.object()
//   }
// });

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

 
// function encrypt(val, secret) {
//   var cipher = CryptoJS.AES.encrypt(val, secret);
//   cipher = cipher.toString();
//   return cipher;
// }
// function decrypt(val, secret) {
//   var decipher = CryptoJS.AES.decrypt(val, secret);
//   decipher = decipher.toString(CryptoJS.enc.Utf8);
//   return decipher;
// }
// function setPassword(mnemonic, password) {
//   return new Promise(async (resolve, reject) => {
//     var en_pw = encrypt(password, mnemonic); // encrypt password
//     WebaWallet.update({mnemonic: mnemonic, password: en_pw, data: {'temp-key': 'temp-password'}}, async function (err, res) {
//       if(err) {
//         return reject(err);
//       }
//       else {
//         return resolve(res);
//       }
//     });
//   })
// }

app.post('/save-data', function(req, resp) {

  if(req.body.key && req.body.value) {
    var {key, value} = req.body;
  }
  else {
    return resp.send({'Error': 'Invalid data'})
  }

  var result = store.saveKey(key, 'password', { privateKey: value });
  result.then((data)=>{
    return resp.send({'Success': 'New key value saved', 'data': data});
  })
  .catch((err)=>{
    return resp.send({'Error': err});
  })


});

app.post('/get-keys', function(req, resp) {

  var result = {};
  if(req.body.key.length) {
    const { privateKey } = store.getPrivateKeyData(key, 'password', JSON.parse(req.body.value)[req.body.key])
    result[req.body.key] = privateKey;
  }
  else {
    for (const [key, value] of Object.entries(JSON.parse(req.body.value))) {
      const { privateKey } = store.getPrivateKeyData(req.body.key, 'password', value)
      result[key] = privateKey;
    }
  }
  return resp.send({'Data': result});
});

// app.post('/validate', async function(req, resp) {
    
//   if(req.body.mnemonic && req.body.password) {
//     var {mnemonic, password} = req.body;
//   }
//   else {
//     return resp.send({'Error': 'Invalid mnemonic or Password'})
//   }

//   var dc_mnemonic = decrypt(mnemonic, config.encryptionKey)
//   var result = await setPassword(dc_mnemonic, password);
//   var en_mnemonic = encrypt(result.attrs.mnemonic, config.encryptionKey)
//   return resp.send({'Success': 'User password updated', 'mnemonic': en_mnemonic});
// });

// Create port

const port = process.env.PORT || 3002;
const server = app.listen(port, () => {
  console.log('Connected to port ' + port)
})

// error handler
app.use(function (err, req, res, next) {
  console.error(err.message);
  if (!err.statusCode) err.statusCode = 500;
  res.status(err.statusCode).send(err.message);
});