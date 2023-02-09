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
        initWorker();
        removeListener();
    }
})

/**
 * Remove the listener directly after initiation
 */
const removeListener = () => {
    removeEventListener('message', initListener)
}

/**
 * Initialise the worker by importing the sqlite3.js file and defining the worker API
 */
const initWorker = () => {
    import("./sqlite3.js").then(async () => {
        let db;
        const sqlite3 = await sqlite3InitModule();
        if (sqlite3.capi.sqlite3_wasmfs_opfs_dir) {
            sqlite3.capi.sqlite3_wasmfs_opfs_dir();
        }

        const opfs = sqlite3.opfs;

        addEventListener('message', async ({
            data
        }) => {
            let result;
            switch (data && data.f) {
                case 'initialize':
                    result = initialize(data.filePath);
                    break;
                case 'statement':
                    result = await stmt(data.statement);
                    break;
                case 'exec':
                    const cols = [];
                    result = await db.exec({
                        returnValue: "resultRows",
                        sql: data.statement,
                        rowMode: 'object', // 'array' (default), 'object', or 'stmt'
                        columnNames: cols
                    });
                    // result.unshift(cols);
                    break;
                case 'finalize':
                    result = await finalize();
                    break;
                case 'clear':
                    result = await clearOPFS();
                    break;
                default:
                    throw new Error(`unrecognized request '${data.f}'`);
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