import {
    deserialiseFunction,
    isObject,
    uuidv4
} from "./helper.js";

/**
 * The initListener is needed to initialise the Sqlite files.
 * In particular it needs the location of the wasm file which
 * can only consistently be provided from outside the worker
 */
const initListener = addEventListener('message', async ({
    data
}) => {
    if (data.init) {
        self.wasmLocation = data.wasmLocation;
        self.asyncProxyLocation = data.asyncProxyLocation
        initWorker();
    }
}, {
    once: true
})

/**
 * Initialise the worker by importing the sqlite3.js file and defining the worker API
 */
const initWorker = () => {
    import("./sqlite3.js").then(async () => {

        let db;
        let statements = {};

        const sqlite3 = await sqlite3InitModule();
        if (sqlite3.capi.sqlite3_wasmfs_opfs_dir) {
            sqlite3.capi.sqlite3_wasmfs_opfs_dir();
        }

        const opfs = sqlite3.opfs;

        addEventListener('message', async ({
            data
        }) => {
            /**
             * @todo this sequence of if statements with returns is starting to suck to be honest...
             */
            console.debug(`Bare SQLITE OPFS worker retrieved data:`)
            console.debug(data)
            let result;

            if (!data || !data.func) {
                postMessage({
                    error: true,
                    message: "No (valid) data provided to the Sqlite OPFS worker",
                })
                throw new Error("")
            }

            /**
             * Initialize event
             */
            if (data.func === "initialize") {
                const result = initialize(data.filePath)
                postMessage(result);
                return;
            }

            /**
             * Clear event
             */
            if (data.func === "clear") {
                result = await clearOPFS();
                return;
            }

            /**
             * To proceed at least a database must have been initialized
             */
            if (!db) {
                postMessage({
                    error: true,
                    message: `Unable to process ${data.func} because no database has been initiated yet.`,
                })
                return;
            }

            /**
             * Prepare event
             */
            if (data.func === "prepare") {
                const result = await db[data.func](...data.args)

                // Add the statement to the statement reference array
                const id = uuidv4();
                statements[id] = result;

                postMessage({
                    statementId: id
                });
                return;
            }

            if (data.func === "transaction") {
                /**
                 * @todo check the existence of args[0]
                 */
                const callbackFunction = deserialiseFunction(data.args[0]);
                console.debug('Run transaction with callback:')
                console.debug(callbackFunction)
                const result = db.transaction(() => {
                    callbackFunction(db);
                });
                postMessage(result);
                return;
            }

            /**
             * Statement method call
             */
            if (data.statementId) {
                if (!(data.statementId in statements)) {
                    postMessage({
                        error: true,
                        message: `Bare SQLITE OPFS: Trying to execute statement with id '${statementId}', but it doesn't seem to exist anymore.`
                    })
                    return;
                }

                // Execute statement call
                const statement = statements[data.statementId];
                const result = await statement[data.func](...data.args);

                // check if the statement has been finalized
                if (!statement.pointer) {
                    console.debug(`Bare SQLITE OPFS: Will delete statement '${data.statementId}' from statement collection`);
                    delete statements[data.statementId];
                }

                // if the result is still the statement we update the statement 
                // columnCount is 'good' way of identifying if it is a statement
                if (isObject(result) && "columnCount" in result) {
                    postMessage({
                        statementId: data.statementId
                    })
                    return;
                }

                postMessage(result);
                return
            }

            try {
                console.debug(`Bare SQLITE OPFS: execute ${data.func} on database`)
                const result = await db[data.func](...data.args)
                postMessage(result);
            } catch (error) {
                postMessage({
                    error: true,
                    message: "Bare SQLITE OPFS: Unable to process request",
                    internalError: error
                })
                return
            }

            postMessage(result);
        });

        // on ready
        postMessage("ready");

        const initialize = (filePath) => {
            if (filePath) {
                db = new opfs.OpfsDb(filePath)
                return true
            } else {
                return new Error("Please provide a filepath")
            }
        }

        async function clearOPFS() {
            const rootDir = await navigator.storage.getDirectory();
            // @ts-ignore
            for await (const [name] of rootDir.entries()) {
                console.debug(`removing ${name}`);
                await rootDir.removeEntry(name, {
                    recursive: true
                }).catch(() => {});
            }
        }
    })
}