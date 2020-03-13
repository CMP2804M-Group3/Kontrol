function rewind() {
    kodi.rewind();
}

function fastForward() {
    kodi.fastForward();
}

function goPrevious() {
    kodi.goBack();
}

function goNext() {
    kodi.goNext();
}

function playPause() {
    kodi.playPause();
}

function volumeUp() {
    kodi.volumeUp();
}

function volumeDown() {
    kodi.volumeDown();
}

function mute() {
    kodi.setVolume(null, 0);
}