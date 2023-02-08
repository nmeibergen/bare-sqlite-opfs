/** 
 * This is how to use this file
 */
// export const sqlite3Worker = () => {
//     return new Worker('<path-to-this-file>')
// }

class WorkerBuilder extends Worker {
    constructor(worker) {
      const code = worker.toString();
      const blob = new Blob([`(${code})()`]);
      return new Worker(URL.createObjectURL(blob));
    }
}

export default () => {}