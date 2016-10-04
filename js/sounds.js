var sounds = {};
sounds["button"] = {src:"assets/sounds/button.mp3", delay:0, offset:37, loops:0, volume: 1, soundInstance:null};
sounds["deadhit"] = {src:"assets/sounds/deadhit.mp3", delay:0, offset:37, loops:0, volume: 0.6, soundInstance:null};
sounds["endit"] = {src:"assets/sounds/endit.mp3", delay:0, offset:37, loops:0, volume: 1, soundInstance:null};
sounds["fight"] = {src:"assets/sounds/fight.mp3", delay:0, offset:37, loops:0, volume: 1, soundInstance:null};
sounds["hitpc1"] = {src:"assets/sounds/hitpc1.mp3", delay:0, offset:37, loops:0, volume: 1, soundInstance:null};
sounds["hitpc2"] = {src:"assets/sounds/hitpc2.mp3", delay:0, offset:37, loops:0, volume: 1, soundInstance:null};
sounds["music"] = {src:"assets/sounds/music.mp3", delay:0, offset:8, loops:-1, volume: 0.8, soundInstance:null};
sounds["punchkick"] = {src:"assets/sounds/punchkick.mp3", delay:0, offset:37, loops:0, volume: 1, soundInstance:null};
sounds["splat"] = {src:"assets/sounds/splat.mp3", delay:0, offset:37, loops:0, volume: 1, soundInstance:null};

var patt = new RegExp('Chrome/[.0-9]* Mobile');
var isChrome = patt.test(navigator.userAgent);
var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

function playSound(id) {
	if (isChrome) {
		return;
	}

	sounds[id].soundInstance = createjs.Sound.play(id, createjs.Sound.INTERRUPT_NONE, sounds[id].delay, sounds[id].offset, sounds[id].loops, sounds[id].volume);
}

function stopSound(id) {
	if (isChrome) {
		return;
	}

	if (sounds[id].soundInstance != null) {
		sounds[id].soundInstance.stop();
	}
}