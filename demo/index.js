import sqlite3Worker from '..'

const runButton = /** @type {HTMLButtonElement} */ (document.getElementById('run'));
const clearButton = /** @type {HTMLButtonElement} */ (document.getElementById('clear'));
const initButton = /** @type {HTMLButtonElement} */ (document.getElementById('init'));
const inputCode = /** @type {HTMLButtonElement} */ (document.getElementById('input-code'));

let db;

(async () => {
    db = await sqlite3Worker();
})()

// on init db press
initButton.addEventListener('click', async () => {
    await db.initialize("path/test.db")
})

// on run press
runButton.addEventListener('click', async () => {
    await db.exec({
        returnValue: "resultRows",
        sql: inputCode.value,
        rowMode: 'object', // 'array' (default), 'object', or 'stmt'
        columnNames: []
    });
})

// on clear press
/**
 * @note currently used as test function for statement requests.
 */
clearButton.addEventListener('click', async () => {
    const result = await db.prepare("SELECT * from cars")
    console.log({result})
    const res1 = await result.step();
    console.log({res1});
    const res2 = await result.get({});
    console.log({res2})
    // await db.clear();
})