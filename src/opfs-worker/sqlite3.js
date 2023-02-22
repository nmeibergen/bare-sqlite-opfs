import {
    getMethods,
    isObject,
    objectIsStatement,
    uuidv4,
} from "../helper.js";
import {
    WorkerDB
} from "./db.js";
import {
    WorkerStatement
} from "./statement.js";

let sqlite3;
let db;
let statements = new Map();

const initSqlite = async (wasmLocation, asyncProxyLocation) => {
    self.wasmLocation = wasmLocation;
    self.asyncProxyLocation = asyncProxyLocation;

    await import("../wasm/sqlite3.js")

    sqlite3 = await sqlite3InitModule();
    if (sqlite3.capi.sqlite3_wasmfs_opfs_dir) {
        sqlite3.capi.sqlite3_wasmfs_opfs_dir();
    }

    return true
}

export const handleRequest = async (data) => {

    if (!data || !data.func) {
        throw new Error("No (valid) data provided to the Sqlite OPFS worker");
    }

    if (data.func === "initialize") {
        return await initSqlite(data.wasmLocation, data.asyncProxyLocation);
    }

    /**
     * @todo
     * It might come in handy to have a clear layer between creating logic and sending a message pack to the main-thread.
     */

    /**
     * InitializeDB event
     */
    if (data.func === "initializeDB") {
        db = WorkerDB.init(sqlite3, data.filePath);
        return {
            initialized: true,
            dbMethods: getMethods(db),
        }
    }

    /**
     * Clear event
     */
    if (data.func === "clear") {
        return await clear(data.dbPath);
    }

    /**
     * Statement cleanup event
     */
    if (data.func === "statementCleanup") {
        if (!data.statementId)
            throw new Error(`Bare SQLITE OPFS > running function statementCleanup but no statementID provided, not sure what to cleanup`);

        /**
         * Finalize and remove the statement because it is no longer needed
         */
        const statementToFinalize = statements.get(data.statementId);
        if (statementToFinalize) {
            statementToFinalize.finalize();
            statements.delete(data.statementId);
        }
        return;
    }

    /**
     * To proceed at least a database must have been initialized
     */
    if (!db) {
        throw new Error(`Unable to process ${data.func} because no database has been initiated yet.`);
    }

    /**
     * Statement method call
     */
    if (data.statementId) {
        console.debug(`Bare SQLITE OPFS > statement execution of '${data.func}', with args:`)
        console.debug(data.args)

        // Get the statement
        const statement = statements.get(data.statementId);
        console.log("Statement before")
        console.log({
            statement
        })
        if (!statement) {
            throw new Error(`Bare SQLITE OPFS > Trying to execute statement with id '${data.statementId}', but it doesn't seem to exist anymore.`)
        }

        // Execute statement call
        const result = await statement[data.func](...data.args);
        console.log("Statement after")
        console.log({
            statement
        })
        // check if the statement has been finalized
        if (!statement.pointer) {
            console.debug(`Bare SQLITE OPFS > Will delete statement '${data.statementId}' from statement collection`);
            statements.delete(data.statementId);
        }

        // check if the statement has been updated, then update statement
        // The pointer of the new and old statement are exactly the same - it makes sense to only keep a reference to the last in our map.
        if (objectIsStatement(result)) {
            return {
                statementId: data.statementId
            };
        }

        return result;
    }

    console.debug(`Bare SQLITE OPFS > perform '${data.func}' on database`)
    const result = await db[data.func](...data.args);

    /**
     * If the result is a statement we 
     * 1. initiate a new statement 
     * 2. send back the statementId
     */
    if (objectIsStatement(result)) {
        const workerStatement = WorkerStatement.init(result);

        // Add the statement to the statement reference array
        const id = uuidv4();
        statements.set(id, workerStatement);

        return {
            statementId: id,
            statementMethods: getMethods(workerStatement),
        };
    }

    return result
}

/**
 * @todo make this more granular by allowing to delete only a single database for example. 
 * Use the Google docs [here](https://developer.chrome.com/articles/file-system-access/)
 */
async function clear() {
    const rootDir = await navigator.storage.getDirectory();
    // @ts-ignore
    for await (const [name] of rootDir.entries()) {
        await rootDir.removeEntry(name, {
            recursive: true
        }).catch(() => {});
    }
}