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

.factory('Input', function ($window, $document) {

  var EVENTS = {
    start: 'mousedown touchstart',
    move: 'mousemove touchmove',
    end: 'mouseup touchend touchcancel'
  };

  var activeTouches = { length: 0 };
  var mouseExp = /^mouse/i;

  var touches, _touches, touch, _touch;

  // Normalize between mouse and touch
  var createTouch = function (input) {
    _touch = {
      x:  input.pageX,
      y: input.pageY,
      id: input.identifier || (mouseExp.test(input.type) ? 'mouse' : null)
    };

    return _touch;
  };

  var getTouches = function (e) {
    _touches = [];

    if(!!e.changedTouches && e.changedTouches.length > 0) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        _touches[i] = createTouch(e.changedTouches[i]);
      }
    } else {
      _touches = [createTouch(e)];
    }

    return _touches;
  };

  var updateActiveTouches = function (e, destroy) {
    touches = getTouches(e);

    for (var i = 0; i < touches.length; i++) {
      touch = touches[i];

      if(destroy) {
        delete activeTouches[touch.id];
      } else {
        activeTouches[touch.id] = touch;
      }
    }

    activeTouches.length = $window.Object.keys(activeTouches).length - 1;
  };

  $document.on(EVENTS.start, function (e) {
    updateActiveTouches(e);
  });

  $document.on(EVENTS.move, function (e) {
    updateActiveTouches(e);
  });

  $document.on(EVENTS.end, function (e) {
    updateActiveTouches(e, true);
  });

  return {
    EVENTS: EVENTS,
    activeTouches: activeTouches,
    getTouches: getTouches
  };
});