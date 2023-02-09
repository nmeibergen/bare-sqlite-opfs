import {
    sqlite3Worker
} from '../src/opfs-worker-initiatior.mjs'

const runButton = /** @type {HTMLButtonElement} */ (document.getElementById('run'));
const clearButton = /** @type {HTMLButtonElement} */ (document.getElementById('clear'));
const initButton = /** @type {HTMLButtonElement} */ (document.getElementById('init'));
const inputCode = /** @type {HTMLButtonElement} */ (document.getElementById('input-code'));

const worker = sqlite3Worker("../src/opfs-worker.js", {
    wasmLocation: window.origin + "/demo/sqlite3.wasm"
});

worker.addEventListener('message', async ({
    data
}) => {
    if (data === "ready") {
        init();
    }
}, {
    once: true
});

// on init db press
initButton.addEventListener('click', async () => {
    await init();
})

// on run press
runButton.addEventListener('click', async () => {
    await exec(inputCode.value);
})

// on clear press
clearButton.addEventListener('click', async () => {
    await clear();
})

/**
 * WORKER FUNCTIONS
 */

// Init
const init = (async () => {
    await request({
        f: "initialize",
        filePath: "path/test.db"
    })
});

// execute statement
export const exec = (sql) => request({
    f: "exec",
    statement: sql
});

// Clear
export const clear = async () => request({
    f: "clear"
});

// Generic request that waits for worker response to confirm completion
function request(message) {
    worker.postMessage(message);
    return new Promise(function (resolve) {
        worker.addEventListener('message', function ({
            data
        }) {
            console.log(data)
            resolve(data);
        }, {
            once: true
        });
    });
}