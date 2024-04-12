"use strict";

// Default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || "development";

// var express = require("express"),
//   oldSocketio = require("919.socket.io"),
//   socketio = require("socket.io"),
//   WebSocket = require("ws"),
//   mongoose = require("mongoose");

import express from "express";
import oldSocketio from "919.socket.io";
import socketio from "socket.io";
import WebSocket from "ws";
import mongoose from "mongoose";

// var path = require("path"),
//   url = require("url"),
//   fs = require("fs");

import path from "path";
import url from "url";
import fs from "fs";
import https from "https";
import http from "http";

import systemCheck from "./app/others/system-check.js";

// Application Config
// var config = require(path.join(__dirname,'/config/config'));
import { config } from "./config/config.js";

// setup ES6 __dirname
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { serverSocketStartSIO } from "./app/controllers/server-socket.js";
import {
    serverSocketNewStartSIO,
    serverSocketNewStartSIOWebsocketOnly,
} from "./app/controllers/server-socket-new.js";
import { serverSocketWsStartSIO } from "./app/controllers/server-socket-ws.js";

// Connect to database
mongoose.Promise = global.Promise;

// mongoose.connect(config.mongo.uri, (error) => {
//     if (error) {
//         console.log("********************************************");
//         console.log("*          MongoDB Process not running     *");
//         console.log("********************************************\n");

//         process.exit(1);
//     }
// });

// async function connectToMongoDB() {
//     try {
//         await new Promise((resolve, reject) => {
//             mongoose.connect(config.mongo.uri, (error) => {
//                 if (error) {
//                     console.log("********************************************");
//                     console.log("*          MongoDB Process not running     *");
//                     console.log(
//                         "********************************************\n"
//                     );
//                     reject(error);
//                 } else {
//                     resolve();
//                 }
//             });
//         });
//         console.log("MongoDB connected successfully");
//     } catch (error) {
//         console.error("Error connecting to MongoDB:", error);
//         process.exit(1);
//     }
// }

const connectToMongoDB = async () => {
    try {
        await mongoose.connect(config.mongo.uri);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.log("********************************************");
        console.log("*          MongoDB Process not running     *");
        console.log("********************************************\n");
    }
};

connectToMongoDB();

//create docker directories if needed
const createDirectory = async (dirPath) => {
    try {
        await fs.promises.mkdir(dirPath);
    } catch (error) {
        if (error.code != "EEXIST") {
            console.log("Error creating logs directory ", error.code);
        }
    }
};

createDirectory(config.releasesDir);
createDirectory(config.licenseDir);
createDirectory(config.syncDir);
createDirectory(config.thumbnailDir);

// fs.promises.mkdir(config.releasesDir, (err) => {
//     if (err && err.code != "EEXIST") {
//         console.log("Error creating logs directory, " + err.code);
//     }
// });
// fs.mkdir(config.licenseDir, (err) => {
//     if (err && err.code != "EEXIST") {
//         console.log("Error creating logs directory, " + err.code);
//     }
// });
// fs.mkdir(config.syncDir, (err) => {
//     if (err && err.code != "EEXIST") {
//         console.log("Error creating logs directory, " + err.code);
//     }
// });
// fs.mkdir(config.thumbnailDir, (err) => {
//     if (err && err.code != "EEXIST") {
//         console.log("Error creating logs directory, " + err.code);
//     }
// });

// check system
// require("./app/others/system-check")();

systemCheck();

// Bootstrap models
// let modelsPath = path.join(__dirname, "app/models");

// fs.readdirSync(modelsPath).forEach(async (file) => {
//     await import(path.join(modelsPath, file));
// });

const importModels = async () => {
    const modelsPath = path.join(__dirname, "app/models");

    try {
        const files = await fs.promises.readdir(modelsPath);
        for (const file of files) {
            const filePath = path.join(modelsPath, file);
            await import(filePath);
        }
    } catch (error) {
        console.log("Error importing models", error);
        throw error;
    }
};

(async () => {
    try {
        await importModels();
        console.log("Models imported successfully");
    } catch (error) {
        console.error("Error importing models:", error);
        process.exit(1);
    }
})();

console.log(
    "********************************************************************"
);
console.log(
    "*    After update if you do not see your groups, please change     *"
);
console.log(
    '*    change the uri variable to "mongodb://localhost/pisignage-dev"*'
);
console.log(
    "*    in config/env/development.js and restart the server           *"
);
console.log(
    "******************************************************************\n"
);

let app = express();

// Express settings
import expressConfig from "./config/express.js";
expressConfig(app);
// require("./config/express")(app);

// Start server
let server;
if (config.https) {
    let https_options = {
        key: fs.readFileSync("./pisignage-server-key.pem"),
        cert: fs.readFileSync("./pisignage-server-cert.pem"),
        passphrase: "pisignage",
    };
    server = https.createServer(https_options, app);
} else {
    server = http.createServer(app);
}

let io = oldSocketio.listen(server, { "destroy upgrade": false });
let ioNew = socketio(server, {
    path: "/newsocket.io",
    serveClient: true,
    // below are engine.IO options
    pingInterval: 45000,
    pingTimeout: 45000,
    upgradeTimeout: 60000,
    maxHttpBufferSize: 10e7,
});

let ioNewWebsocketOnly = socketio(server, {
    path: "/wssocket.io",
    serveClient: true,
    // below are engine.IO options
    pingInterval: 45000,
    pingTimeout: 180000,
    upgradeTimeout: 180000,
    maxHttpBufferSize: 10e7,
});

//Bootstrap socket.io
// require("./app/controllers/server-socket").startSIO(io);
// require("./app/controllers/server-socket-new").startSIO(ioNew);
// require("./app/controllers/server-socket-new").startSIOWebsocketOnly(
//     ioNewWebsocketOnly
// );

serverSocketStartSIO(io);
serverSocketNewStartSIO(ioNew);
serverSocketNewStartSIOWebsocketOnly(ioNewWebsocketOnly);

var wss = new WebSocket.Server({ server: server, path: "/websocket" });
// require("./app/controllers/server-socket-ws").startSIO(wss);
serverSocketWsStartSIO(wss);
server.on("upgrade", function upgrade(request, socket, head) {
    let pathname = url.parse(request.url).pathname;
    if (pathname === "/WebSocket") {
        wss.handleUpgrade(request, socket, head, function done(ws) {
            wss.emit("connection", ws, request);
        });
    }
});

// require("./app/controllers/scheduler");
import "./app/controllers/scheduler.js";

server.listen(config.port, () => {
    console.log(
        "Express server listening on port %d in %s mode",
        config.port,
        app.get("env")
    );
});

server.on("connection", (socket) => {
    // 60 minutes timeout
    socket.setTimeout(3600000);
});
server.on("error", (err) => {
    console.log("caught ECONNRESET error 1");
    console.log(err);
});
io.on("error", (err) => {
    console.log("caught ECONNRESET error 2");
    console.log(err);
});
io.sockets.on("error", (err) => {
    console.log("caught ECONNRESET error 3");
    console.log(err);
});
ioNew.on("error", (err) => {
    console.log("caught ECONNRESET error 4");
    console.log(err);
});
ioNew.sockets.on("error", (err) => {
    console.log("caught ECONNRESET error 5");
    console.log(err);
});
process.on("uncaughtException", (err, origin) => {
    fs.writeSync(
        process.stderr.fd,
        "***WARNING***  Caught exception: " +
            err +
            ", Exception origin: " +
            origin +
            "*******\n"
    );
});

// Expose app
// module.exports = app;

export default app;
