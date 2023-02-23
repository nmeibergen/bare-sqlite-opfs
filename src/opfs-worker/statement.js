import {
    extendClassMethods,
    objectIsStatement
} from "../helper";

const cleanArgs = (args) => args.map((value) => {
    if (typeof value === 'boolean') {
        return value ? 1 : 0
    }
    return value
})

export class WorkerStatement {

    statement;

    static init(_statement) {
        const instance = new WorkerStatement();
        instance.statement = _statement;

        // return extendClassMethods(instance, instance.statement);

        return extendClassMethods(instance, instance.statement, (prop) => (...args) => {
            const result = instance.statement[prop](...args);

            if (objectIsStatement(result)) {
                // Verify that pointers are the same
                if (instance.pointer !== result.pointer) {
                    throw Error("Retrieved an unexpected statement")
                }

                return instance
            }

            return result
        });
    }

    get pointer() {
        return this.statement.pointer
    }

    all(...bindArgs) {
        const result = []
        this.bind(...bindArgs);
        this.reset(); // reset to make sure we really get all data
        while (this.step()) {
            result.push(this.get({}));
        }
        this.finalize();
        return result;
    }

    /**
     * Only difference with regular bind is that we 'fix' the arguments provided to be 
     * ones and zeros in case booleans are provided. Very natural change
     * @param  {...any} args 
     */
    bind(...args) {
        console.debug("BIND WITH")
        console.debug({
            args
        })

        if (args.length === 1) {
            // pass the arg values array onto the cleaner and pass onto 'base' binder
            if (Array.isArray(args[0]) && args[0].length > 0) {
                return this.statement.bind(cleanArgs(args[0]))
            }
        } else if (args.length > 1) {
            // more args provided, then use the 'base' binder only
            return this.statement.bind(...args);
        }
    }

    /**
     * 'Simple' executor of a statement. Will return true or throw an error
     * 
     * @param  {...any} args evaluate parametrized query with these arguments
     * @returns {boolean}
     */
    run(...bindArgs) {
        bindArgs.length > 0 && this.bind(...bindArgs);
        this.stepFinalize();
        return true
    }
}