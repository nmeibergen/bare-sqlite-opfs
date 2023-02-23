import {
    extendClassMethods,
    isObject,
    serialiseFunction
} from "../helper";
import request from "../request";
import {
    ProxyStatement
} from "./statement"

/**
 * Currently we only allow for a single database to be created!
 */
export class ProxyDB {

    worker;

    /**
     * 
     * @param {*} _worker 
     * @param {*} workerMethods We pass the worker methods onto this local DB in order to be able to call it as a method
     */
    constructor(_worker, workerMethods) {
        this.worker = _worker;

        extendClassMethods(this, workerMethods, (prop) => async (...args) => {
            const message = {
                func: prop,
                args,
            };

            const result = await request(this.worker, message);

            if (isObject(result)) {
                const {
                    statementId,
                    statementMethods,
                } = result;

                /**
                 * If the result contains a statementId, we know a statement was created in the worker
                 * Return a proxyStatement instead
                 * */
                if (statementId) {
                    const proxyStatement = new ProxyStatement(this, statementId, statementMethods);
                    return proxyStatement
                }
            }

            return result
        })
    }

    /**
     *  
     * @param {(db) => void} callback where db methods are no longer asynchronous
     * @param {{[k as string]: integer | string}} vars must be 'simple' object of variables
     */
    async transaction(callback, vars) {
        return await request(
            this.worker, {
                func: "transaction",
                args: [
                    serialiseFunction(callback),
                    vars,
                ]
            })
    }
}