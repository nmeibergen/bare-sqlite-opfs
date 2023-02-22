import {
    requestListener
} from "../request.js";
import { handleRequest } from "./opfs-worker.js";

requestListener(handleRequest, postMessage);