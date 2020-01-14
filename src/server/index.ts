import * as express from "express";
import * as bodyParser from "body-parser";
import { resolve } from "path";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";

const defaultDimensions = 3;
const port = 1050;
const database = `${__dirname}/database.txt`; // not a real database :)

const static_path = resolve(__dirname, "../../static");
const content_path = (version: string) => resolve(__dirname, `../../src/html/${version}.html`);

const server = express();

server.use(express.static(static_path));
server.use(bodyParser.json({ limit: "10mb" }));
server.use(bodyParser.urlencoded({ extended: true }));

if (!existsSync(database)) {
    cleanDatabase();    
}

function cleanDatabase() {
    writeFileSync(database, JSON.stringify({
        dimensions: defaultDimensions,
        record: {
            x: 0,
            o: 0,
            none: 0,
        }
    }));
}

server.get("/", (_req, res) => {
    cleanDatabase();
    res.redirect("/tic-tac-toe")
});

const fallback = "solution"; 
server.get("/tic-tac-toe/:version?", (req, res) => {
    let { version } = req.params;
    if (version) {
        if (!["stateful", "stencil", "solution"].includes(version = version.toLowerCase().trim())) {
            return res.redirect("/tic-tac-toe");
        }
    } else {
        version = fallback;
    }
    const path = content_path(version);
    res.sendFile(path);
});

/**
 * These are routers that allow the server to
 * retrieve and write out and store the dimensions
 * of the current game session.
 */

// reads the stored dimensions
server.get("/dimensions", (_req, res) => {
    res.send({ dimensions: JSON.parse(readFileSync(database, 'utf8')).dimensions });
});

// writes the updated dimensions
server.post("/state", (req, res) => {
    writeFileSync(database, JSON.stringify({ ...JSON.parse(readFileSync(database, 'utf8')), ...req.body }));
    res.send();
});

server.post("/winner", (req, res) => {
    const { winner } = req.body;
    const state = JSON.parse(readFileSync(database, 'utf8'));
    const total = Number(state.record[winner]);
    state.record[winner] = total + 1;
    writeFileSync(database, JSON.stringify(state));
    res.send();
});

server.listen(port, () => console.log(`Server listening on port ${port}...`));
