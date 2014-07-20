var converter = require('../converter')
  , highlighter = require('../highlighter')
  , utils = require('../utils')
  ;

module.exports = SlideView;

function SlideView (events, slideshow, scaler, slide, progressBar) {
  var self = this;
  
  self.progressBar = progressBar;
  self.events = events;
  self.slideshow = slideshow;
  self.scaler = scaler;
  self.slide = slide;

  self.configureElements();
  self.updateDimensions();

  self.events.on('propertiesChanged', function (changes) {
    if (changes.hasOwnProperty('ratio')) {
      self.updateDimensions();
    }
  });
}

SlideView.prototype.updateDimensions = function () {
  var self = this
    , dimensions = self.scaler.dimensions
    ;

  self.scalingElement.style.width = dimensions.width + 'px';
  self.scalingElement.style.height = dimensions.height + 'px';
};

SlideView.prototype.scale = function (containerElement) {
  var self = this;

  self.scaler.scaleToFit(self.scalingElement, containerElement);
};

SlideView.prototype.show = function (animation) {
  utils.addClass(this.containerElement, 'remark-visible');
  utils.removeClass(this.containerElement, 'remark-fading');

  if (animation.enabled) {
    utils.removeClass(this.containerElement, animation.class);
    utils.removeClass(this.containerElement, animation.hide);
    utils.addClass(this.containerElement, animation.class);
    utils.addClass(this.containerElement, animation.show);
  }
};

SlideView.prototype.hide = function (animation) {
  var self = this;
  utils.removeClass(this.containerElement, 'remark-visible');

  if (animation.enabled) {
    utils.removeClass(this.containerElement, animation.class);
    utils.removeClass(this.containerElement, animation.show);
    utils.addClass(this.containerElement, animation.class);
    utils.addClass(this.containerElement, animation.hide);
  }
  // Don't just disappear the slide. Mark it as fading, which
  // keeps it on the screen, but at a reduced z-index.
  // Then set a timer to remove the fading state in 1s.
  utils.addClass(this.containerElement, 'remark-fading');
  setTimeout(function(){
      utils.removeClass(self.containerElement, 'remark-fading');
      if (animation.enabled) {
        utils.removeClass(self.containerElement, animation.hide);
      }
  }, 1000);
};

SlideView.prototype.configureElements = function () {
  var self = this;

  self.containerElement = document.createElement('div');
  self.containerElement.className = 'remark-slide-container';

  self.scalingElement = document.createElement('div');
  self.scalingElement.className = 'remark-slide-scaler';

  self.element = document.createElement('div');
  self.element.className = 'remark-slide';

  self.contentElement = createContentElement(self.events, self.slideshow, self.slide);
  self.notesElement = createNotesElement(self.slideshow, self.slide.notes);

  if (self.progressBar) {
    self.progressElement = document.createElement('div');
    self.progressElement.className = 'remark-progress-bar';
    self.progressElement.innerHTML = setProgressBar(self.slide, self.slideshow);
    self.contentElement.appendChild(self.progressElement);
  } else {
    self.numberElement = document.createElement('div');
    self.numberElement.className = 'remark-slide-number';
    self.numberElement.innerHTML = formatSlideNumber(self.slide, self.slideshow);
    self.contentElement.appendChild(self.numberElement);
  }

  self.element.appendChild(self.contentElement);
  self.element.appendChild(self.notesElement);
  self.scalingElement.appendChild(self.element);
  self.containerElement.appendChild(self.scalingElement);
};

function setProgressBar(slide, slideshow) {
  var progress = Math.floor((slide.number / slideshow.getSlides().length)*100);
  return "<span style='width: %progress%%'></span>".replace('%progress%', progress);
}

function formatSlideNumber (slide, slideshow) {
  var format = slideshow.getSlideNumberFormat()
    , current = slide.number
    , total = slideshow.getSlides().length
    ;

  if (typeof format === 'function') {
    return format(current, total);
  }

  return format
      .replace('%current%', current)
      .replace('%total%', total);
}

