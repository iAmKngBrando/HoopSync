import { createServer } from "node:http";
import { loadConfig } from "./config.js";
import { createFriendsServer } from "./server.js";

const config = loadConfig();

const httpServer = createServer();
createFriendsServer(httpServer);

httpServer.listen(config.port, "0.0.0.0", () => {
  console.log(`HoopSync Friends session manager listening: ws://<host>:${config.port}/friends`);
});
