import * as express from "express";
import * as bodyParser from "body-parser";
import { resolve } from "path";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";

const defaultDimensions = 3;
const port = 1050;
const database = `${__dirname}/database.txt`;

const static_path = resolve(__dirname, "../../static");
const content_path = (version: string) => resolve(__dirname, `../../src/html/${version}.html`);

const server = express();

server.use(express.static(static_path));
server.use(bodyParser.json({ limit: "10mb" }));
server.use(bodyParser.urlencoded({ extended: true }));

server.get("/", (_req, res) => {
    unlinkSync(database);
    res.redirect("/tic-tac-toe")
});

const fallback = "solution"; 
server.get("/tic-tac-toe/:version?", (req, res) => {
    let { version } = req.params; 
    if (!version || !["smart", "stencil", "solution"].includes(version = version.toLowerCase().trim())) {
        version = fallback
    }
    const path = content_path(version);
    res.sendFile(path);
});

/**
 * These are routers that allow the server to
 * retrieve and write out and store the dimensions
 * of the current game session.
 */

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

server.listen(port, () => console.log(`Server listening on port ${port}...`));
