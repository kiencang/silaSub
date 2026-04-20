async function testInvidious() {
    try {
        const res = await fetch('https://vid.puffyan.us/api/v1/videos/5JoKCduKKyk');
        const data = await res.json();
        const captions = data.captions;
        if (captions && captions.length > 0) {
            console.log("Invidious SUCCESS. Captions length:", captions.length);
            console.log("First caption url:", captions[0].url);
        } else {
            console.log("Invidious response (no captions), keys found:", Object.keys(data).join(', '));
        }
    } catch(e) {
        console.error("Invidious error:", e);
    }
}
testInvidious();
