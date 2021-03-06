'use strict';

angular.module('modifiedNouns.input', [])

.factory('DoubleTouch', function ($window, Geometry) {
  var MAX_TIME = 200;
  var MAX_LENGTH = 20;
  var startTouches = [];

  var touchVector, isDoubleTouch;

  var push = function (touch) {
    startTouches.push({ // Make a new object here
      time: $window.Date.now(),
      type: touch.type,
      x: touch.x,
      y: touch.y
    });

    if(startTouches.length > 2) {
      startTouches.shift();
    }
  };

  var check = function () {
    if(startTouches.length !== 2) {
      return false;
    }

    if(startTouches[1].type === startTouches[0].type) {
      touchVector = Geometry.createVector(startTouches[0], startTouches[1]);
    } else {
      touchVector = false;
    }

    isDoubleTouch = !!touchVector &&
      touchVector.duration <= MAX_TIME &&
      touchVector.length <= MAX_LENGTH;

    return isDoubleTouch && touchVector;
  };

  return {
    push: push,
    check: check
  };
})

.factory('MultiTouch', function (Geometry) {
  var touches = [];
  var prevTouches = [];

  var touchVecs = [];
  var multiTouchVecs = [];

  var isZoom = function (touch1, touch2) {
    if(!touch1 || !touch2) {
      return false;
    }

    if(
      // One touch is stationary
      (touch1.dir[0] === 0 && touch1.dir[1] === 0) ||
      (touch2.dir[0] === 0 && touch2.dir[1] === 0) ||
      // One of the axes are moving in different directions
      (touch1.dir[0] < 0 && touch2.dir[0] > 0) ||
      (touch1.dir[0] > 0 && touch2.dir[0] < 0) ||
      (touch1.dir[1] < 0 && touch2.dir[1] > 0) ||
      (touch1.dir[1] > 0 && touch2.dir[1] < 0)
    ) {
      return true;
    } else {
      return false;
    }
  };

  var createVectors = function (touch1, touch2) {
    prevTouches[0] = touches[0];
    prevTouches[1] = touches[1];

    touches[0] = touch1;
    touches[1] = touch2;

    multiTouchVecs[0] = multiTouchVecs[1];
    multiTouchVecs[1] = Geometry.createVector(touches[0], touches[1]);

    if(!!prevTouches[0] && !!prevTouches[1]) { // Skips the first call
      touchVecs[0] = Geometry.createVector(prevTouches[0], touches[0]);
      touchVecs[1] = Geometry.createVector(prevTouches[1], touches[1]);
    }
  };

  var check = function (touch1, touch2) {
    createVectors(touch1, touch2);

    return isZoom(touchVecs[0], touchVecs[1]) && multiTouchVecs;
  };

  return {
    check: check
  };
})

.factory('Input', function ($window, $document, DoubleTouch, MultiTouch) {

  var EVENTS = {
    start: 'mousedown touchstart',
    move: 'mousemove touchmove',
    end: 'mouseup touchend touchcancel'
  };

  var activeTouches = { length: 0 };
  var orderedTouches = [];
  var changedIds = [];
  var typeExp = /(mouse|wheel)/i;

  var recordMove = false;

  var delta, typeMatch, touches, touchIndex, _touches, touch, _touch;

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
      id: input.identifier,
      type: input.type
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
        e.changedTouches[i].type = e.type; // Add event type to Touch object
        _touches[i] = createTouch(e.changedTouches[i]);
      }
    } else {
      _touches = [createTouch(e)];
    }

    return _touches;
  };

  var updateActiveTouches = function (e, destroy) {
    touches = getTouches(e);
    changedIds.length = 0;

    for (var i = 0; i < touches.length; i++) {
      touch = touches[i];
      touchIndex = orderedTouches.indexOf(touch.id);
      changedIds.push(touch.id);

      if(destroy) {
        delete activeTouches[touch.id];
        if(touchIndex >= 0) { orderedTouches.splice(touchIndex, 1); }
      } else {
        activeTouches[touch.id] = touch;
        if(touchIndex === -1) { orderedTouches.push(touch.id); }
      }
    }

    activeTouches.length = orderedTouches.length;

    return changedIds;
  };

  $document.on(EVENTS.start, function (e) {
    recordMove = true;

    updateActiveTouches(e);
    DoubleTouch.push(activeTouches[ changedIds[0] ]);
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

    checkDoubleTouch: DoubleTouch.check,

    checkZoomTouch: function () {
      return MultiTouch.check(
        activeTouches[ orderedTouches[0] ],
        activeTouches[ orderedTouches[1] ]
      );
    },

    activeTouches: activeTouches,
    orderedTouches: orderedTouches,
    getTouches: getTouches,
    getWheelTouch: getWheelTouch
  };
});

(function (angular) {
  var inputModule = angular.module('modifiedNouns.input');

  var DIRECTIVE_MAP = { touchStart: 'mousedown', touchEnd: 'mouseup' };

  var makeDirective = function (mouseEvent, directiveName) {
    var touchEvent = directiveName.toLowerCase();

    var directive = function ($window, $parse, Input) {
      return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attrs) {
          var suppressMouse = false;
          var expression = attrs[directiveName] || null;

          var bustMouse = function (e) {
            $window.removeEventListener(mouseEvent, bustMouse, true);
            e.stopPropagation();
          };

          element.on(Input.EVENTS.end, function (e) {
            e.stopPropagation();

            if(e.type === touchEvent) {
              suppressMouse = true;
              // Global bust next mouseup
              $window.addEventListener(mouseEvent, bustMouse, true);
            } else if(e.type === mouseEvent && suppressMouse) {
              suppressMouse = false;
              return false;
            }

            if(!!expression) {
              scope.$apply(function () {
                $parse(expression)(scope);
              });
            }
          });

        }
      };
    };

    var annotatedDirective = ['$window', '$parse', 'Input', directive];

    inputModule.directive(directiveName, annotatedDirective);
  };

  angular.forEach(DIRECTIVE_MAP, makeDirective);
})(angular);