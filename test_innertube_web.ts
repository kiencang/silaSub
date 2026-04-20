async function testInnertubeWeb() {
    try {
        const body = {
            context: {
                client: {
                    clientName: "WEB",
                    clientVersion: "2.20240228.06.00"
                }
            },
            videoId: "M576WlNmIoo"
        };
        const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        console.log("Tracks in WEB:", tracks ? tracks.map(t => t.name.simpleText) : "None");
    } catch(e) {
        console.error("Innertube error:", e);
    }
}
testInnertubeWeb();
