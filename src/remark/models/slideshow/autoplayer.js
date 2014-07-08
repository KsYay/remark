module.exports = autoPlayer;

function autoPlayer(events, options, slideshow){
  if(options.hasOwnProperty('autoplay')){
    var self = this;

    this.play = false;

    this.slideshow = slideshow;
    this.counter = 0;
    this.timing  = options.autoplay;
    this.events  = events;

    events.on('gotoPreviousSlide', function(){ self.reset.call(self); });
    events.on('gotoNextSlide', function(){ self.reset.call(self); });

    events.on('toggleAutoPlay', function(){ self.togglePause.call(self); });

    this.timer = setInterval(function(){
      self.update.call(self);
    }, 100);
  }
}

autoPlayer.prototype.update = function(){
  if(this.play){
    if(this.counter===this.timing*10){

      this.events.emit('gotoNextSlide');

      if(this.slideshow.getCurrentSlideNo()===this.slideshow.getSlideCount()){
        this.reset();
        this.togglePause();
      }

      this.counter = 0;
    }
    this.counter++;
  }
};


autoPlayer.prototype.reset = function(){
  this.counter = 0;
};

autoPlayer.prototype.togglePause = function(){
  this.play = this.play ? false : true;
};
