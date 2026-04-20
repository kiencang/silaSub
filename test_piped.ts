async function testPiped() {
    try {
        const res = await fetch('https://pipedapi.kavin.rocks/streams/5JoKCduKKyk');
        const textArea = await res.text();
        console.log("Response:", textArea.slice(0, 100));
    } catch(e) {
        console.error(e);
    }
}
testPiped();
