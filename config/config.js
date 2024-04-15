
// var _ = require('lodash');

// import extend from "lodash";

/**
 * Load environment configuration
 */
// module.exports = extend(
//   require("./env/all.js"),
//   require("./env/" + process.env.NODE_ENV + ".js") || {}
// );
// const config = {
//   all: await import("./env/all.js"),
//   env: (await import("./env/" + process.env.NODE_ENV + ".js")) || {},
// };

import { allEnv } from "./env/all.js";
let specificEnv;

try {
  specificEnv = import(`./env/${process.env.NODE_ENV}.js`);
} catch (error) {
  specificEnv = {};
}

export const config = { ...allEnv, ...specificEnv };
