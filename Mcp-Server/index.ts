#!/usr/bin/env node
import { createInterface } from "readline";
import { Client } from "pg";

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
  await clients.main.connect();
  await clients.sync.connect();

  console.log(JSON.stringify({ type: "ready" }));

  rl.on("line", async (line) => {
    try {
      const { id, method, params } = JSON.parse(line);

      if (method === "getMainProjects") {
        const res = await clients.main.query("SELECT * FROM projects LIMIT 10");
        respond(id, res.rows);
      } else if (method === "getSyncProjects") {
        const res = await clients.sync.query("SELECT * FROM projects LIMIT 10");
        respond(id, res.rows);
      } else {
        respond(id, { error: "Unknown method" });
      }
    } catch (err) {
      console.error("Error:", err);
    }
  });
}

main();

function respond(id: string, result: any) {
  console.log(JSON.stringify({ id, result }));
}
