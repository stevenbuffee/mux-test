require('dotenv').config();
const fs = require('fs');
const Mux = require('@mux/mux-node');

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET
});

async function generateVideoLibrary() {
  try {
    // Fetch videos from Mux
    const { data: assets } = await mux.video.assets.list({
      limit: 100
    });

    // Generate the markdown content
    let markdownContent = `---
title: Video Library
---
# Mux Video Library

<style>
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.video-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.video-info {
  padding: 1rem;
}

.video-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
</style>

<script src="https://cdn.jsdelivr.net/npm/@mux/mux-player"></script>

<div class="video-grid">
`;

    // Add each video to the markdown
    assets.forEach(asset => {
      if (asset.status === 'ready' && asset.playback_ids?.[0]?.id) {
        const title = asset.title || 'Untitled Video';
        const playbackId = asset.playback_ids[0].id;
        
        console.log(`Adding video: ${title} (${playbackId})`); // Debug log
        
        markdownContent += `
  <div class="video-card">
    <mux-player
      stream-type="vod"
      playback-id="${playbackId}"
      metadata-video-title="${title}"
      metadata-viewer-user-id="user-id-123">
    </mux-player>
    <div class="video-info">
      <div class="video-title">${title}</div>
    </div>
  </div>
`;
      }
    });

    markdownContent += `</div>`;

    // Write to file
    fs.writeFileSync('index.md', markdownContent);
    console.log('Video library markdown generated successfully!');
    console.log(`Total videos added: ${assets.filter(a => a.status === 'ready' && a.playback_ids?.[0]?.id).length}`);

  } catch (error) {
    console.error('Error generating video library:', error);
  }
}

generateVideoLibrary();
