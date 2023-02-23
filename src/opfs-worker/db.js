import {
    deserialiseFunction,
    extendClassMethods,
    objectIsStatement
} from "../helper";
import {
    WorkerStatement
} from "./statement";

export class WorkerDB {
    db;

    static init(sqlite3, filePath) {
        const instance = new WorkerDB();
        instance.db = new sqlite3.opfs.OpfsDb(filePath);

        return extendClassMethods(instance, instance.db, (prop) => (...args) => {
            const result = instance.db[prop](...args);

            if (objectIsStatement(result)) {
                const workerStatement = WorkerStatement.init(result);
                return workerStatement
            }

            return result
        });
    }

    transaction(...args) {
        /**
         * @todo check the existence of args[0]
         */
        const callbackFunction = deserialiseFunction(args[0]);
        const callbackArgs = args[1] || {};
        return this.db.transaction(() => callbackFunction(this, callbackArgs));
    }

    /**
     * This pragma function exists because the return of a 'regular' exec on PRAGMA might work just a little different then you'd expect.
     * In the end, this function also runs an exec, but with specific arguments.
     * 
     * If simply is set to true, only the value of the first column and row is returned
     * 
     * @param {*} query 
     * @param {simple: boolean} options 
     * @return {any} either an array of objects or a 'simple' single value
     */
    pragma(query, options = {
        simple: true
    }) {
        const res = this.db.exec({
            returnValue: "resultRows",
            sql: `PRAGMA ${query}`,
            rowMode: options.simple ? 'array' : 'object', // 'array' (default), 'object', or 'stmt'
            columnNames: []
        });

        if (options.simple) {
            return (res.length > 0 && res[0].length > 0 && res[0][0]) || null
        } else {
            return res
        }
    }
}