import {
    extendClassMethods
} from "../helper";
import request from "../request";

/**
 * Statement finalization in the worker
 */
const registry = new FinalizationRegistry(({
    db,
    statementId
}) => {
    console.debug(`Bare SQLITE OPFS > Registry > cleanup statement ${statementId}`);
    request(db.worker, {
        func: 'statementCleanup',
        statementId: statementId,
    })
})

/**
 * ProxyStatement
 * Core lies in passing on the request including the statementId
 */
export class ProxyStatement {
    statementId;
    db;

    constructor(_db, _statementId, statementMethods) {
        this.db = _db;
        this.statementId = _statementId;

        // Register for statement finalization
        registry.register(this, {
            db: this.db,
            statementId: this.statementId
        });

        extendClassMethods(this, statementMethods, (prop) => async (...args) => {
            const message = {
                func: prop,
                statementId: this.statementId,
                args,
            };
            const result = await request(this.db.worker, message);

            const {
                statementId
            } = result;

            if (statementId) {
                if (statementId !== this.statementId) throw new Error("Bare Sqlite OPFS > Retrieved a different statement from the worker than expected")
                return this
            }
            return result
        })
    }
}