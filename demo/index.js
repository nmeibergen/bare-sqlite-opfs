import sqlite3Worker from '../src'

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
    db = await sqlite3.initializeDB("watermelon/temp.db");
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
    await db.transaction((db, {
        amount
    }) => {
        for (let i = 0; i < amount; i++) {
            db.prepare(`
            INSERT INTO cars (id, name, color_id)
            VALUES
            (?, 'skoda', 1)
            `).run(i)
        }
    }, {
        amount
    })

    // db.transaction((db) => {
    //     for (let i = 0; i < amount; i++) {
    //         db.exec(`
    //         INSERT INTO cars (id, name, color_id)
    //         VALUES
    //         (${i}, 'skoda', 1)
    //         `)
    //     }
    // }).then(logTime)

    // const stmt1 = await db.prepare(`SELECT * FROM cars`);
    // const res = await stmt1.step();
    // if (res) {
    //     const x = await stmt1.all();
    //     console.log({
    //         x
    //     });
    // }

    // test pragma
    // await db.pragma('user_version=2')
    // const res = await db.pragma('user_version')
    // console.log({res})

    // // test pragma in transaction
    // const res = await db.transaction((db) => {
    //     db.pragma('user_version = 6')
    //     return db.pragma('user_version')
    // })
    // console.log({res})
})