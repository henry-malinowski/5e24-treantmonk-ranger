const path = require("path");
const esbuild = require("esbuild");

module.exports = function (eleventyConfig) {
  const isProdBuild = process.env.ELEVENTY_ENV === "production";
  const outputDir = isProdBuild ? "_site_prod" : "_site";

  // Don't treat output dirs or spell data files as templates (avoids cascade + spell pages)
  eleventyConfig.ignores.add("_site");
  eleventyConfig.ignores.add("_site_prod");
  eleventyConfig.ignores.add("_data/cards/spells/");

  if (!isProdBuild) {
    eleventyConfig.addPassthroughCopy("styles");
    eleventyConfig.addPassthroughCopy("scripts");
    eleventyConfig.addWatchTarget("styles/");
    eleventyConfig.addWatchTarget("scripts/");
  } else {
    eleventyConfig.on("eleventy.after", async () => {
      await esbuild.build({
        entryPoints: ["styles/style.css"],
        bundle: true,
        minify: true,
        loader: {
          ".woff2": "copy",
          ".svg": "copy",
          ".png": "copy",
          ".jpg": "copy",
          ".webp": "copy",
        },
        outfile: path.join(outputDir, "styles/style.css"),
      });

      await esbuild.build({
        entryPoints: ["scripts/app.js"],
        bundle: true,
        minify: true,
        outfile: path.join(outputDir, "scripts/app.js"),
      });
    });
  }

  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("favicon");
  eleventyConfig.addWatchTarget("_data/cards/");

  return {
    dir: {
      input: ".",
      output: outputDir,
    },
  };
};
