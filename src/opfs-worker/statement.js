import { extendClassMethods, objectIsStatement } from "../helper";

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
                if(instance.pointer !== result.pointer){
                    throw Error("Retrieved an unexpected statement")
                }

                return instance
            }

            return result
        });
    }

    get pointer(){
        return this.statement.pointer
    }

    all(...args) {
        const result = []
        args.length > 0 && this.statement.bind(...cleanArgs(args));
        this.statement.reset(); // reset to make sure we really get all data
        while (this.statement.step()) {
            result.push(this.statement.get({}));
        }
        this.statement.finalize();
        return result;
    }

    /**
     * Only difference with regular bind is that we 'fix' the arguments provided to be 
     * ones and zeros in case booleans are provided. Very natural change
     * @param  {...any} args 
     */
    bind(...args) {
        return this.statement.bind(...cleanArgs(args));
    }

    run(...args) {
        args.length > 0 && this.statement.bind(...cleanArgs(args));
        this.statement.stepFinalize();
        return true
    }
}