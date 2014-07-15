module.exports = autoPlayer;

function autoPlayer(events, options, slideshow){
  if(options.hasOwnProperty('autoplay')){
    var self = this;

    self.play = false; // on pause at start

    self.slideshow = slideshow;
    self.counter   = 0;
    self.timing    = options.autoplay; // time for each slide
    self.events    = events;

    events.on('gotoPreviousSlide', function(){ self.reset.call(self); }); // reset time on slide switching
    events.on('gotoNextSlide',     function(){ self.reset.call(self); });

    events.on('toggleAutoPlay',    function(){ self.togglePause.call(self); }); // key 'a' toggle pause of playing

    setInterval(function(){
      self.update.call(self);
    }, 100);
  }
}

autoPlayer.prototype.update = function(){
  if(this.play){
    if(this.counter===this.timing*10){

      this.events.emit('gotoNextSlide');

      // disable auto playing on last slide
      if(this.slideshow.getCurrentSlideNo()===this.slideshow.getSlideCount()){
        this.reset();
        this.togglePause();
      }
    }
    this.counter++;
  }
};


autoPlayer.prototype.reset = function(){
  this.counter = 0;
};

autoPlayer.prototype.togglePause = function(){
  this.play = !this.play;
};
