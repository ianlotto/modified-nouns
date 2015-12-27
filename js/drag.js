'use strict';

angular.module('modifiedNouns.drag', [])

.factory('Drag', function ($document, Input) {

  return {
    bindHandlers: function (element, handlers) {

      var onStart = function (e) {
        handlers.onStart(Input.getPos(e));

        $document.on(Input.EVENTS.move, onMove);
        $document.on(Input.EVENTS.end, onEnd);
      };

      var onMove = function (e) {
        handlers.onMove(Input.getPos(e));
      };

      var onEnd = function () {
        handlers.onEnd();

        $document.off(Input.EVENTS.move, onMove);
        $document.off(Input.EVENTS.end, onEnd);
      };

      element.on(Input.EVENTS.start, onStart);
    }
  };

})

.directive('drag', function ($window, Geometry, Drag, Limit, positionElement) {
  return {
    restrict: 'A',
    link: function(scope, element) {
      var $parent = element.parent();
      var pos = {};

      var elementRect, vector, point;

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

          positionElement(element, pos.x, pos.y);
        },
        onEnd: angular.noop
      });
    }
  };
});