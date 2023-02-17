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
        const sqlite3 = await sqlite3InitModule();
        if (sqlite3.capi.sqlite3_wasmfs_opfs_dir) {
            sqlite3.capi.sqlite3_wasmfs_opfs_dir();
        }

        const opfs = sqlite3.opfs;

        addEventListener('message', async ({
            data
        }) => {
            let result;

            if (!data || !data.func) {
                postMessage({
                    error: true,
                    message: "No (valid) data provided to the Sqlite OPFS worker",
                })
                throw new Error("")
            }

            if (data.func === "initialize") {
                const result = initialize(data.filePath)
                postMessage(result);
                return;
            }

            if (data.func === "clear") {
                result = await clearOPFS();
                return;
            }

            if (!db) {
                postMessage({
                    error: true,
                    message: `Unable to process ${data.func} because no database has been initiated yet.`,
                })
            }

            try {
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