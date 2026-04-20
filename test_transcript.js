const { YoutubeTranscript } = require('youtube-transcript');
YoutubeTranscript.fetchTranscript('5JoKCduKKyk')
    .then(t => console.log('DEFAULT: ', t.slice(0,2)))
    .catch(e => console.error('DEFAULT ERROR: ', e.message));

YoutubeTranscript.fetchTranscript('5JoKCduKKyk', { lang: 'en' })
    .then(t => console.log('EN: ', t.slice(0,2)))
    .catch(e => console.error('EN ERROR: ', e.message));
