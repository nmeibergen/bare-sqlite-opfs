/**
 * See [here](https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid)
 * @returns uuidv4
 */
export const uuidv4 = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

/**
 * See [here](https://stackoverflow.com/questions/8511281/check-if-a-value-is-an-object-in-javascript)
 * @param {*} value 
 * @returns 
 */
export const isObject = (value) => {
    if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        value !== null
    ) {
        return true
    }
    return false
}

/**
 * This serialisation is only valid for pure functions.
 * 
 * @param {(*) => any} func 
 * @returns string
 */
export const serialiseFunction = (func) => func.toString();

/**
 * This serialisation is only valid for pure functions.
 * 
 * @param {string} str
 * @returns {(*) => any} func
 */
export const deserialiseFunction = (str) => Function(`"use strict"; return (${str})`)();

/**
 * Create a list of all methods on an instance.
 * 
 * Used the code issued [here](https://flaviocopes.com/how-to-list-object-methods-javascript/)
 * 
 * @param {*} obj 
 * @returns {string[]} methodnames
 */
export const getMethods = (obj) => {
    let properties = new Set()
    let currentObj = obj
    do {
        Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
    } while ((currentObj = Object.getPrototypeOf(currentObj)))
    return [...properties.keys()].filter(item => typeof obj[item] === 'function')
}

/**
 * 
 * extend the instance of a class (toExtend) with the method props of another instance. 
 * This is very similar to class inheritance. 
 * The difference lies in the fact that the two instances still a completely separate. 
 * Trying to achieve the same using a proxy will trigger errors because the other 
 * instance will try to call the toExtend methods at lower levels.
 * 
 * @param {*} toExtend instance of a class
 * @param {*} other instance of another class or list of methods (string[])
 * @param {(prop) => any} customExtend any function that takes prop and evaluates to the prop to add to the instance
 * @returns {*} extended toExtend instance
 */
export const extendClassMethods = (toExtend, other, customExtend) => {

    const toExtendMethods = getMethods(toExtend);
    const otherMethods = Array.isArray(other) ? other : getMethods(other);

    otherMethods.forEach(prop => {
        if (!toExtendMethods.includes(prop)) {
            toExtend[prop] = customExtend ?
                customExtend(prop) :
                async function (...args) {
                    return other[prop](...args)
                }
        }
    })

    return toExtend
}

/**
 * Checks if the provided object a statement
 * 
 * @param {*} obj 
 * @returns {boolean} 
 */
export const objectIsStatement = (obj) => isObject(obj) && "columnCount" in obj