import { createRequestHandler } from "@remix-run/express";
import express from "express";
import morgan from "morgan";
import path from "path";
import * as rfs from "rotating-file-stream";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

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

morgan.token("cfip", function (req) {
  return req.headers["cf-connecting-ip"];
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

// Suspicious path interception middleware (placed after all routes)
app.use((req, res, next) => {
  const suspiciousPaths = ["/admin", '/wp-login.php', "/config", "/.env", "/secret", "/hidden"];
  if (suspiciousPaths.includes(req.path)) {
    console.log(`Blocked suspicious path access attempt: ${req.path}`);
    return res.status(403).send("Forbidden");
  }
  next();
});

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 1*60*1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many request, please try again later.',
})
app.use(limiter);

// Security headers middleware
app.use(helmet());


app.listen(3000, () => {
  console.log("App listening on http://localhost:3000");
});
