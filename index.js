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
      args,
    })
  }

  async prepare(...args) {
    const {
      statementId
    } = await this.request({
      func: "prepare",
      args,
    })
    const proxyStatement = new ProxyStatement(this, statementId);
    console.log({
      proxyStatement
    })
    return proxyStatement
  }

  /**
   * I think it is important to add something like a 'thread' id. such that when sending
   * the result back and we pass the thread id which can next be used on a piped process.
   * The piped process should then use the thread id and the request will only complete if the 
   * pipe id has the required id. Something along these lines...
   *  */
  request(message) {
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

/**
 * Statement finalization in the worker
 */
const registry = new FinalizationRegistry(({
  db,
  statementId
}) => {
  console.log(`Registry > cleanup for statement ${statementId}`);
  // finalize the statement
})

const props = ["step", "get"];

class ProxyStatement {
  statementId;
  db;

  constructor(_db, _statementId) {
    this.db = _db;
    this.statementId = _statementId;

    // Register for statement finalization
    registry.register(this, {
      db: this.db,
      statementId: this.statementId
    })
  }
}

props.forEach(prop => {
  ProxyStatement.prototype[prop] = async function (...args) {
    const message = {
      func: prop,
      statementId: this.statementId,
      args,
    }

    console.debug(`ProxyStatement will execute request:`)
    console.debug(message)
    return await this.db.request(message)
  }
})