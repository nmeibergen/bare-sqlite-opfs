import {
    requestListener
} from "../request.js";
import { handleRequest } from "./sqlite3.js";

requestListener(handleRequest, postMessage);