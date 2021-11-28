let express = require('express'),
  bodyParser = require('body-parser');
  axios =  require('axios');
  var path = require('path')

var CryptoJS = require("crypto-js");
const { uuid } = require('uuidv4');

var dynamo = require('dynamodb');
var Joi = require('joi');
var config = require('./aws-config.json');

// check if config file exists
if(config) {
  dynamo.AWS.config.update({
    "accessKeyId":config.accessKeyId,
    "secretAccessKey":config.secretAccessKey,
    "region":config.region
  });
}
else {
  throw new Error;
}

var WebaWallet = dynamo.define(config.tableName, {
  hashKey : 'mnemonic',
 
  // add the timestamp attributes (updatedAt, createdAt)
  timestamps : true,
 
  schema : {
    mnemonic   : Joi.string(),
    password    : Joi.string(),
    data: Joi.object()
  }
});

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

 
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

function setPassword(mnemonic, password) {
  return new Promise(async (resolve, reject) => {

    var en_pw = encrypt(password, mnemonic); // encrypt password

    WebaWallet.update({mnemonic: mnemonic, password: en_pw, data: {'temp-key': 'temp-password'}}, async function (err, res) {
      if(err) {
        return reject(err);
      }
      else {
        return resolve(res);
      }
    });
  })
}

app.post('/save-data', function(req, resp) {

  // validate token, temp_token and key-value data
  if(req.body.mnemonic && req.body.data) {
    var mnemonic = req.body.mnemonic;
    var newData = req.body.data;
  }
  else {
    return resp.send({'Error': 'Invalid mnemonic or Key-Value data'})
  }

  mnemonic = decrypt(mnemonic, config.encryptionKey);

  // fetch record from dynamoDB
  WebaWallet.get(mnemonic, async function (err, res) {

    if(res) {
      var obj = res.attrs;

      // validate temp_token
      if(obj.mnemonic == mnemonic && decrypt(obj.password, mnemonic)) {
        // store new key-value data
        obj.data[newData.key] = newData.value
        WebaWallet.update({mnemonic: mnemonic, data: obj.data}, async function (err, res) {
          if(err) {
            return resp.send({'Error': JSON.stringify(err)});
          }
          else {
            return resp.send({'Success': 'New key value saved', 'data': obj.data});
          }
        });
      }
      else {
        return resp.send({'Error': 'Invalid Temp Token, Login again to get a fresh-one'});
      }
    }
    // check for error
    else {
      return resp.send({'Error': err});
    }
  })

});

app.post('/get-keys', function(req, resp) {

  // validate token, temp_token and key-value data
  if(req.body.mnemonic) {
    var mnemonic = req.body.mnemonic;
  }
  else {
    return resp.send({'Error': 'Invalid Token or Temp token'})
  }

  // fetch data from dynamoDB
  WebaWallet.get(mnemonic, async function (err, res) {
    if(res) {
      var obj = res.attrs;

      if(obj.password) {
        // validate fresh temp_token
        if(obj.mnemonic == mnemonic && decrypt(obj.password, mnemonic)) {
          var en_mnemonic = encrypt(mnemonic, config.encryptionKey); // encrypt mnemonic
          // return user data
          return resp.send({'Success': 'Keys fetched', 'data': obj.data, 'mnemonic': en_mnemonic});
        }
        else {
          return resp.send({'Error': 'Invalid mnemonic, Login again to get a fresh-one'});
        }
      }
      else {
        var en_mnemonic = encrypt(mnemonic, config.encryptionKey); // encrypt mnemonic
        return resp.send({'Message': 'Password', 'mnemonic': en_mnemonic});
      }
    }
    // check for error
    else {
      return resp.send({'Error': err});
    }
  })

});

app.post('/validate', async function(req, resp) {
    
  if(req.body.mnemonic && req.body.password) {
    var {mnemonic, password} = req.body;
  }
  else {
    return resp.send({'Error': 'Invalid mnemonic or Password'})
  }

  var dc_mnemonic = decrypt(mnemonic, config.encryptionKey)
  var result = await setPassword(dc_mnemonic, password);
  var en_mnemonic = encrypt(result.attrs.mnemonic, config.encryptionKey)
  return resp.send({'Success': 'User password updated', 'mnemonic': en_mnemonic});
});

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