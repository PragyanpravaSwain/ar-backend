import express from "express";
import {} from "dotenv/config";
import cors from "cors";
import api from "./routes/api.js";
import initializeApplication from "./initialize.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let server;

initializeApplication().then(() => {
  app.get("/", (req, res) => {
    res.json({ message: "Server Running!" });
  });

  app.use("/api", api);

  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
