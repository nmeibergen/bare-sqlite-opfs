import {
  serialiseFunction
} from "./src/helper";

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

  if (result === "ready") {
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

  async clear() {
    return await request(this.worker, {
      func: "clear",
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
   */
  async transaction(callback) {
    return await request(
      this.worker, {
        func: "transaction",
        args: [
          serialiseFunction(callback)
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
["step", "get"].forEach(prop => {
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

/**
 * @todo 
 * @important
 * 
 * What we need here is the following:
 * It might happen, due to its async nature, suppose we send two postMessages, where the first one is slow and the second one fast.
 * The second post has been send while the first is till waiting. Because the second is so fast, it completes before the first at 
 * worker side. Now the worker sends back the result and first sender might retrieve the result. And thus we have very strange 
 * behavior from the client perspective. We thus need to make sure that the message we retrieve is always the one that belongs 
 * to the waiting sender.
 * 
 * We can fix this by for example: creating a 'global' promise that lets each sub promise know when it is done. Where the 'global' 
 * promiser keeps track of all requests and thereby is able to inform all sub promises.
 * 
 *  */
const request = (worker, message) => {
  worker.postMessage(message);
  return new Promise(function (resolve) {
    worker.addEventListener('message', function ({
      data
    }) {
      if (data &&
        data.error &&
        data.error === true) {
        console.debug(`Bare SQLITE OPFS > error thrown in worker:`);
        console.debug(data);
        throw new Error('Bare SQLITE OPFS > error thrown in worker. Check the debug log for details');
      }
      resolve(data);
    }, {
      once: true
    });
  });
}