async function testProxy() {
    try {
        const url = encodeURIComponent('https://www.youtube.com/watch?v=5JoKCduKKyk');
        const res = await fetch(`https://corsproxy.io/?${url}`);
        const html = await res.text();
        console.log("Length:", html.length);
        console.log("Has captcha?", html.includes('g-recaptcha'));
        if (html.includes('captions')) {
            console.log("Has captions array!");
        } else {
            console.log("No captions array found");
        }
    } catch(e) {
        console.error(e);
    }
}
testProxy();
