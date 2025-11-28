import fetch from "node-fetch";

async function getHealthyInstances() {
  try {
    const res = await fetch("https://api.invidious.io/instances.json?sort_by=health");
    const data = await res.json();
    
    // Filter for instances that support API and are healthy
    // The API returns an array of [domain, metadata]
    return data
      .filter(item => {
        const [domain, meta] = item;
        return meta.type === "https";
      })
      .map(item => item[0]) // get domain
      .slice(0, 5); // take top 5
  } catch (e) {
    console.error("Failed to fetch instances:", e.message);
    return [];
  }
}

async function fetchInvidiousTranscript(videoId) {
  console.log("Fetching healthy instances...");
  const instances = await getHealthyInstances();
  console.log("Instances:", instances);

  for (const domain of instances) {
    const instance = `https://${domain}`;
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

fetchInvidiousTranscript("jNQXAC9IVRw");
