import { Innertube } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create();
  try {
    const info = await yt.getInfo('5JoKCduKKyk');
    const captions = info.captions?.caption_tracks;
    console.log("Captions found:", captions?.map(c => c.language_code + ' ' + c.name.text));
    if (captions && captions.length > 0) {
        const fetchRes = await fetch(captions[0].base_url);
        const text = await fetchRes.text();
        console.log(text.slice(0, 100));
    }
  } catch(e) {
    console.error("youtubei.js error:", e);
  }
}
test();
