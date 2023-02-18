import sqlite3Worker from '..'

const runButton = /** @type {HTMLButtonElement} */ (document.getElementById('run'));
const clearButton = /** @type {HTMLButtonElement} */ (document.getElementById('clear'));
const initButton = /** @type {HTMLButtonElement} */ (document.getElementById('init'));
const inputCode = /** @type {HTMLButtonElement} */ (document.getElementById('input-code'));

let sqlite3;
let db;

(async () => {
    sqlite3 = await sqlite3Worker();
})()

// on init db press
initButton.addEventListener('click', async () => {
    db = await sqlite3.initializeDB("path/test.db");
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
    // prepare test
    // const result = await db.prepare("SELECT * from cars")
    // console.log({
    //     result
    // })
    // const res1 = await result.step();
    // console.log({
    //     res1
    // });
    // const res2 = await result.get({});
    // console.log({
    //     res2
    // })

    // transaction test
    const resultTransaction = await db.transaction((db) => {
        const x = db.exec(`
        INSERT INTO cars (id, name, color_id)
        VALUES
        (7, 'skoda', 1)`);
        return x
    })

    // original
    // await db.clear();
})