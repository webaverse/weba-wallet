let express = require('express'),
  cors = require('cors'),
  bodyParser = require('body-parser');
  axios =  require('axios');
  var path = require('path')

var serveStatic = require('serve-static');
var { createStore } = require('./storage-module/build/storage-module/secure-storage');
var CryptoJS = require("crypto-js");
const { uuid } = require('uuidv4');

var dynamo = require('dynamodb');
var Joi = require('joi');
var config = require('./aws-config.json');

dynamo.AWS.config.update({
  "accessKeyId":config.accessKeyId,
  "secretAccessKey":config.secretAccessKey,
  "region":config.region
});

var WebaWallet = dynamo.define(config.tableName, {
  hashKey : 'id',
 
  // add the timestamp attributes (updatedAt, createdAt)
  timestamps : true,
 
  schema : {
    id   : Joi.string(),
    token   : Joi.string(),
    temp_token    : Joi.string(),
    password    : Joi.string(),
    data: Joi.array()
  }
});

const store = createStore()

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// app.use(serveStatic(__dirname + "/dist"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
 
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

function updateTempToken(id, password, temp_token) {
  return new Promise((resolve, reject) => {

    var dc_pw = decrypt(password, temp_token);
    var temp_token_new = uuid();
    var en_pw_new = encrypt(dc_pw, temp_token_new);

    var data = {
      temp_token: temp_token_new,
      password: en_pw_new
    }

    WebaWallet.update({id: id, temp_token: temp_token_new, password: en_pw_new}, async function (err, res) {
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

    var temp_token = uuid();
    var en_pw = encrypt(password, temp_token);

    try {
      var id = uuid();
      var wallet = new WebaWallet({id: id, token: token, temp_token: temp_token, password: en_pw});
      await wallet.save();
      var res = await wallet.get();
      store.saveKey('login-token', res.id, password, { privateKey: token })
      resolve(res)
    } catch( err ) {
      // console.log('error in creating new account', err);
      reject(err)
      // return err;
    }
  })
}

app.post('/save-data', function(req, resp) {
  var temp_token = req.body.temp_token;
  var token = req.body.token;
  var newData = req.body.data;

  WebaWallet
  .scan()
  .loadAll()
  .exec(async (err, res)=>{

    if(res) {
      let obj = res.Items.find(o => o.attrs.token === token).attrs;

      if(obj.temp_token == temp_token) {
  
        var dc_pw = decrypt(obj.password, temp_token);
  
        store.saveKey(newData.key, obj.id, dc_pw, { privateKey: newData.value })

        var updated = await updateTempToken(obj.id, obj.password, temp_token);
        return resp.send({'Success': 'New key value saved', 'temp_token': updated.temp_token});
  
      }
      return false;
    }
    else {
      console.log(err);
    }

  });

});

app.post('/get-keys', function(req, resp) {
  var temp_token = req.body.temp_token;
  var token = req.body.token;

  WebaWallet
  .scan()
  .loadAll()
  .exec(async (err, res)=>{
    if(res) {
      let obj = res.Items.find(o => o.attrs.token === token).attrs;

      if(obj.temp_token == temp_token) {
  
        var dc_pw = decrypt(obj.password, temp_token);

        var privateKeyArray = new Array;
  
        for (const [key, value] of Object.entries(obj.data)) {
  
          for (const [k, v] of Object.entries(value)) {
  
            const { privateKey } = store.getPrivateKeyData(k, dc_pw, value);
            if(!privateKey) {
              return resp.send({'Error': 'Decryption failed. Wrong password.'});
            }
            privateKeyArray.push({[k]: privateKey});
            
          }
  
        }
  
        if(!privateKeyArray.length) {
          return resp.send({'Error': 'Decryption failed. Wrong password.'});
        }
        else {
          var updated = await updateTempToken(obj.id, obj.password, temp_token);
          return resp.send({'Success': 'Keys fetched', 'data': privateKeyArray, 'temp_token': updated.temp_token});
        }
  
      }
      return false;
    }
    else {
      console.log(err);
    }
  })
});

app.post('/validate', function(req, resp) {
  // var token = req.body.token;
  var token = 'hello3';
  var password = req.body.password;

  WebaWallet
  .scan()
  .loadAll()
  .exec(async (err, res)=>{
    if(res) {

      let obj = res.Items.find(o => o.attrs.token == token);

      if(obj) {

        obj = obj.attrs;
      
        if(obj.data) {
  
          var privateKeyArray = new Array;
    
          for (const [key, value] of Object.entries(obj.data)) {
    
            for (const [k, v] of Object.entries(value)) {
              const { privateKey } = store.getPrivateKeyData(k, password, value);
              if(!privateKey) {
                return resp.send({'Error': 'Decryption failed. Wrong password.'});
              }
              privateKeyArray.push({[k]: privateKey});
              
            }
    
          }
    
          if(!privateKeyArray.length) {
            return resp.send({'Error': 'Decryption failed. Wrong password.'});
          }
          else {
            var updated = await updateTempToken(obj.id, obj.password, obj.temp_token);
            return resp.send({'Success': 'User logged in', 'data': privateKeyArray, 'temp_token': updated.temp_token});
          }
        }
        return resp.send({'Success': 'User logged in', 'data': [], 'temp_token': updated.temp_token});
      }
      else {
        var result = await create(token, password);
        return resp.send({'Success': 'User registered', 'temp_token': result.temp_token});
      }
    }
    else {
      console.log(err);
    }
  })
  
});

// app.all("*", (_req, res) => {
//   try {
//     res.sendFile(__dirname + '/public/index.html');
//   } catch (error) {
//     res.json({ success: false, message: "Something went wrong" });
//   }
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