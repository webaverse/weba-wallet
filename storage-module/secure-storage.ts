import * as sha256 from 'fast-sha256'
import nacl from 'tweetnacl'
import naclUtil from 'tweetnacl-util'
import dynamo from 'dynamodb';
import Joi from 'joi';
import config from '../aws-config.json';

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

export interface KeyStore<PrivateKeyData, PublicKeyData> {
  getPrivateKeyData (keyID: string, password: string, keysData: any): any
  saveKey (keyID: string, token: string, password: string, privateData: PrivateKeyData, publicData?: PublicKeyData): Promise<void>
  removeKey (keyID: string): Promise<void>
}

interface KeyMetadata {
  nonce: string,
  iterations: number
}

export interface RawKeyData<PublicKeyData> {
  metadata: KeyMetadata,
  public: PublicKeyData,
  private: string
}

export interface KeysData<PublicKeyData> {
  [keyID: string]: RawKeyData<PublicKeyData>
}

export type SaveKeys<PublicKeyData> = (data: KeysData<PublicKeyData>) => Promise<void> | void

function randomNonce () {
  return naclUtil.encodeBase64(nacl.randomBytes(nacl.secretbox.nonceLength))
}

function deriveHashFromPassword (password: string, metadata: KeyMetadata) {
  return sha256.pbkdf2(
    naclUtil.decodeUTF8(password),
    naclUtil.decodeBase64(metadata.nonce),
    metadata.iterations,
    nacl.secretbox.keyLength
  )
}

function decrypt (encryptedBase64: string, metadata: KeyMetadata, password: string) {
  const secretKey = deriveHashFromPassword(password, metadata)
  const decrypted = nacl.secretbox.open(naclUtil.decodeBase64(encryptedBase64), naclUtil.decodeBase64(metadata.nonce), secretKey)

  if (!decrypted) {
    return 'Error: Decryption failed. Wrong Password!'
    // throw new Error('Decryption failed.')
  }
  return JSON.parse(naclUtil.encodeUTF8(decrypted))
}

function encrypt (privateData: any, metadata: KeyMetadata, password: string): string {
  const secretKey = deriveHashFromPassword(password, metadata)
  const data = naclUtil.decodeUTF8(JSON.stringify(privateData))
  const encrypted = nacl.secretbox(data, naclUtil.decodeBase64(metadata.nonce), secretKey)
  return naclUtil.encodeBase64(encrypted)
}

export function createStore<PrivateKeyData, PublicKeyData = {}> (
  initialKeys: KeysData<PublicKeyData> = {},
  options: { iterations?: number } = {}
): KeyStore<PrivateKeyData, PublicKeyData> {
  const { iterations = 10000 } = options
  let keysData = initialKeys

  function save (id: string, keysData: any): any {

    var tempArray: any = [];
    
    WebaWallet.get(id, async function (err, res: any) {
      var obj = await res.get();
      if(obj.data) {
        tempArray = obj.data.filter((word: { [x: string]: any }) => !word[Object.keys(keysData)[0]]);
      }
      tempArray.push(keysData)

      WebaWallet.update({id: id, data: tempArray}, async function (err, resp: any) {
        if(err) {
          console.log(err)
        }
        else {
          console.log(resp.get())
        }
      });

    });

  }

  function saveKey (keyID: string, password: string, privateData: PrivateKeyData, publicData: PublicKeyData | {} = {}): void {
    // Important: Do not re-use previous metadata!
    // Use a fresh nonce. Also the previous metadata might have been forged.
    const metadata = {
      nonce: randomNonce(),
      iterations
    }
    keysData[keyID] = {
      metadata,
      public: publicData as any,
      private: encrypt(privateData, metadata, password)
    }
  }

  return {
    getPrivateKeyData (keyID: string, password: string, keysData: any) {
      if(keysData[keyID]) {
        return decrypt(keysData[keyID].private, keysData[keyID].metadata, password) as PrivateKeyData
      }
    },
    async saveKey (keyID: string, id: string, password: string, privateData: PrivateKeyData, publicData: PublicKeyData | {} = {}) {
      saveKey(keyID, password, privateData, publicData)
      await save(id, keysData);
    },
    async removeKey (keyID: string) {
      if (!keysData[keyID]) {
        throw new Error(`Cannot delete key ${keyID}. Key not found.`)
      }
      delete keysData[keyID]
    //   await save(keysData)
    }
  }
}