var g_sounds= {};

function loadSound(src, name){
	document.getElementById("audioContainer").innerHTML += 
		'<audio id="snd_' + name + '"><source src="' + src + '" type="audio/ogg" preload="auto"></audio>';
	
	g_sounds[name]= document.getElementById("snd_" + name);
}

function playSound(name){
	tassert(g_sounds[name] !== undefined, "sound doesn't exist: " + name);
	
	/// @todo Support multiple channels/sound
	var snd= g_sounds[name];
	snd.pause();
	snd.currentTime = 0;
	snd.play();
}