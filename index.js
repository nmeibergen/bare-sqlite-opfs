export default async (options = {
  wasmLocation: self.location.origin + "/sqlite3.wasm"
}) => {

  const {
    wasmLocation,
    ...workerOptions
  } = options;

  // Start the worker
  const worker = new Worker(new URL("./src/opfs-worker.js",
    import.meta.url), {
    type: "module",
    ...workerOptions
  });

  // The worker must be initiated with the location of the wasm file
  worker.postMessage({
    init: true,
    wasmLocation: new URL("./src/sqlite3.wasm",
      import.meta.url).href,
    asyncProxyLocation: new URL("./src/sqlite3-opfs-async-proxy.js",
      import.meta.url).href,
  })

  // Wait for the worker to be initiated and return proxyDB
  return new Promise(function (resolve) {
    worker.addEventListener('message', function ({
      data
    }) {
      if (data === "ready") {
        resolve(new ProxyDB(worker))
      } else {
        throw new Error("Bare sqlite OPFS > unexpected data retrieved after worker initiation; expected 'ready'.")
      }
    }, {
      once: true
    });
  });
}

class ProxyDB {

  worker;

  constructor(_worker) {
    this.worker = _worker;
  }

  async clear() {
    return await this.request({
      func: "clear",
    })
  }

  async initialize(filePath = "path/test.db") {
    console.log("Will init")
    return await this.request({
      func: "initialize",
      filePath,
    })
  }

  async affirmOpen() {
    return await this.request()
  }

  async exec(...args) {
    return await this.request({
      func: "exec",
      args
    })
  }

  request(message) {
    console.log({
      message
    })
    console.log(this.worker)
    const worker = this.worker;
    worker.postMessage(message);
    return new Promise(function (resolve) {
      worker.addEventListener('message', function ({
        data
      }) {
        console.log(data)
        resolve(data);
      }, {
        once: true
      });
    });
  }
}