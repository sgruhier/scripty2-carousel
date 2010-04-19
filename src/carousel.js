// Add reset method to S2.FX.Element
S2.FX.Element.addMethods({
  reset: function() {
    if(this.state == 'running') {
      this.cancel();
    }
    this.state     = 'idle';
    this.operators = [];
  }
});
  
(function(UI) {
  UI.Carousel = Class.create(UI.Base, (function() {
    function initialize(element, options) {
      this.setOptions(options);

      // Get elements
      this.root      = $(element);
      this.next      = this.root.down(this.options.nextSelector);
      this.prev      = this.root.down(this.options.prevSelector);
      this.container = this.root.down(this.options.containerSelector);
      this.elements  = this.container.immediateDescendants();

      // Connect events
      if (this.next) {
        this.prev.observe('click', _scrollPrev.bind(this));
        UI.addBehavior(this.prev, [UI.Behavior.Hover, UI.Behavior.Focus]);
      }
      if (this.prev) {
        this.next.observe('click', _scrollNext.bind(this));
        UI.addBehavior(this.next, [UI.Behavior.Hover, UI.Behavior.Focus]);
      }

      // Pre-compute values depending of carousel's orientation
      if (this.isHorizontal()) {
        this.elementSize = this.elements.first().getWidth();
        this.containerSize = this.container.up().getWidth();    
        this.attribute = 'left';
      } else {
        this.elementSize = this.elements.first().getHeight();
        this.containerSize = this.container.up().getHeight();    
        this.attribute = 'top';
      }
      this.nbVisibleElements = Math.floor(this.containerSize / this.elementSize);
      this.maxPos            = this.elements.length - this.nbVisibleElements;
    
      // Use a unique effect object!
      this.effect = new S2.FX.Morph(this.container, 
                                    Object.extend({after: _updateScrollButton.bind(this)}, this.options.fxOption));
    
      // Hack update effect method to fire carousel:position:changed
      var fxUpdate = this.effect.update, container = this.container;
      this.effect.update = function(position) {
        fxUpdate.call(this, position);
        container.fire("carousel:position:changed", {position:position});
      }
      _updateScrollButton.call(this);
      _createSlider.call(this);
      _createPaginator.call(this);
    }

    function isHorizontal() {
      return this.options.orientation == 'horizontal';
    }
  
    function getEffect() {
      return this.effect;
    }

    function getContainer() {
      return this.container;
    }

    function getPosition() {
      var pos = - parseFloat(this.container.getStyle("margin-" + this.attribute));
      return pos / this.elementSize;
    }
  
    function getRelativePosition() {
      return (this.getPosition() / this.maxPos);
    }

    function goTo(position, withoutFx) {
      position = Math.max(0, position);
      position = Math.min(position, this.maxPos);

      var pos   = - position * this.elementSize,
          style = 'margin-' + this.attribute + ':' + pos + 'px';
    
      if (withoutFx) {
        this.effect.element.setStyle(style);
        this.container.fire("carousel:position:changed", {position:position});
        _updateScrollButton.call(this);
      }
      else {
        this.effect.reset();
        this.effect.animate('style', this.effect.element, {style: style, propertyTransitions: { }});
        this.effect.play();    
      }
    }
  
    function goToRelative(relativePos, withoutFx) {
      this.goTo(relativePos * this.maxPos, withoutFx);
    }
  
    // Private methods
    function _scrollPrev(event) {
      if (this.getPosition() > 0) {
        this.goTo(Math.ceil(this.getPosition() - this.nbVisibleElements));
      } 
      event.stop();
    }

    function _scrollNext(event) {
      if (this.getPosition() + this.nbVisibleElements < this.elements.length) {
        this.goTo(Math.floor(this.getPosition() + this.nbVisibleElements));
      }
      event.stop();
    }

    function _updateScrollButton() {
      var position = this.getPosition();
      if (this.prev) {
        if (position == 0) {
          this.prev.addClassName(this.options.disableClass).removeClassName('ui-state-hover')
        }
        else {
          this.prev.removeClassName(this.options.disableClass);
        }
      }
      if (this.next) {
        if (position + this.nbVisibleElements >= this.elements.length) {
          this.next.addClassName(this.options.disableClass).removeClassName('ui-state-hover')
        }
        else {
          this.next.removeClassName(this.options.disableClass);
        }
      }
    }
  
    function _createSlider() {
      if (this.options.slider) {
        var self= this, ignoreEvent = true;
        // Update method called when slider position changes
        var update  = (function(values, slider) {
          ignoreEvent = true;
          self.goToRelative(values[0]/100, true);
        });
      
        // Create slider
        this.slider = new S2.UI.Slider(this.options.slider, 
                                       {onSlide: update, onSlide: update, orientation: this.options.orientation});
      
        this.getContainer().observe('carousel:position:changed', function(event) {
          if (ignoreEvent) {
            ignoreEvent = false;
          }
          else {
            self.slider.setValue(self.getRelativePosition() * 100, 0);
          }
        });
      }
    };  

    function _createPaginator() {
      if (this.options.paginator) {
        this.paginator = new UI.Carousel.Paginator(this.options.paginator, this);
      }
    }
    // Publish public methods
    return {initialize:           initialize,
            isHorizontal:         isHorizontal,
            getEffect:            getEffect,
            getContainer:         getContainer,
            getPosition:          getPosition,
            getRelativePosition:  getRelativePosition,
            goToRelative:         goToRelative,
            goTo:                 goTo};
  })());
  
  // Class methods/variables
  Object.extend(UI.Carousel, {
    NAME: 'S2.UI.Carousel',
    DEFAULT_OPTIONS: {
      nextSelector:      '.ui-carousel-next',
      prevSelector:      '.ui-carousel-prev',
      containerSelector: '.ui-carousel-container ul',
      disableClass:      'ui-state-disabled',
      orientation:       'horizontal',
      fxOption:          {duration: 0.75, transition: S2.FX.Transitions.easeInOutExpo},
      slider:            null,
      paginator:         null
    }
  });
  
  UI.Carousel.Paginator = Class.create(UI.Base, (function() {
    // Constructor
    function initialize(element, carousel) {
      this.element = $(element);
      this.carousel = carousel;
      var nbPages = Math.ceil(carousel.elements.length / carousel.nbVisibleElements);
      _createUI.call(this, nbPages);
      
      this.carousel.getContainer().observe("carousel:position:changed", _update.bind(this));
      this.ul.observe('click', _scroll.bind(this));
    }
    
    function goToPage(page) {
      this.carousel.goTo(page * this.carousel.nbVisibleElements)
    }
    
    // Private methods
    function _createUI(nbPages) {
      this.ul = this.element.down('ul') || new Element('ul');
      for (var i=0; i<nbPages; i++) {
        this.ul.insert(new Element('li').addClassName('ui-icon ui-icon-bullet').update(i+1));
      }
      if (!this.ul.parentNode) {
        this.element.insert(this.ul);
      }
      this.lis = this.ul.select('li')
      _update.call(this)
    }
    
    function _update(event) {
      this.lis.invoke('removeClassName', 'ui-state-active');
      this.lis[_currentPage.call(this)].addClassName('ui-state-active')
    }
    
    function _currentPage() {
      return Math.round(this.carousel.getPosition() / this.carousel.nbVisibleElements);
    }
    
    function _scroll(event) {
      var element = event.findElement('li'), 
          page    = this.lis.indexOf(element);
      this.goToPage(page);
    }
    
    return {initialize: initialize,
            goToPage:   goToPage}
  })());
})(S2.UI);

