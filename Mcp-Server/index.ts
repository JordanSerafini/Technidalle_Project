#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'start_log.txt');

// Add global error handlers
process.on('uncaughtException', (err) => {
    fs.writeFileSync(logFilePath, `Uncaught Exception: ${err.message}\n${err.stack}\n`, { flag: 'a' });
    console.error(`Uncaught Exception: ${err.message}`, err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    fs.writeFileSync(logFilePath, `Unhandled Rejection: ${reason}\n`, { flag: 'a' });
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

fs.writeFileSync(logFilePath, 'Script started when launched by Cursor.\n');

console.error("Script started");
import { createInterface } from "readline";
import { Client } from "pg";

console.error("Server starting...");

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

const clients = {
  main: new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "postgres",
    database: "postgres",
  }),
  sync: new Client({
    host: "localhost",
    port: 5433,
    user: "sync_user",
    password: "sync_password",
    database: "sync_db",
  }),
};

async function main() {
  console.error("Attempting database connections...");
  // Connexion aux bases de données au démarrage
  try {
    await clients.main.connect();
    await clients.sync.connect();
    console.error("Databases connected successfully.");
  } catch (dbErr: unknown) {
    console.error("Database connection error:", dbErr);
  }

  rl.on("line", async (line) => {
    console.error(`Received line: ${line}`);
    let message;
    let id: string | number | undefined; // id can be string or number in JSON-RPC

    try {
      message = JSON.parse(line);
      id = message.id; // Get id *after* parsing

      // Log the raw received message for debugging
      console.error("Received message:", JSON.stringify(message));

      const { method, params } = message;

      if (method === "initialize") {
        console.error("Received initialize message."); // Log specifically for initialize
        // Répondre au message d'initialisation selon le protocole MCP
        // La réponse à 'initialize' devrait renvoyer les 'capabilities'.
        // Le protocole JSON-RPC 2.0 standard attend aussi "jsonrpc": "2.0" et l'id de la requête.
        if (id !== undefined) { // Ensure we have an id to respond
          console.log(JSON.stringify({
            jsonrpc: "2.0", // Specify JSON-RPC version
            id: id, // Echo back the original request ID
            result: { // The result contains the capabilities
              capabilities: {
                executeTool: {},
                getManifest: {}
              }
            }
          }));
          console.error("Sent initialize response (capabilities)."); // Log pour le débogage
        } else {
          console.error("Received initialize message without an ID. Cannot respond.");
        }
      } else if (method === "initialized") {
        // Handle the 'initialized' notification from the client (Cursor)
        console.error("Received 'initialized' notification from client.");
        // No response is expected for a notification
      } else if (method === "getManifest") {
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
        } else {
          console.error("Received getManifest request without an ID. Cannot respond.");
        }
      } else if (method === "executeTool") {
        const toolName = params?.name;
        const toolArgs = params?.arguments;

        console.error(`Executing tool: ${toolName} with args: ${JSON.stringify(toolArgs)}`); // Log pour le débogage

        let result = null;
        let error = null;

        try {
          if (toolName === "getMainProjects") {
            const res = await clients.main.query("SELECT * FROM projects LIMIT 10");
            result = res.rows;
          } else if (toolName === "getSyncProjects") {
            const res = await clients.sync.query("SELECT * FROM projects LIMIT 10");
            result = res.rows;
          } else {
            error = { message: `Unknown tool: ${toolName}` };
          }
        } catch (execErr: unknown) {
          console.error(`Error executing tool ${toolName}:`, execErr);
          const errorMessage = execErr instanceof Error ? execErr.message : String(execErr);
          error = { message: `Error executing tool ${toolName}`, details: errorMessage };
        }

        // Renvoyer le résultat ou l'erreur de l'exécution de l'outil
        // Ensure id is defined before responding
        if (id !== undefined) {
          // Respond using JSON-RPC 2.0 format
          if (error) {
            respond(id, { error });
          } else {
            respond(id, { result });
          }
          console.error(`Sent executeTool response for ${toolName}.`); // Log pour le débogage
        } else {
          console.error("Cannot respond to executeTool: message ID is undefined."); // Log if id is missing
        }
      } else {
        // Répondre pour les méthodes inconnues (y compris potentiellement `shutdown`)
        console.error(`Unknown method received: ${method}`); 
        // Ensure id is defined before responding
        if (id !== undefined) {
          respond(id, { error: { message: `Unknown method: ${method}` } });
        } else {
          console.error("Received unknown method request without an ID or unknown notification.");
        }
      }
    } catch (err: unknown) {
      console.error("Error processing message:", err);

      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`Failed to process message or parse JSON: ${errorMessage}. Original line: "${line}"`);
    }
  });
}

main();

function respond(id: string | number, payload: any) {
  const response = { jsonrpc: "2.0", id: id, ...payload };
  console.log(JSON.stringify(response));
}
