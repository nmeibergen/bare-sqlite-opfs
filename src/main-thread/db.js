import {
    extendClassMethods, serialiseFunction
} from "../helper";
import request from "../request";
import { ProxyStatement } from "./statement"

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
            return await request(this.worker, message);
        })
    }

    /**
     *  
     * @param {(db) => void} callback where db methods are no longer asynchronous
     * @param {{[k as string]: integer | string}} vars must be 'simple' object of variables
     */
    async transaction(callback, vars) {
        // var serialize = require('');
        // const ser = serialize(callback);
        // console.log({ser})

        return await request(
            this.worker, {
                func: "transaction",
                args: [
                    serialiseFunction(callback),
                    vars,
                ]
            })
    }

    async prepare(...args) {
        const {
            statementId
        } = await request(
            this.worker, {
                func: "prepare",
                args,
            })
        const proxyStatement = new ProxyStatement(this, statementId);
        return proxyStatement
    }


}

/**
 * Set the 'pass-forward' props
 */
["exec", "get"].forEach(prop => {
    ProxyDB.prototype[prop] = async function (...args) {
        const message = {
            func: prop,
            args,
        }

        console.debug(`Bare SQLITE OPFS > ProxyDB will pass request to worker:`)
        console.debug(message)
        return await request(this.worker, message)
    }
})