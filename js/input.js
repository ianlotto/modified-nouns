'use strict';

angular.module('modifiedNouns.input', [])

.factory('Input', function ($window, $document, $timeout) {

  var EVENTS = {
    start: 'mousedown touchstart',
    move: 'mousemove touchmove',
    end: 'mouseup touchend touchcancel'
  };

  var activeTouches = { length: 0 };
  var mouseExp = /^mouse/i;

  var delta, absDelta, lowestDelta, cancel, touches, _touches, touch, _touch;

  // Adapted from https://github.com/jquery/jquery-mousewheel
  // TODO: trackpad needs help, prevent NaN from being returned...
  var normalizeWheelDelta = function (e, element) {
    delta = e.deltaY * -1;

    if(e.deltaMode === 1) {
      delta *= 16;
    } else if(e.deltaMode === 2) {
      delta *= element[0].getBoundingClientRect().height;
    }

    absDelta = $window.Math.abs(delta);

    if(!lowestDelta || absDelta < lowestDelta) {
      lowestDelta = absDelta;
    }

    delta = $window.Math[ delta >= 1 ? 'floor' : 'ceil' ](delta / lowestDelta);

    if(!!cancel) {
      $timeout.cancel(cancel);
    }

    cancel = $timeout(function () { lowestDelta = null; }, 200);

    return delta;
  };

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
    getTouches: getTouches,
    normalizeWheelDelta: normalizeWheelDelta
  };
});