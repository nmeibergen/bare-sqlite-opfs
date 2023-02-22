import { extendClassMethods } from "../helper";

export class WorkerStatement {

    statement;

    init(_statement) {
        const instance = new WorkerStatement();
        instance.statement = _statement;

        return extendClassMethods(instance, instance.statement);
    }

    all() {
        const result = []
        this.statement.reset(); // reset to make sure we really get all data
        while (this.statement.step()) {
            result.push(this.statement.get({}));
        }
        return result;
    }

    /**
     * Only difference with regular bind is that we 'fix' the arguments provided to be 
     * ones and zeros in case booleans are provided. Very natural change
     * @param  {...any} args 
     */
    bind(...args) {
        const newArgs = args.map((value) => {
            if (typeof value === 'boolean') {
                return value ? 1 : 0
            }
            return value
        })
        this.statement.bind(...newArgs);
    }
}