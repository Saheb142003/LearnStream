import express from "express";
import Playlist from "../models/playlist.js";
import VideoCache from "../models/videoCache.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const playlists = await Playlist.find({ isSingleVideo: false }).select("_id updatedAt");
    const videos = await VideoCache.find().select("videoId updatedAt");

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    const domain = "https://learnstream.netlify.app";
    const statics = ["", "/feed", "/playlist", "/contact", "/about"];
    statics.forEach((route) => {
      const priority = route === "" ? "1.0" : route === "/feed" || route === "/playlist" ? "0.8" : "0.5";
      const changefreq = route === "" || route === "/feed" ? "daily" : "weekly";
      xml += `  <url>\n    <loc>${domain}${route}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
    });

    // Dynamic Playlists
    playlists.forEach((p) => {
      if (p.updatedAt) {
        xml += `  <url>\n    <loc>${domain}/playlist/${p._id}</loc>\n    <lastmod>${p.updatedAt.toISOString().split("T")[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }
    });

    // Dynamic Videos
    videos.forEach((v) => {
      if (v.updatedAt) {
        xml += `  <url>\n    <loc>${domain}/player/${v.videoId}</loc>\n    <lastmod>${v.updatedAt.toISOString().split("T")[0]}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
      }
    });

    xml += `</urlset>`;

    res.header("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap generation error:", err);
    res.status(500).send("Error generating sitemap");
  }
});

export default router;
