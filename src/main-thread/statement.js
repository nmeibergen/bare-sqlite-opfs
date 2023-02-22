import request from "../request";

/**
 * Statement finalization in the worker
 */
const registry = new FinalizationRegistry(({
    db,
    statementId
}) => {
    console.debug(`Bare SQLITE OPFS > Registry > cleanup statement ${statementId}`);
    db.request({
        func: 'statementCleanup',
        statementId: statementId,
    })
})

export class ProxyStatement {
    statementId;
    db;

    constructor(_db, _statementId) {
        this.db = _db;
        this.statementId = _statementId;

        // Register for statement finalization
        registry.register(this, {
            db: this.db,
            statementId: this.statementId
        })
    }
}

/**
 * Set the 'pass-forward' props
 */
["step", "get", "bind", "all"].forEach(prop => {
    ProxyStatement.prototype[prop] = async function (...args) {
        const message = {
            func: prop,
            statementId: this.statementId,
            args,
        }

        console.debug(`Bare SQLITE OPFS > ProxyStatement will pass request to worker:`)
        console.debug(message)
        return await request(this.db.worker, message)
    }
})