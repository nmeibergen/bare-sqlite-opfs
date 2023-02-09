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
const worker = sqlite3Worker();
```

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

# API
To see the functionalities that this bare minimum build provides, simply check out the file `/src/opfs-worker.js`.

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