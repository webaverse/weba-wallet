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
  hashKey : 'token',
 
  // add the timestamp attributes (updatedAt, createdAt)
  timestamps : true,
 
  schema : {
    token   : Joi.string(),
    temp_token    : Joi.string(),
    password    : Joi.string(),
    data: Joi.object()
  }
});

// just here for develoment purposes 

// dynamo.createTables(function(err) {
//   if (err) {
//     console.log('Error creating tables: ', err);
//   } else {
//     console.log('Tables has been created');
//   }
// });

// WebaWallet.deleteTable(function(err) {
//   if (err) {
//     console.log('Error deleting table: ', err);
//   } else {
//     console.log('Table has been deleted');
//   }
// });

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

function updateTempToken(token, password, temp_token) {
  return new Promise((resolve, reject) => {

    var dc_pw = decrypt(password, temp_token); // decrypt password
    var temp_token_new = uuid(); // generate new temp_token
    var en_pw_new = encrypt(dc_pw, temp_token_new); // encrypt with new temp_token

    // update wallet with new encrypted password
    WebaWallet.update({token: token, temp_token: temp_token_new, password: en_pw_new}, async function (err, res) {
      if(err) {
        reject(err)
      }
      else {
        resolve(await res.get())
      }
    });
  })
}

function create(token, password) {
  return new Promise(async (resolve, reject) => {

    var temp_token = uuid(); // generate new random temp_token
    var en_pw = encrypt(password, temp_token); // encrypt password

    try {
      // create new entry in dynamoDB
      var wallet = new WebaWallet({token: token, temp_token: temp_token, password: en_pw, data: {'temp-key': 'temp-password'}});
      await wallet.save();
      var res = await wallet.get();
      // return user
      resolve(res)
    } catch( err ) {
      return reject(err);
    }
  })
}

app.post('/save-data', function(req, resp) {

  // validate token, temp_token and key-value data
  if(req.body.token && req.body.temp_token && req.body.data) {
    var {token, temp_token} = req.body;
    var newData = req.body.data;
  }
  else {
    return resp.send({'Error': 'Invalid Token, Temp token or Key-Value data'})
  }

  // fetch record from dynamoDB
  WebaWallet.get(token, async function (err, res) {

    if(res) {
      var obj = res.attrs;

      // validate temp_token
      if(obj.temp_token == temp_token && decrypt(obj.password, temp_token)) {  
        // store new key-value data
        obj.data[newData.key] = newData.value
        WebaWallet.update({token: token, data: obj.data}, async function (err, res) {
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
  if(req.body.token && req.body.temp_token ) {
    var {token, temp_token} = req.body;
  }
  else {
    return resp.send({'Error': 'Invalid Token or Temp token'})
  }

  // fetch data from dynamoDB
  WebaWallet.get(token, async function (err, res) {
    if(res) {
      var obj = res.attrs;

      // validate fresh temp_token
      if(obj.temp_token == temp_token && decrypt(obj.password, temp_token)) {
        // return user data
        return resp.send({'Success': 'Keys fetched', 'data': obj.data});
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

app.post('/validate', function(req, resp) {
    
  // validate token and password
  if(req.body.token && req.body.password) {
    var {token, password} = req.body;
  }
  else {
    return resp.send({'Error': 'Invalid Token or Password'})
  }

  // check for user in database
  WebaWallet.get(token, async function (err, res) {

    if(err) {
      return resp.send({'Error': JSON.stringify(err)});
    }
    // if user record found
    else if(res) {
      var obj = res.attrs;
      var updated = await updateTempToken(obj.token, obj.password, obj.temp_token);
      return resp.send({'Success': 'User logged in', 'data': obj.data, 'temp_token': updated.temp_token});
    }
    // if no record found create new user and return with temp_token
    else {
      var result = await create(token, password);
      return resp.send({'Success': 'User registered', 'temp_token': result.temp_token});
    }
  });
  
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