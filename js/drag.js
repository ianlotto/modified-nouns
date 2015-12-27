'use strict';

angular.module('modifiedNouns.drag', [])

.factory('Drag', function ($document, Input) {

  var EVENTS = {
    start: 'mousedown touchstart',
    move: 'mousemove touchmove',
    end: 'mouseup touchend'
  };

  return {
    bindHandlers: function (element, handlers) {

      var onStart = function (e) {
        handlers.onStart(Input.getPos(e));

        $document.on(EVENTS.move, onMove);
        $document.on(EVENTS.end, onEnd);
      };

      var onMove = function (e) {
        handlers.onMove(Input.getPos(e));
      };

      var onEnd = function () {
        handlers.onEnd();

        $document.off(EVENTS.move, onMove);
        $document.off(EVENTS.end, onEnd);
      };

      element.on(EVENTS.start, onStart);
    }
  };

})

.directive('drag', function ($window, Geometry, Drag, Fling, Limit) {
  return {
    restrict: 'A',
    link: function(scope, element) {
      var $parent = element.parent();
      var pos = {};
      var flingData = {};

      var elementRect, vector, point;
      var idleTime, startPoint, flingVector, flingLength;

      var positionElement = function (left, top) {
        element.css({
          left: left + 'px',
          top: top + 'px'
        });
      };

      var createFling = function () {
        startPoint = Geometry.points[ Geometry.points.length - Fling.MIN_POINTS ];
        flingVector = Geometry.registerVector(startPoint, point);
        flingLength = flingVector.length * (flingVector.duration / 50);

        flingData.startX  = pos.x;
        flingData.finishX = pos.x + (flingVector.dir[0] * flingLength);
        flingData.startY  = pos.y;
        flingData.finishY = pos.y + (flingVector.dir[1] * flingLength);

        Fling.start(flingData, positionElement);
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

      Drag.bindHandlers(element, {
        onStart: function (eventPos) {
          Fling.cancel(); // Start with a clean sheet
          Geometry.clearData();

          elementRect = element[0].getBoundingClientRect();

          pos.x = elementRect.left;
          pos.y = elementRect.top;

          Limit.$set(elementRect, $parent[0].getBoundingClientRect());

          point = Geometry.registerPoint(eventPos);
        },
        // TODO: stickiness on window resize
        onMove: function (eventPos) {
          vector = Geometry.registerVector(point, eventPos);
          point  = Geometry.registerPoint(eventPos); // New, latest point

          pos.x = pos.x + vector.x;
          pos.y = pos.y + vector.y;

          pos = constrainPos(pos, Limit.check(pos.x, pos.y));

          positionElement(pos.x, pos.y);
        },
        onEnd: function () {
          if(!!point) {
            idleTime = $window.Date.now() - point.time;

            if(Fling.decide(idleTime, Geometry.points.length)) {
              createFling();
            }
          }
        }
      });
    }
  };
});