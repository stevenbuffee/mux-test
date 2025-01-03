require('dotenv').config();
const Mux = require('@mux/mux-node');
const fs = require('fs');

// Initialize Mux client
const muxClient = new Mux.default({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET
});

async function generateVideoLibrary() {
    try {
        console.log('Fetching videos from Mux...');
        console.log('Token ID:', process.env.MUX_TOKEN_ID ? 'Present' : 'Missing');
        console.log('Token Secret:', process.env.MUX_TOKEN_SECRET ? 'Present' : 'Missing');

        // Debug the muxClient object
        console.log('Mux Client Structure:', {
            hasVideo: !!muxClient.Video,
            properties: Object.keys(muxClient)
        });

        // Use the Video API client directly
        const assets = await muxClient.get('/video/v1/assets');
        console.log('Raw API Response:', assets);

        const videos = assets.data.map(asset => ({
            id: asset.id,
            playbackId: asset.playback_ids?.[0]?.id,
            status: asset.status,
            duration: asset.duration,
            aspectRatio: asset.aspect_ratio,
            createdAt: asset.created_at
        }));

        // Debug output
        console.log(`Found ${videos.length} videos`);
        console.log('Video data:', JSON.stringify(videos, null, 2));

        const markdownContent = generateMarkdown(videos);
        fs.writeFileSync('index.md', markdownContent);
        console.log('Video library generated successfully!');
    } catch (error) {
        console.error('Error generating video library:', error);
        // Log more details about the error
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            muxClientKeys: muxClient ? Object.keys(muxClient) : 'undefined'
        });
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

// Add error handling for the main execution
generateVideoLibrary().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
