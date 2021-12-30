function workerWrapper(id, code) {
    const _worker = new Worker("worker.js");
    _worker.addEventListener('message', (message) => {
        console.log(message);
    });
    _worker.postMessage(JSON.stringify({
        action: 'Login',
        payload: {
            id,
            code
        }
    }));
}



// Code for submiting the form and passigg the data to the function above
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const link = document.getElementById('link').value;
    if (!link.startsWith('https://webaverse.com/login?')) {
        alert('Invalid link');
        return;
    }
    const params = new URLSearchParams(link.substring(link.indexOf('?') + 1));
    const id = params.get('id');
    const code = params.get('code');
    if (!id || !code) {
        alert('Invalid link');
        return;
    }
    const wallet = workerWrapper(id, code);
});