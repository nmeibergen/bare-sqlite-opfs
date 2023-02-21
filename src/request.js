"use strict";

import {
    uuidv4
} from "./helper";

/**
 * The request method exported makes sure that responses get correctly allocated to the correct 
 * request. Because we may be running multiple requests, it might happen that some request gets
 * handled before another, even though it was requested later. To account for this we create a 
 * responseMap that takes a unique id and attaches the corresponding resolve function.
 */

const RESPONSE_TIMEOUT = 10000;
const responseMap = new Map();
let listenerAdded = false;

const responseHandler = ({
    data
}) => {
    console.debug({
        data
    })
    if (data.error && data.error === true) {
        console.debug(`Bare SQLITE OPFS > error thrown in worker:`);
        console.debug(data);
        throw new Error('Bare SQLITE OPFS > error thrown in worker. Check the debug log for details');
    }

    const {
        id,
        result
    } = data;

    const resolveFunc = responseMap.get(id);

    if (resolveFunc) {
        resolveFunc(result);
        responseMap.delete(id);
    }
};

export default (worker, message) => {
    const requestId = uuidv4(); // Generate a unique identifier
    console.debug(`Request > ${requestId}`)

    // Include the messageId in the message payload
    const messageWithId = {
        id: requestId,
        message: message,
    };

    /**
     * @todo We might need to tweak this if we have multiple workers to listen to...
     */
    if (!listenerAdded) {
        console.debug(`Request > add listener (only happens on the first request)`)
        listenerAdded = true;
        worker.addEventListener('message', responseHandler);
    }

    const waitForResponse = () => {
        return new Promise(function (resolve) {
            responseMap.set(requestId, resolve);
        });
    };

    worker.postMessage(messageWithId);

    const responsePromise = Promise.race([
        waitForResponse(),
        new Promise(function (resolve, reject) {
            setTimeout(function () {
                responseMap.delete(requestId);
                reject(new Error('Bare SQLITE OPFS > request timed out'));
            }, RESPONSE_TIMEOUT);
        })
    ]);

    return responsePromise;
};