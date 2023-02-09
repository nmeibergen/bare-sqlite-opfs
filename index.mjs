export default (options = {
  wasmLocation: self.location.origin + "/sqlite3.wasm"
}) => {

  const {
    wasmLocation,
    ...workerOptions
  } = options;

  const worker = new Worker(new URL("./src/opfs-worker.js", import.meta.url), {
    type: "module",
    ...workerOptions
  });

  worker.postMessage({
    init: true,
    wasmLocation: new URL("./src/sqlite3.wasm", import.meta.url).href,
  })


  return worker

}