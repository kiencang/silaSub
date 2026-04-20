import * as scraper from 'youtube-captions-scraper';

async function testVTT() {
    console.log(Object.keys(scraper));
    try {
        const captions = await scraper.getSubtitles({
            videoID: 'M576WlNmIoo', 
            lang: 'en'
        });
        console.log("Success! Extracted lines:", captions.length);
        console.log(captions[0]);
    } catch(e) {
        console.error("Scraper Error:", e.message);
    }
}
testVTT();
