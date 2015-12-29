'use strict';

angular.module('modifiedNouns.input', [])

.factory('Limit', function () {
  var limits = {};
  var limitCheck = { limits: limits };

  return {

    $set: function (startData, parentData) {
      limits.maxX = parentData.left;
      limits.minX = parentData.width - startData.width;

      limits.maxY = parentData.top;
      limits.minY = parentData.height - startData.height;
    },

    check: function (x, y) {
      limitCheck.x = x < limits.minX ? -1 : x > limits.maxX ? 1 : 0;
      limitCheck.y = y < limits.minY ? -1 : y > limits.maxY ? 1 : 0;

      return limitCheck;
    }
  };

})

// TODO: differentiate between single and multi touch events
.factory('Input', function ($window, $document) {
  var activeTouches = { length: 0 };

  var touch, changedTouch, touches;

  //PROBLEM:

  //Differentiate between dragging and zooming with touch
  //Google maps can handle both at the same time

  //If one touch present, we're just dragging and we're done

  //If more than two touches are present, use the first two in the array and draw a line between them on each touchmove.

  // Measure first touch in array for getting the dragging
  // Measure its change in length for getting the zooming

  var getTouches = function (e) {
    touches = e.changedTouches;
    return (!!touches && touches.length > 0 && touches) || null;
  };

  var updateActiveTouches = function (e, destroy) {
    touches = getTouches(e);

    for (var i = 0; i < touches.length; i++) {
      touch = touches[i];

      if(destroy) {
        delete activeTouches[touch.identifier];
      } else {
        activeTouches[touch.identifier] = { x:  touch.pageX, y: touch.pageY };
      }
    }

    activeTouches.length = $window.Object.keys(activeTouches).length - 1;
  };

  $document.on('touchstart', function (e) {
    updateActiveTouches(e);
  });

  $document.on('touchmove', function (e) {
    updateActiveTouches(e);
  });

  $document.on('touchend touchcancel', function (e) {
    updateActiveTouches(e, true);
  });

  return {

    EVENTS: {
      start: 'mousedown touchstart',
      move: 'mousemove touchmove',
      end: 'mouseup touchend'
    },

    dragging: false,
    activeTouches: activeTouches,

    // Normalize between mouse and touch
    getPos: function (e) {
      touch = (!!e.touches && e.touches.length > 0 && e.touches[0]) || e;
      changedTouch = !!e.changedTouches && e.changedTouches[0];

      touch = changedTouch || touch;

      return {
        id: touch.identifier || touch.type,
        x:  touch.pageX,
        y:  touch.pageY
      };
    }
  };
});