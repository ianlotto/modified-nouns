'use strict';

angular.module('modifiedNouns.input', [])

.factory('Input', function ($window, $document) {

  var EVENTS = {
    start: 'mousedown touchstart',
    move: 'mousemove touchmove',
    end: 'mouseup touchend touchcancel'
  };

  var activeTouches = { length: 0 };
  var typeExp = /(mouse|wheel)/i;

  var delta, typeMatch, touches, _touches, touch, _touch;

  var getWheelTouch = function (e) {
    delta = e.deltaY * -1;

    _touch = createTouch(e);
    _touch.dir = delta / $window.Math.abs(delta) || 0;

    return _touch;
  };

  // Normalize between mouse and touch
  var createTouch = function (input) {
    _touch = {
      x:  input.pageX,
      y: input.pageY,
      id: input.identifier
    };

    if(!_touch.id) {
      typeMatch = input.type.match(typeExp);
      _touch.id = (!!typeMatch && typeMatch[1]) || null;
    }

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
    getTouches: getTouches,
    getWheelTouch: getWheelTouch
  };
});