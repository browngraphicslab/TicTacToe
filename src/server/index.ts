import * as express from "express";
import { resolve } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";

const port = 1050;
const database = `${__dirname}/dimensions.txt`;

const static_path = resolve(__dirname, "../../static");
const content_path = resolve(__dirname, "../../src/index.html");

const server = express();

server.use(express.static(static_path));

console.log(`Server listening on port ${port}...`);

server.get("/", (_req, res) => res.redirect("/tic-tac-toe"));
server.get("/tic-tac-toe", (_req, res) => {
    res.sendFile(content_path);
});

server.listen(port);
