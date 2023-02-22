import {
  serialiseFunction,
} from "./src/helper";
import request from "./src/request";

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

  const result = await request(worker, {
    init: true,
    wasmLocation: new URL("./src/sqlite3.wasm",
      import.meta.url).href,
    asyncProxyLocation: new URL("./src/sqlite3-opfs-async-proxy.js",
      import.meta.url).href,
  })

  if (result) {
    return new ProxySqlite3(worker);
  } else {
    throw Error("Bare SQLITE OPFS > unable to start worker correctly.")
  }

}

class ProxySqlite3 {
  worker;

  constructor(_worker) {
    this.worker = _worker;
  }

  async clear(dbPath) {
    return await request(this.worker, {
      func: "clear",
      dbPath,
    })
  }

  async initializeDB(filePath) {
    const initialized = await request(this.worker, {
      func: "initialize",
      filePath,
    })

    if (initialized) {
      return new ProxyDB(this.worker);
    } else {
      throw Error("Bare SQLITE OPFS > Unable to start database")
    }
  }
}

/**
 * Currently we only allow for a single database to be created!
 */
class ProxyDB {

  worker;

  constructor(_worker) {
    this.worker = _worker;
  }

  /**
   * Below are 'custom' methods only. Methods that require some custom approach in order
   * for them to function as expected in the worker
   */

  /**
   *  
   * @param {(db) => void} callback where db methods are no longer asynchronous
   * @param {{[k as string]: integer | string}} vars must be 'simple' object of variables
   */
  async transaction(callback, vars) {
    // var serialize = require('');
    // const ser = serialize(callback);
    // console.log({ser})

    return await request(
      this.worker, {
        func: "transaction",
        args: [
          serialiseFunction(callback),
          vars,
        ]
      })
  }

  async prepare(...args) {
    const {
      statementId
    } = await request(
      this.worker, {
        func: "prepare",
        args,
      })
    const proxyStatement = new ProxyStatement(this, statementId);
    return proxyStatement
  }


}

/**
 * Set the 'pass-forward' props
 */
["exec", "get"].forEach(prop => {
  ProxyDB.prototype[prop] = async function (...args) {
    const message = {
      func: prop,
      args,
    }

    console.debug(`Bare SQLITE OPFS > ProxyDB will pass request to worker:`)
    console.debug(message)
    return await request(this.worker, message)
  }
})

/**
 * Statement finalization in the worker
 */
const registry = new FinalizationRegistry(({
  db,
  statementId
}) => {
  console.debug(`Bare SQLITE OPFS > Registry > cleanup statement ${statementId}`);
  db.request({
    func: 'statementCleanup',
    statementId: statementId,
  })
})

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

/**
 * Set the 'pass-forward' props
 */
["step", "get", "bind", "all"].forEach(prop => {
  ProxyStatement.prototype[prop] = async function (...args) {
    const message = {
      func: prop,
      statementId: this.statementId,
      args,
    }

    console.debug(`Bare SQLITE OPFS > ProxyStatement will pass request to worker:`)
    console.debug(message)
    return await request(this.db.worker, message)
  }
})