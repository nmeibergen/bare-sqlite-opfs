import sqlite3Worker from '..'

const runButton = /** @type {HTMLButtonElement} */ (document.getElementById('run'));
const clearButton = /** @type {HTMLButtonElement} */ (document.getElementById('clear'));
const initButton = /** @type {HTMLButtonElement} */ (document.getElementById('init'));
const inputCode = /** @type {HTMLButtonElement} */ (document.getElementById('input-code'));
const testButton = /** @type {HTMLButtonElement} */ (document.getElementById('test'));

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
    await sqlite3.clear();
})

testButton.addEventListener('click', async () => {
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

    await db.exec(`
    CREATE TABLE cars(  
        id INT PRIMARY KEY NOT NULL,  
        name TEXT NOT NULL,
        color_id INT
      );
      CREATE TABLE colors(  
        id INT PRIMARY KEY NOT NULL,  
        name TEXT NOT NULL
      );
    `)

    const amount = 1e4;
    const start = new Date();

    const logTime = () => {
        const total = (new Date()).getTime() - start.getTime();
        console.log(`Total time: ${total} ms`);
    }

    const result = (i) => {
        i === amount && logTime();
    }

    // for (let i = 0; i < amount; i++) {
    //     db.exec(`
    //     INSERT INTO cars (id, name, color_id)
    //     VALUES
    //     (${i}, 'skoda', 1)
    //     `).then(_ => result(i + 1));
    // }

    // transaction test
    db.transaction((db, {
        amount
    }) => {
        for (let i = 0; i < amount; i++) {
            db.exec(`
            INSERT INTO cars (id, name, color_id)
            VALUES
            (${i}, 'skoda', 1)
            `)
        }
    }, {
        amount
    }).then(logTime)
})