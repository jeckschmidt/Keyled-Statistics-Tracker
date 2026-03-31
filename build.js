import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: [
    "public/frontend/javascript/homePage.js",
    "public/frontend/javascript/loginPage.js"
  ],
  bundle: true,
  minify: true,
  outdir: "public/frontend/bundles",
  platform: "browser",
  format: "esm",

  loader: {
    ".css": "css",
  },
});
