# Bare Sqlite OPFS 
This is a bare minimum package to run Sqlite with OPFS in a worker.

# Usage
To initiate the worker simply do the following:

```
// Retrieve the worker initiator function
import {
    sqlite3Worker
} from '<path-to-this-package>'

// Start the worker
const sqlite3 = await sqlite3Worker();

// initialise the database
const db = await sqlite3.initializeDB("path/to/db.db");

// Run your favourite sqlite3 functions on db, like...
await db.exec(...)
const stmt = await db.prepare(...)
await stmt.step()
const res = await stmt.get(0)
await db.transaction((db) => {
    db.exec(...)
})
```

Currently you can only create 1 database per worker. This might change in the future.

You must set additional headers as described [here](https://sqlite.org/wasm/doc/trunk/persistence.md) on the Sqlite wasm page.
For Create React App this can be done using the approach described [here](https://create-react-app.dev/docs/proxying-api-requests-in-development/#configuring-the-proxy-manually). Do the following: 
1. Run `yarn add http-proxy-middleware`
2. Create the file `src/setupProxy.js` and copy/paste the following:

```
module.exports = function (app) {
    app.use(function (req, res, next) {
        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        next();
    });
};
```

Note however that if you create a build version of your app, you might need to setup these headers in a different way.

# API
The follows the exect same as can be found for the official Sqlite Object Oriented (OO) API, found [here](https://sqlite.org/wasm/doc/trunk/api-oo1.md#db-transaction). The only difference can be found in 
1. initialising the database, as seen in the above example; and 
2. the fact that every method call is done asynchronous, so you will always have to do `await` if you are interested in waiting for the result; and
3. the transaction callback to take the db function as argument. In the callback you no longer have to `await` anything because all calls are executed in the worker, meaning its simply following the exact API from the original Sqlite OO docs. Note that the callback **must** be a pure function! This is something we are trying to take care of.

# Running the demo
Simply run `yarn start` and go to `localhost:8000/demo`.

# Sqlite3 base files adaptations
This project is based on a couple of files that are directly downloaded from Sqlite.org. These are 

* sqlite3-opfs-async-proxy: left in its original state
* sqlite3.js: adapted for the purpose of this project. All changes are identifiable with the 'tag' `@NM` in the code. Adaptions merely consist of 
    1. setting the `sqlite3.wasm` location (check the function `locateFile`); and 
    2. setting the location of sqlite3 opfs async proxy file, search for the place where `self.asyncProxyLocation` is used to set the defaultProxy; and
    3. adding `sqlite3InitModule` to `self` such that it is reachable in the workers scope


These two files can directly be found the donwloadable zip found [here](https://sqlite.org/wasm/uv/snapshot.html).

# Testing
Yep, no testing yet. It sucks, but it will come shortly!