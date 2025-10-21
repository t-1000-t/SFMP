import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.static(__dirname));
app.use("/src", express.static(path.join(__dirname, "src")));

app.use("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
