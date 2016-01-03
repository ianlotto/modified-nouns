'use strict';

angular.module('modifiedNouns.drag', [])

.factory('Drag', function ($document, Geometry, Limit, Input, ModifiedNouns) {

  var points = [];
  var vectors = [];
  var pos = {};

  var vector, point, eventData, sessionId;

  var register = function (item, array) {
    array.push(item);

    if(array.length > 10) {
      array.shift();
    }
  };

  var clearData = function () {
    while (points.length > 0 || vectors.length > 0) {
      points.pop();
      vectors.pop();
    }
  };

  var constrainPos = function (pos, checkResult) {
    pos.x = checkResult.x === -1 ?
      checkResult.limits.minX : checkResult.x === 1 ?
      checkResult.limits.maxX : pos.x;

    pos.y = checkResult.y === -1 ?
      checkResult.limits.minY : checkResult.y === 1 ?
      checkResult.limits.maxY : pos.y;

    return pos;
  };

  var onStart = function (level, eventPos) {
    clearData();

    pos.x = level.position.left;
    pos.y = level.position.top;

    Limit.setXY(level.size, level.element.parent()[0].getBoundingClientRect());

    point = Geometry.createPoint(eventPos);
    register(point, points);
  };

  var onMove = function (level, eventPos) {
    vector = Geometry.createVector(point, eventPos);
    register(vector, vectors);

    point = Geometry.createPoint(eventPos); // New, latest point
    register(point, points);

    pos.x = pos.x + vector.x;
    pos.y = pos.y + vector.y;

    pos = constrainPos(pos, Limit.check(pos));

    ModifiedNouns.positionLevel(level, pos.x, pos.y);
  };

  return {
    points: points,
    vectors: vectors,

    bind: function (element) {
      var level;

      element.on(Input.EVENTS.start, function (e) {
        level = ModifiedNouns.levels[ element.data('level.order') ];

        if(!!sessionId || e.button > 0 || !level) {
          return;
        }

        eventData = Input.getTouches(e)[0];

        if(!!eventData) {
          sessionId = eventData.id;

          onStart(level, eventData);

          element.triggerHandler('dragstart', level);

          $document.on(Input.EVENTS.move, _onMove);
          $document.on(Input.EVENTS.end, _onEnd);
        }
      });

      var _onMove = function () {
        eventData = Input.activeTouches[sessionId];

        if(!!eventData) {
          onMove(level, eventData);
        }
      };

      var _onEnd = function () {

        if(!Input.activeTouches[sessionId]) {

          if(Input.activeTouches.length > 0) {
            _delegateDrag();
          } else {
            _endDrag();
          }

        }
      };

      var _delegateDrag = function () {
        // Delegate drag session to first active touch
        sessionId = Input.orderedTouches[0];
        onStart(level, Input.activeTouches[sessionId]);
      };

      var _endDrag = function () {
        sessionId = null;

        $document.triggerHandler('dragend', level);

        $document.off(Input.EVENTS.move, _onMove);
        $document.off(Input.EVENTS.end, _onEnd);
      };

    }
  };

})

.directive('drag', function (Drag) {
  return {
    restrict: 'A',
    link: function(scope, element) {
      Drag.bind(element);
    }
  };
});