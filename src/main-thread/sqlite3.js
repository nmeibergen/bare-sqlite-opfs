import request from "../request";
import { ProxyDB } from "./db";
  
export class ProxySqlite3 {
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
    const result = await request(this.worker, {
      func: "initializeDB",
      filePath,
    })

    if (result && result.initialized) {
      return new ProxyDB(this.worker, result.dbMethods);
    } else {
      throw Error("Bare SQLITE OPFS > Unable to start database")
    }
  }
}



