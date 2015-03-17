function Theremin() {
	var that=this;
	var audioContext;
	
	//nodes
	var oscillatorNode;
	var analyser;
	var gainNode;
	var distortion;
	
	this.playing = false;

	this.pitchBase = 10;
	this.pitchBend = 0;
	this.pitchRange = 2000;
	this.volume = 0.5;
	this.maxVolume = 0.5;
	this.frequency = this.pitchBase;

	var fadeoutInterVall;
	
	//needs MIDIUTILS
	this.frequencyToNote=function(f){
		if(MIDIUtils){
			return MIDIUtils.noteNumberToName(MIDIUtils.frequencyToNoteNumber(f));
			}
		else{
			alert("include MIDIUTILS!")
		}
	};
	
	var makeDistortionCurve=function (amount) {
	  var k = typeof amount === 'number' ? amount : 50,
		n_samples = 44100,
		curve = new Float32Array(n_samples),
		deg = Math.PI / 180,
		i = 0,
		x;
	  for ( ; i < n_samples; ++i ) {
		x = i * 2 / n_samples - 1;
		curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
	  }
	  return curve;
	};
	
	
	this.init=function(){
		audioContext = new AudioContext();
		oscillatorNode = audioContext.createOscillator();
		
		// var types=['sine','square','sawtooth','triangle'];
		// if(oscillatorType>types.length-1)oscillatorType=types.length-1;
			// oscillatorNode.type = types[oscillatorType];
			
	    var wav=bass;
		
		var real = new Float32Array(wav.real.length*2);
		var imag = new Float32Array(wav.imag.length*2);

		for (var x = 0; x < wav.real.length; x++) {
			real[x*2] =wav.real[x];
		}	
		for (var x = 0; x < wav.imag.length; x++) {
			imag[x*2] =wav.imag[x];
		}		
			
		var wt = audioContext.createPeriodicWave(real, imag);
		oscillatorNode.setPeriodicWave(wt);	
		//oscillatorNode.noteOn(0);
		oscillatorNode.start(0);
		analyser = audioContext.createAnalyser();
		distortion = audioContext.createWaveShaper();
		var biquadFilter = audioContext.createBiquadFilter();
		var convolver = audioContext.createConvolver();
		gainNode = audioContext.createGain();
		
		//connect audo pipe
		analyser.connect(distortion);
		distortion.connect(biquadFilter);
		biquadFilter.connect(convolver);
		convolver.connect(gainNode);

		distortion.curve = makeDistortionCurve(400);
		distortion.oversample = '4x';
		
		biquadFilter.type = "lowshelf";
		biquadFilter.frequency.value = 30;
		biquadFilter.gain.value = 0;

		gainNode.connect(audioContext.destination);
	};
	
	this.fadeout=function(){
		fadeoutInterVall=setInterval(fadeoutStep, 40);
	}
	
	var fadeoutStep=function(){
		that.setVolume(Math.max(0,that.volume-=0.02))
		if(that.volume==0){
			clearInterval(fadeoutInterVall);
			that.off();
		}
	}

	this.on=function(){
		if(!this.playing) {
			this.togglePlaying();
		}
	};
	
	this.off=function(){
		if(this.playing) {
			this.togglePlaying();
		}
	}
	this.togglePlaying = function() {
		if(this.playing) {
			//oscillatorNode.disconnect(this.gainNode);
			oscillatorNode.disconnect(analyser);
		} else {
			//oscillatorNode.connect(this.gainNode);
			oscillatorNode.connect(analyser);
		}
		this.playing = !this.playing;
		return this.playing;
	};


	this.setPitchBend = function(v) {
		this.pitchBend = v;
		frequency = this.pitchBase + this.pitchBend * this.pitchRange;
		//distortion.curve = makeDistortionCurve(400*v);
		oscillatorNode.frequency.value = frequency;
		this.frequency = frequency;
	};

	this.setVolume = function(v) {
		this.volume = this.maxVolume * v;
		gainNode.gain.value = this.volume;
	};
	

}
