'use strict';

angular.module('modifiedNouns.input', [])

.factory('Input', function ($window, $document, Geometry) {

  var EVENTS = {
    start: 'mousedown touchstart',
    move: 'mousemove touchmove',
    end: 'mouseup touchend touchcancel'
  };

  var DOUBLE_TOUCH_TIME_THRESHOLD = 200;
  var DOUBLE_TOUCH_LENGTH_THRESHOLD = 20;
  var startTouches = [];

  var activeTouches = { length: 0 };
  var orderedTouches = [];
  var typeExp = /(mouse|wheel)/i;

  var recordMove = false;

  var delta, typeMatch, touches, touchIndex, _touches, touch, _touch;
  var touchVector, isDoubleTouch;

  var pushStartTouch = function (e) {
    _touch = createTouch(e);

    startTouches.push({
      time: $window.Date.now(),
      type: e.type,
      x: _touch.x,
      y: _touch.y
    });

    if(startTouches.length > 2) {
      startTouches.shift();
    }
  };

  var checkDoubleTouch = function () {
    if(startTouches.length !== 2) {
      return false;
    }

    if(startTouches[1].type === startTouches[0].type) {
      touchVector = Geometry.createVector(startTouches[0], startTouches[1]);
    } else {
      touchVector = false;
    }

    isDoubleTouch = !!touchVector &&
      touchVector.duration < DOUBLE_TOUCH_TIME_THRESHOLD &&
      touchVector.length < DOUBLE_TOUCH_LENGTH_THRESHOLD;

    return isDoubleTouch && touchVector;
  };

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
      touchIndex = orderedTouches.indexOf(touch.id);

      if(destroy) {
        delete activeTouches[touch.id];
        if(touchIndex >= 0) { orderedTouches.splice(touchIndex, 1); }
      } else {
        activeTouches[touch.id] = touch;
        if(touchIndex === -1) { orderedTouches.push(touch.id); }
      }
    }

    activeTouches.length = orderedTouches.length;
  };

  $document.on(EVENTS.start, function (e) {
    recordMove = true;
    pushStartTouch(e);
    updateActiveTouches(e);
  });

  $document.on(EVENTS.move, function (e) {
    if(recordMove) {
      updateActiveTouches(e);
    }
  });

  $document.on(EVENTS.end, function (e) {
    updateActiveTouches(e, true);

    if(activeTouches.length === 0) {
      recordMove = false;
    }
  });

  return {
    EVENTS: EVENTS,
    activeTouches: activeTouches,
    orderedTouches: orderedTouches,
    getTouches: getTouches,
    getWheelTouch: getWheelTouch,
    checkDoubleTouch: checkDoubleTouch
  };
});