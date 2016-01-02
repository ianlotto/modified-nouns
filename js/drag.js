'use strict';

angular.module('modifiedNouns.drag', [])

.factory('Drag', function ($document, Geometry, Limit, Input, ModifiedNouns) {

  var pos = {};

  var vector, point, eventData, sessionId;

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
    Geometry.clearData();

    pos.x = level.position.left;
    pos.y = level.position.top;

    Limit.setXY(level.size, level.element.parent()[0].getBoundingClientRect());

    point = Geometry.registerPoint(eventPos);
  };

  var onMove = function (level, eventPos) {
    vector = Geometry.registerVector(point, eventPos);
    point  = Geometry.registerPoint(eventPos); // New, latest point

    pos.x = pos.x + vector.x;
    pos.y = pos.y + vector.y;

    pos = constrainPos(pos, Limit.check(pos));

    ModifiedNouns.positionLevel(level, pos.x, pos.y);
  };

  return {
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
        for (var id in Input.activeTouches) {
          if(Input.activeTouches.hasOwnProperty(id)) {
            // Delegate drag session to another active touch
            sessionId = id;
            onStart(level, Input.activeTouches[id]);

            return;
          }
        }
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