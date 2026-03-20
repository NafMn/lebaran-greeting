import server from "./server.js";

// Cloudflare Workers requires an ES Module that exports a default object with a `fetch` handler.
export default {
  fetch(req, env, ctx) {
    // Suntik library env dari Cloudflare (Database URL, API Keys) ke process.env secara global per-request
    if (typeof process !== "undefined" && process.env) {
      Object.assign(process.env, env);
    } else {
      globalThis.process = { env: env };
    }
    return server.fetch(req, env, ctx);
  }
};
