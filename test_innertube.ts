async function testInnertube() {
    try {
        const body = {
            context: {
                client: {
                    clientName: "ANDROID",
                    clientVersion: "20.10.38"
                }
            },
            videoId: "5JoKCduKKyk"
        };
        const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)"
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        console.log("Tracks:", tracks ? tracks.length : "None");
        if (tracks) {
             console.log(tracks[0]);
             const txtRes = await fetch(tracks[0].baseUrl);
             const txt = await txtRes.text();
             console.log("Subtitle:", txt.slice(0, 50));
        }
    } catch(e) {
        console.error("Innertube error:", e);
    }
}
testInnertube();
