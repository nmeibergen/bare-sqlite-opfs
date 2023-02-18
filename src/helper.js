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