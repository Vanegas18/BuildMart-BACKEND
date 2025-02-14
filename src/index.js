import Server from "./Server.js";
import dotenv from "dotenv";

dotenv.config();

try {
  const server = new Server();
  server.listen();
} catch (error) {
  console.error(
    `❌ Error al conectar con el servidor. ERROR: ${error.message}`
  );
  process.exit(1);
}
