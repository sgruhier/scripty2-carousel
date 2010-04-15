S2.FX.Element.addMethods({
  reset: function() {
    if(this.state == 'running') {
      this.cancel();
    }
    this.state     = 'idle';
    this.operators = [];
  }
});
  
S2.UI.Carousel = Class.create(S2.UI.Mixin.Configurable, (function() {
  function initialize(element, options) {
    this.setOptions(options);

    this.root      = $(element);
    this.next      = this.root.down(this.options.nextSelector);
    this.prev      = this.root.down(this.options.prevSelector);
    this.container = this.root.down(this.options.containerSelector);

    this.prev.observe('click', scrollPrev.bind(this));
    this.next.observe('click', scrollNext.bind(this));
    this.elements = this.container.immediateDescendants();

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
    this.maxPos = this.elements.length - this.nbVisibleElements;
    
    // Use a unique effect object!
    this.effect = new S2.FX.Morph(this.container, Object.extend({after: updateScrollButton.bind(this)}, this.options.fxOption));
    
    // Hack update effect method
    var fxUpdate = this.effect.update, container = this.container;
    this.effect.update = function(position) {
      fxUpdate.call(this, position);
      container.fire("carousel:position:changed", {position:position});
    }
    updateScrollButton.call(this);
  }

  function isHorizontal() {
    return this.options.direction == 'horizontal';
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
      updateScrollButton.call(this);
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
  
  function getContainer() {
    return this.container;
  }

  function getEffect() {
    return this.effect;
  }

  function scrollPrev(event) {
    if (this.getPosition() > 0) {
      this.goTo(Math.ceil(this.getPosition() - this.nbVisibleElements));
    } 
    event.stop();
  }

  function scrollNext(event) {
    if (this.getPosition() + this.nbVisibleElements < this.elements.length) {
      this.goTo(Math.floor(this.getPosition() + this.nbVisibleElements));
    }
    event.stop();
  }

  function updateScrollButton() {
    var position = this.getPosition();
    // Disable previous button if need be
    this.prev[position == 0 ? "addClassName" : "removeClassName"](this.options.disableClass);
    this.next[position + this.nbVisibleElements >= this.elements.length 
      ? "addClassName" 
      : "removeClassName"](this.options.disableClass);
  }

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
Object.extend(S2.UI.Carousel, {
  DEFAULT_OPTIONS: {
    nextSelector:      '.ui-carousel-next',
    prevSelector:      '.ui-carousel-prev',
    containerSelector: '.ui-carousel-container ul',
    disableClass:      'ui-hide',
    direction:         'horizontal',
    fxOption:          {duration: 0.75, transition: S2.FX.Transitions.easeInOutExpo}
  }
});
