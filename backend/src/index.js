import dotenv from "dotenv";
import { createApp } from "./app.js";

dotenv.config();

const app = createApp();
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API de Vigia escuchando en http://localhost:${port}`);
});
