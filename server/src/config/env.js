// server/src/config/env.js
// Must be the FIRST import in server.js.
// ESM hoists all imports before executing any code, so dotenv.config()
// inside server.js would run AFTER passport.js (and other modules) are
// already evaluated — making process.env variables undefined when they
// check for required keys. Isolating it here ensures env loads first.
import dotenv from "dotenv";
dotenv.config({ quiet: true });
