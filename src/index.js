import { ProxySqlite3 } from "./main-thread/sqlite3";
import request from "./request";

export default async (options = {
    wasmLocation: self.location.origin + "/sqlite3.wasm"
}) => {

    const {
        wasmLocation,
        ...workerOptions
    } = options;

    // Start the worker
    const worker = new Worker(new URL("./opfs-worker/index.js",
        import.meta.url), {
        type: "module",
        ...workerOptions
    });

    const result = await request(worker, {
        func: "initialize",
        wasmLocation: new URL("./wasm/sqlite3.wasm",
            import.meta.url).href,
        asyncProxyLocation: new URL("./wasm/sqlite3-opfs-async-proxy.js",
            import.meta.url).href,
    })

    if (result) {
        return new ProxySqlite3(worker);
    } else {
        throw Error("Bare SQLITE OPFS > unable to start worker correctly.")
    }

}