SlideView.prototype.scaleBackgroundImage = function (dimensions) {
  var self = this
    , styles = window.getComputedStyle(this.contentElement)
    , backgroundImage = styles.backgroundImage
    , match
    , image
    , scale
    ;

  if ((match = /^url\(("?)([^\)]+?)\1\)/.exec(backgroundImage)) !== null) {
    image = new Image();
    image.onload = function () {
      if (image.width > dimensions.width ||
          image.height > dimensions.height) {
        // Background image is larger than slide
        if (!self.originalBackgroundSize) {
          // No custom background size has been set
          self.originalBackgroundSize = self.contentElement.style.backgroundSize;
          self.originalBackgroundPosition = self.contentElement.style.backgroundPosition;
          self.backgroundSizeSet = true;

          if (dimensions.width / image.width < dimensions.height / image.height) {
            scale = dimensions.width / image.width;
          }
          else {
            scale = dimensions.height / image.height;
          }

          self.contentElement.style.backgroundSize = image.width * scale +
            'px ' + image.height * scale + 'px';
          self.contentElement.style.backgroundPosition = '50% ' +
            ((dimensions.height - (image.height * scale)) / 2) + 'px';
        }
      }
      else {
        // Revert to previous background size setting
        if (self.backgroundSizeSet) {
          self.contentElement.style.backgroundSize = self.originalBackgroundSize;
          self.contentElement.style.backgroundPosition = self.originalBackgroundPosition;
          self.backgroundSizeSet = false;
        }
      }
    };
    image.src = match[2];
  }
};

function createContentElement (events, slideshow, slide) {
  var element = document.createElement('div');

  if (slide.properties.name) {
    element.id = 'slide-' + slide.properties.name;
  }

  styleContentElement(slideshow, element, slide.properties);

  element.innerHTML = converter.convertMarkdown(slide.content, slideshow.getLinks());

  highlightCodeBlocks(element, slideshow);

  return element;
}

function styleContentElement (slideshow, element, properties) {
  element.className = '';

  setClassFromProperties(element, properties);
  setHighlightStyleFromProperties(element, properties, slideshow);
  setBackgroundFromProperties(element, properties);
}

function createNotesElement (slideshow, notes) {
  var element = document.createElement('div');

  element.style.display = 'none';

  element.innerHTML = converter.convertMarkdown(notes);

  highlightCodeBlocks(element, slideshow);

  return element;
}

function setBackgroundFromProperties (element, properties) {
  var backgroundImage = properties['background-image'];

  if (backgroundImage) {
    element.style.backgroundImage = backgroundImage;
  }
}

function setHighlightStyleFromProperties (element, properties, slideshow) {
  var highlightStyle = properties['highlight-style'] ||
      slideshow.getHighlightStyle();

  if (highlightStyle) {
    utils.addClass(element, 'hljs-' + highlightStyle);
  }
}

function setClassFromProperties (element, properties) {
  utils.addClass(element, 'remark-slide-content');

  (properties['class'] || '').split(/,| /)
    .filter(function (s) { return s !== ''; })
    .forEach(function (c) { utils.addClass(element, c); });
}

function highlightCodeBlocks (content, slideshow) {
  var codeBlocks = content.getElementsByTagName('code')
    ;

  codeBlocks.forEach(function (block) {
    if (block.parentElement.tagName !== 'PRE') {
      utils.addClass(block, 'remark-inline-code');
      return;
    }

    if (block.className === '') {
      block.className = slideshow.getHighlightLanguage();
    }

    var meta = extractMetadata(block);

    if (block.className !== '') {
      highlighter.engine.highlightBlock(block, '  ');
    }

    wrapLines(block);
    highlightBlockLines(block, meta.highlightedLines);
    highlightBlockSpans(block);

    utils.addClass(block, 'remark-code');
  });
}

function extractMetadata (block) {
  var highlightedLines = [];

  block.innerHTML = block.innerHTML.split(/\r?\n/).map(function (line, i) {
    if (line.indexOf('*') === 0) {
      highlightedLines.push(i);
      return line.replace(/^\*( )?/, '$1$1');
    }

    return line;
  }).join('\n');

  return {
    highlightedLines: highlightedLines
  };
}

function wrapLines (block) {
  var lines = block.innerHTML.split(/\r?\n/).map(function (line) {
    return '<div class="remark-code-line">' + line + '</div>';
  });

  // Remove empty last line (due to last \n)
  if (lines.length && lines[lines.length - 1].indexOf('><') !== -1) {
    lines.pop();
  }

  block.innerHTML = lines.join('');
}

function highlightBlockLines (block, lines) {
  lines.forEach(function (i) {
    utils.addClass(block.childNodes[i], 'remark-code-line-highlighted');
  });
}

function highlightBlockSpans (block) {
  var pattern = /([^\\`])`([^`]+?)`/g
    , replacement = '$1<span class="remark-code-span-highlighted">$2</span>'
    ;

  block.childNodes.forEach(function (element) {
    element.innerHTML = element.innerHTML.replace(pattern, replacement);
  });
}
