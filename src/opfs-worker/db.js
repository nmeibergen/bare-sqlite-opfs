import { extendClassMethods } from "../helper";
import { WorkerStatement } from "./statement";


export class WorkerDB {
    db;

    static init(sqlite3, filePath) {
        const instance = new WorkerDB();
        instance.db = new sqlite3.opfs.OpfsDb(filePath);

        return extendClassMethods(instance, instance.db);
    }

    transaction(...args) {
        /**
         * @todo check the existence of args[0]
         */
        const callbackFunction = deserialiseFunction(args[0]);
        const callbackArgs = args[1] || {};
        console.debug('Run transaction with callback:');
        console.debug(callbackFunction)
        return this.db.transaction(() => {
            callbackFunction(this.db, callbackArgs);
        });
    }
}