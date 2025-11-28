import fetch from "node-fetch";

const INVIDIOUS_INSTANCES = [
  "https://invidious.drgns.space",
  "https://inv.bp.projectsegfau.lt",
  "https://invidious.flokinet.to",
  "https://invidious.privacydev.net",
  "https://yewtu.be",
  "https://invidious.nerdvpn.de",
  "https://inv.tux.pizza",
  "https://vid.puffyan.us",
];

async function fetchInvidiousTranscript(videoId) {
  console.log(`Testing video: ${videoId}`);
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      console.log(`Trying ${instance}...`);
      const url = `${instance}/api/v1/captions/${videoId}`;
      const res = await fetch(url, { timeout: 5000 });
      
      if (!res.ok) {
        console.log(`  Failed status: ${res.status}`);
        continue;
      }

      const data = await res.json();
      const captions = data.captions || [];
      console.log(`  Found ${captions.length} caption tracks`);

      if (captions.length === 0) continue;

      const track = captions.find(c => c.languageCode === 'en') || captions[0];
      const trackUrl = instance + track.url;
      console.log(`  Fetching track from: ${trackUrl}`);

      const trackRes = await fetch(trackUrl);
      if (!trackRes.ok) {
         console.log(`  Track fetch failed: ${trackRes.status}`);
         continue;
      }

      const vttText = await trackRes.text();
      console.log(`  Success! Length: ${vttText.length}`);
      return "Success";

    } catch (e) {
      console.log(`  Error: ${e.message}`);
      continue;
    }
  }
  console.log("All failed.");
}

// Test with a known video
fetchInvidiousTranscript("jNQXAC9IVRw");
