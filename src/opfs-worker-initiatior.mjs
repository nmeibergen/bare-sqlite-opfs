export const sqlite3Worker = (url, options = {
    wasmLocation: self.location.origin + "/sqlite3.wasm"
}) => {

    const {
        wasmLocation,
        ...workerOptions
    } = options;
    
    const worker = new Worker(url, {
        type: "module",
        ...workerOptions
    });

    worker.postMessage({
        init: true,
        wasmLocation: wasmLocation,
    })


    return worker

}