import "dotenv/config";
import { pool, query } from "../src/lib/db";

async function main() {
  try {
    const rows = await query<{ ok: number }>("SELECT 1 AS ok");
    console.log("Connection OK:", rows);
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error);
  } finally {
    await pool.end();
  }
}

main();
