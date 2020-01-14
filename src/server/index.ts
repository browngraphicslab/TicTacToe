import * as express from "express";
import * as bodyParser from "body-parser";
import { resolve } from "path";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";

const defaultDimensions = 3;
const port = 1050;
const database = `${__dirname}/database.txt`;

const static_path = resolve(__dirname, "../../static");
const content_path = resolve(__dirname, "../../src/index.html");

const server = express();

server.use(express.static(static_path));
server.use(bodyParser.json({ limit: "10mb" }));
server.use(bodyParser.urlencoded({ extended: true }));

console.log(`Server listening on port ${port}...`);

server.get("/dimensions", (_req, res) => {
    let dimensions: number;
    if (existsSync(database)) {
        dimensions = JSON.parse(readFileSync(database, 'utf8')).dimensions;
    } else {
        writeFileSync(database, JSON.stringify({ dimensions: defaultDimensions }));
        dimensions = defaultDimensions;
    }
    res.send({ dimensions });
});

server.post("/dimensions", (req, res) => {
    const { dimensions } = req.body;
    writeFileSync(database, JSON.stringify({ ...JSON.parse(readFileSync(database, 'utf8')), dimensions }));
    res.send();
});

server.get("/", (_req, res) => {
    unlinkSync(database);
    res.redirect("/tic-tac-toe")
});
server.get("/tic-tac-toe", (_req, res) => {
    res.sendFile(content_path);
});

server.listen(port);
