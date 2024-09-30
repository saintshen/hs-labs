import { createRequestHandler } from "@remix-run/express";
import express from "express";
import morgan from "morgan";
import path from "path";
import * as rfs from "rotating-file-stream";
import { fileURLToPath } from "url";

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? null
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// create a rotating write stream
var accessLogStream = rfs.createStream("access.log", {
  interval: "1d", // rotate daily
  path: path.join(__dirname, "log"),
});

morgan.token("cfip", function (req, res) {
  return req.headers["cf-connection-ip"];
});
app.use(
  morgan(
    "[:date[clf]] :cfip :method :url :status :res[content-length] :response-time ms :referrer :user-agent",
    { stream: accessLogStream }
  )
);

app.use(
  viteDevServer ? viteDevServer.middlewares : express.static("build/client")
);

const build = viteDevServer
  ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
  : await import("./build/server/index.js");

app.all("*", createRequestHandler({ build }));

app.listen(3000, () => {
  console.log("App listening on http://localhost:3000");
});
