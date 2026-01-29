import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["public/frontend/javascript/homePage.js"],
  bundle: true,
  minify: true,
  outfile: "public/frontend/bundle.js",
  platform: "browser",
  format: "esm",

  loader: {
    ".css": "css",
  },
});
