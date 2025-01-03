require('dotenv').config();
const Mux = require('@mux/mux-node');
const fs = require('fs');

// Initialize the Mux client properly
const { Video } = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET
});

async function generateVideoLibrary() {
    try {
        console.log('Fetching videos from Mux...');
        const { data: assets } = await Video.Assets.list({
            limit: 100
        });

        // Debug output
        console.log(`Found ${assets.length} videos`);
        
        const videos = assets.map(asset => ({
            id: asset.id,
            playbackId: asset.playback_ids[0]?.id,
            status: asset.status,
            duration: asset.duration,
            aspectRatio: asset.aspect_ratio,
            createdAt: asset.created_at
        }));

        // Debug output
        console.log('Video data:', JSON.stringify(videos, null, 2));

        const markdownContent = generateMarkdown(videos);
        fs.writeFileSync('index.md', markdownContent);
        console.log('Video library generated successfully!');
    } catch (error) {
        console.error('Error generating video library:', error);
        throw error;
    }
}

function generateMarkdown(videos) {
    const lines = [
        '# Video Library',
        '',
        'Here are all our videos:',
        ''
    ];

    videos.forEach(video => {
        lines.push(`## Video ${video.id}`);
        lines.push('');
        lines.push(`<div style="position: relative; padding-bottom: 56.25%;">`);
        lines.push(`  <iframe src="https://stream.mux.com/${video.playbackId}" style="position: absolute; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe>`);
        lines.push(`</div>`);
        lines.push('');
    });

    return lines.join('\n');
}

generateVideoLibrary();
