import { YoutubeTranscript } from 'youtube-transcript';
YoutubeTranscript.fetchTranscript('M576WlNmIoo')
    .then(t => console.log('M576WlNmIoo DEFAULT: SUCCESS length', t.length))
    .catch(e => console.error('M576WlNmIoo DEFAULT ERROR: ', e.message));
