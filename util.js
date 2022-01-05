export function jsonParse(s, d = null) {
  try {
    return JSON.parse(s);
  } catch (err) {
    return d;
  }
}
export function parseQuery(queryString) {
  const query = {};
  const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    const k = decodeURIComponent(pair[0]);
    if (k) {
      const v = decodeURIComponent(pair[1] || '');
      query[k] = v;
    }
  }
  return query;
}
export function getRandomString() {
  return Math.random().toString(36).substring(7);
}
export function hex2Uint8Array(hex) {
  return new Uint8Array(hex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)))
}
export function uint8Array2hex(uint8Array) {
  return Array.prototype.map.call(uint8Array, x => ('00' + x.toString(16)).slice(-2)).join('');
}
export function getExt(fileName) {
  const match = fileName
    .replace(/^[a-z]+:\/\/[^\/]+\//, '')
    .match(/\.([^\.]+|t\.js|rtf\.js)(?:\?.*)?$/);
  return match ? match[1].toLowerCase() : '';
}
export function downloadFile(file, filename) {
  const blobURL = URL.createObjectURL(file);
  const tempLink = document.createElement('a');
  tempLink.style.display = 'none';
  tempLink.href = blobURL;
  tempLink.setAttribute('download', filename);

  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
}
export function readFile(file) {
  return new Promise((accept, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      accept(new Uint8Array(fr.result));
    };
    fr.onerror = reject;
    fr.readAsArrayBuffer(file);
  });
}
export function bindUploadFileButton(inputFileEl, handleUpload) {
  function change(e) {
    inputFileEl.removeEventListener('change', change);
    
    const {files} = e.target;
    if (inputFileEl.multiple) {
      handleUpload(Array.from(files));
    } else {
      const [file = null] = files;
      handleUpload(file);
    }

    const {parentNode} = inputFileEl;
    parentNode.removeChild(inputFileEl);
    const newInputFileEl = inputFileEl.ownerDocument.createElement('input');
    newInputFileEl.type = 'file';
    newInputFileEl.id = inputFileEl.id;
    // newInputFileEl.id = 'upload-file-button';
    // newInputFileEl.style.display = 'none';
    newInputFileEl.classList.add('hidden');
    parentNode.appendChild(newInputFileEl);
    bindUploadFileButton(newInputFileEl, handleUpload);
  }
  inputFileEl.addEventListener('change', change);
}

export function snapPosition(o, positionSnap) {
  if (positionSnap > 0) {
    o.position.x = Math.round((o.position.x + positionSnap/2) / positionSnap) * positionSnap - positionSnap/2;
    o.position.y = Math.round((o.position.y + positionSnap/2) / positionSnap) * positionSnap - positionSnap/2;
    o.position.z = Math.round((o.position.z + positionSnap/2) / positionSnap) * positionSnap - positionSnap/2;
  }
}
export function snapRotation(o, rotationSnap) {
  o.rotation.x = Math.round(o.rotation.x / rotationSnap) * rotationSnap;
  o.rotation.y = Math.round(o.rotation.y / rotationSnap) * rotationSnap;
  o.rotation.z = Math.round(o.rotation.z / rotationSnap) * rotationSnap;
}

export function makePromise() {
  let accept, reject;
  const p = new Promise((a, r) => {
    accept = a;
    reject = r;
  });
  p.accept = accept;
  p.reject = reject;
  return p;
}

export function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

export class WaitQueue {
  constructor() {
    this.locked = false;
    this.waiterCbs = [];
  }

  async lock() {
    if (!this.locked) {
      this.locked = true;
    } else {
      const p = makePromise();
      this.waiterCbs.push(p.accept);
      await p;
    }
  }

  async unlock() {
    if (this.waiterCbs.length > 0) {
      this.waiterCbs.pop()();
    } else {
      this.locked = false;
    }
  }

  clearQueue() {
    this.waiterCbs.length = 0;
  }
}

export function isInIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}