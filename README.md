# Bare Sqlite OPFS 
This is a bare minimum package to run Sqlite with OPFS in a worker.

# Usage
To initiate the worker simply do the following:

```
// Retrieve the worker initiator function
import {
    sqlite3Worker
} from '<path-to-this-package>/src/opfs-worker-initiatior.mjs'

// Start the worker
const worker = sqlite3Worker("<path-to-this-package>/src/opfs-worker.js", {
    // You must place the wasm file somehwere that makes sense to your project
    wasmLocation: <location-of-the-wasm-file>
});
```

The location of `sqlite3.wasm` depends on your project settings. In the background the `fetch` function is used to retrieve the `wasm` file. 
If for example you are coming from a Create React App (webpack based) then you might place `sqlite3.wasm` in your public folder and simply set the `<location-of-the-wasm-file>` to `${window.location.origin}/sqlite3.wasm`.

# API
To see the functionalities that this bare minimum build provides, simply check out the file `/src/opfs-worker.js`.

# Running the demo
Simply run `yarn start` and go to `localhost:8000/demo`.

# Sqlite3 base files adaptations
This project is based on a couple of files that are directly downloaded from Sqlite.org. These are 

* sqlite3-opfs-async-proxy: left in its original state
* sqlite3.js: adapted for the purpose of this project. All changes are identifiable with the 'tag' `@NM` in the code. Adaptions merely consist of 
    1. setting the `sqlite3.wasm` location (check the function `locateFile`); and 
    2. adding `sqlite3InitModule` to `self` such that it is reachable in the workers scope


These two files can directly be found the donwloadable zip found [here](https://sqlite.org/wasm/uv/snapshot.html).