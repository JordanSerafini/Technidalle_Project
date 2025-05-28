#!/usr/bin/env node
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var readline_1 = require("readline");
var pg_1 = require("pg");
var rl = (0, readline_1.createInterface)({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});
var clients = {
    main: new pg_1.Client({
        host: "localhost",
        port: 5432,
        user: "postgres",
        password: "postgres",
        database: "postgres",
    }),
    sync: new pg_1.Client({
        host: "localhost",
        port: 5433,
        user: "sync_user",
        password: "sync_password",
        database: "sync_db",
    }),
};
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var dbErr_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, clients.main.connect()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, clients.sync.connect()];
                case 2:
                    _a.sent();
                    console.error("Databases connected.");
                    return [3 /*break*/, 4];
                case 3:
                    dbErr_1 = _a.sent();
                    console.error("Database connection error:", dbErr_1);
                    return [3 /*break*/, 4];
                case 4:
                    rl.on("line", function (line) { return __awaiter(_this, void 0, void 0, function () {
                        var message, id, method, params, toolName, toolArgs, result, error, res, res, execErr_1, errorMessage, err_1, errorMessage;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 14, , 15]);
                                    message = JSON.parse(line);
                                    id = message.id; // Get id *after* parsing
                                    // Log the raw received message for debugging
                                    console.error("Received message:", JSON.stringify(message));
                                    method = message.method, params = message.params;
                                    if (!(method === "initialize")) return [3 /*break*/, 1];
                                    console.error("Received initialize message."); // Log specifically for initialize
                                    // Répondre au message d'initialisation selon le protocole MCP
                                    // La réponse à 'initialize' devrait renvoyer les 'capabilities'.
                                    // Le protocole JSON-RPC 2.0 standard attend aussi "jsonrpc": "2.0" et l'id de la requête.
                                    if (id !== undefined) { // Ensure we have an id to respond
                                        console.log(JSON.stringify({
                                            jsonrpc: "2.0", // Specify JSON-RPC version
                                            id: id, // Echo back the original request ID
                                            result: {
                                                capabilities: {
                                                    executeTool: {},
                                                    getManifest: {}
                                                }
                                            }
                                        }));
                                        console.error("Sent initialize response (capabilities)."); // Log pour le débogage
                                    }
                                    else {
                                        console.error("Received initialize message without an ID. Cannot respond.");
                                    }
                                    return [3 /*break*/, 13];
                                case 1:
                                    if (!(method === "initialized")) return [3 /*break*/, 2];
                                    // Handle the 'initialized' notification from the client (Cursor)
                                    console.error("Received 'initialized' notification from client.");
                                    return [3 /*break*/, 13];
                                case 2:
                                    if (!(method === "getManifest")) return [3 /*break*/, 3];
                                    // Répondre à la demande du manifeste des outils
                                    // Respond using JSON-RPC 2.0 format
                                    if (id !== undefined) {
                                        respond(id, {
                                            tools: [
                                                {
                                                    name: "getMainProjects",
                                                    description: "Récupère les 10 premiers projets de la base principale",
                                                    parameters: {} // Définir les paramètres si nécessaire
                                                },
                                                {
                                                    name: "getSyncProjects",
                                                    description: "Récupère les 10 premiers projets de la base sync",
                                                    parameters: {} // Définir les paramètres si nécessaire
                                                }
                                            ]
                                        });
                                        console.error("Sent manifest response."); // Log pour le débogage
                                    }
                                    else {
                                        console.error("Received getManifest request without an ID. Cannot respond.");
                                    }
                                    return [3 /*break*/, 13];
                                case 3:
                                    if (!(method === "executeTool")) return [3 /*break*/, 12];
                                    toolName = params === null || params === void 0 ? void 0 : params.name;
                                    toolArgs = params === null || params === void 0 ? void 0 : params.arguments;
                                    console.error("Executing tool: ".concat(toolName, " with args: ").concat(JSON.stringify(toolArgs))); // Log pour le débogage
                                    result = null;
                                    error = null;
                                    _a.label = 4;
                                case 4:
                                    _a.trys.push([4, 10, , 11]);
                                    if (!(toolName === "getMainProjects")) return [3 /*break*/, 6];
                                    return [4 /*yield*/, clients.main.query("SELECT * FROM projects LIMIT 10")];
                                case 5:
                                    res = _a.sent();
                                    result = res.rows;
                                    return [3 /*break*/, 9];
                                case 6:
                                    if (!(toolName === "getSyncProjects")) return [3 /*break*/, 8];
                                    return [4 /*yield*/, clients.sync.query("SELECT * FROM projects LIMIT 10")];
                                case 7:
                                    res = _a.sent();
                                    result = res.rows;
                                    return [3 /*break*/, 9];
                                case 8:
                                    error = { message: "Unknown tool: ".concat(toolName) };
                                    _a.label = 9;
                                case 9: return [3 /*break*/, 11];
                                case 10:
                                    execErr_1 = _a.sent();
                                    console.error("Error executing tool ".concat(toolName, ":"), execErr_1);
                                    errorMessage = execErr_1 instanceof Error ? execErr_1.message : String(execErr_1);
                                    error = { message: "Error executing tool ".concat(toolName), details: errorMessage };
                                    return [3 /*break*/, 11];
                                case 11:
                                    // Renvoyer le résultat ou l'erreur de l'exécution de l'outil
                                    // Ensure id is defined before responding
                                    if (id !== undefined) {
                                        // Respond using JSON-RPC 2.0 format
                                        if (error) {
                                            respond(id, { error: error });
                                        }
                                        else {
                                            respond(id, { result: result });
                                        }
                                        console.error("Sent executeTool response for ".concat(toolName, ".")); // Log pour le débogage
                                    }
                                    else {
                                        console.error("Cannot respond to executeTool: message ID is undefined."); // Log if id is missing
                                    }
                                    return [3 /*break*/, 13];
                                case 12:
                                    // Répondre pour les méthodes inconnues (y compris potentiellement `shutdown`)
                                    console.error("Unknown method received: ".concat(method));
                                    // Ensure id is defined before responding
                                    if (id !== undefined) {
                                        respond(id, { error: { message: "Unknown method: ".concat(method) } });
                                    }
                                    else {
                                        console.error("Received unknown method request without an ID or unknown notification.");
                                    }
                                    _a.label = 13;
                                case 13: return [3 /*break*/, 15];
                                case 14:
                                    err_1 = _a.sent();
                                    console.error("Error processing message:", err_1);
                                    errorMessage = err_1 instanceof Error ? err_1.message : String(err_1);
                                    console.error("Failed to process message or parse JSON: ".concat(errorMessage, ". Original line: \"").concat(line, "\""));
                                    return [3 /*break*/, 15];
                                case 15: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    });
}
main();
function respond(id, payload) {
    var response = __assign({ jsonrpc: "2.0", id: id }, payload);
    console.log(JSON.stringify(response));
}
