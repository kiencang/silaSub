async function testLemnos() {
    try {
        const res = await fetch('https://yt.lemnoslife.com/noKey/captions?part=id&videoId=5JoKCduKKyk');
        const data = await res.json();
        console.log(data);
    } catch(e) {
        console.error(e);
    }
}
testLemnos();
