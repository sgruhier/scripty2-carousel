(function() {
  function isInsideElement(event, element) {
  	// From prototype
  	var parent = event.relatedTarget;
    while (parent && parent !== element) {
      try { parent = parent.parentNode; }
      catch(e) { parent = element; }
    }
    return  (parent === element);
  }
  
  function bodyOffset(element) {
    
  }
  
  spinner = (function(id) {
    var container = document.getElementById(id),
        element   = container.firstChild,
        head      = document.getElementsByTagName("head")[0],
        style, keyframes, 
        direction = new Array(2), lastAngleX = new Array(2), lastMouseX = new Array(2), deltaPosX = new Array(2), initPosX = new Array(2), 
        animIndex = 0;
    
    container.addEventListener("mouseover", mouseOver, false);
	  container.addEventListener("mouseout",  mouseOut, false);
    container.addEventListener("mousemove", mouseMove, false);

    function createAnimation(fromX, toX, fromY, toY) {
      if (!style) {
      	style = document.createElement('style');
      	style.type = 'text/css';
      	head.appendChild(style);
      }
      if (keyframes) {
      	style.removeChild(keyframes);
      }
      var animName = "__spin" + (animIndex++) +  '__';
      keyframes = document.createTextNode('@-webkit-keyframes ' + animName + ' {'+
        'from { -webkit-transform: rotateY(' + fromX + 'deg) rotateX(' + fromY + 'deg); }'+
        'to   { -webkit-transform: rotateY(' + toX + 'deg) rotateX(' + toY + 'deg)}'+
        '}');
      style.appendChild(keyframes);
      return animName;
    }
        
    function mouseOver(event) {
      // Init animation
    	if (!isInsideElement(event, container)) {
  			direction[0] = event.layerX < container.offsetWidth/2 ? 1 : -1;
  			direction[1] = event.layerY < container.offsetHeight/2 ? 1 : -1;

  			element.style["WebkitAnimation"] = "";

  			initPosX[0] = event.layerX;
  			initPosX[1] = event.layerY;
  		}
    }
    
    function mouseOut(event) {
      // Spin image. Number of spin and direction depends on mouse speed and direction
  		if (!isInsideElement(event, container)) {
  			direction[0] = event.layerX <= 0 ? -1 : 1;
  			direction[1] = event.layerY <= 0 ? -1 : 1;
  			nbFlipX = parseInt(Math.abs(deltaPosX[0])/40 + 1);
  			nbFlipY = parseInt(Math.abs(deltaPosX[1])/40 + 1);

  			var name = createAnimation(lastAngleX[0], 360 * nbFlipX * direction[0], lastAngleX[1], 360 * nbFlipY * direction[1]);

  			element.style["WebkitTransform"] = 'rotateX(360deg) rotateY(360deg)'
  			element.style["WebkitAnimation"] = name + " 2s 1 cubic-bezier(0, 0, 0.2, 1.0)";
  		}
    }
    
    function getAngle(mouse, initPos, size) {
      var pos = (mouse - initPos) / (size / 2),	alpha;
      if (pos > 1) {
  			alpha = 180 - (Math.asin(2 - pos) * 180) / Math.PI ;
      } else if (pos < - 1) {
  			alpha = (Math.asin(pos + 2) * 180) / Math.PI +180;
      }
      else {
  			alpha = Math.asin(pos) * 180 / Math.PI;
      }
      return alpha;
    }
    
    function mouseMove(event) {
    	if (!isInsideElement(event, container)) {
    	  // Rotate image, angle is set by mouse position inside the container
        var mouseX  = event.layerX, mouseY = event.layerY, alphaX, alphaY;

    		if (lastMouseX[0] != mouseX) {
    		  var alphaX = getAngle(mouseX, initPosX[0], container.offsetWidth);
    		  
    			deltaPosX[0]  = lastMouseX[0] ? mouseX - lastMouseX[0] : mouseX;
    			lastMouseX[0] = mouseX;
    			lastAngleX[0] = alphaX;
  			}
    		if (lastMouseX[1] != mouseY) {
    		  var alphaY = getAngle(mouseY, initPosX[1], container.offsetHeight);
    			deltaPosX[1]  = lastMouseX[1] ? mouseY - lastMouseX[1] : mouseY;
    			lastMouseX[1] = mouseY;
    			lastAngleX[1] = alphaY;
  			}
  			element.style["MozTransform"]  = 'rotateY(' + lastAngleX[0] +'deg) '
  			element.style["MozTransform"]  += 'rotateX('+ -lastAngleX[1] +'deg) '
  		}
    }
  });
  spinner('h');
  spinner('t');
  spinner('m');
  spinner('l');
  spinner('five');
})();
