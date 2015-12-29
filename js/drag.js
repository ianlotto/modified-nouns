'use strict';

angular.module('modifiedNouns.drag', [])

.factory('Drag', function ($document, Geometry, Limit, Input, positionEl) {

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

  var onStart = function (element, eventPos) {
    Geometry.clearData();

    elementRect = element[0].getBoundingClientRect();

    pos.x = elementRect.left;
    pos.y = elementRect.top;

    Limit.$set(elementRect, element.parent()[0].getBoundingClientRect());

    point = Geometry.registerPoint(eventPos);
  };

  var onMove = function (element, eventPos) {
    vector = Geometry.registerVector(point, eventPos);
    point  = Geometry.registerPoint(eventPos); // New, latest point

    pos.x = pos.x + vector.x;
    pos.y = pos.y + vector.y;

    pos = constrainPos(pos, Limit.check(pos.x, pos.y));

    positionEl(element, pos.x, pos.y);
  };

  var eventData, sessionId;

  return {
    sessionId: null,

    bind: function (element) {
      element.on(Input.EVENTS.start, function (e) {
        if(!!sessionId) { return; } // Allow only one drag session at a time

        eventData = Input.getTouches(e)[0];

        if(!!eventData) {
          Input.dragging = true;
          sessionId = eventData.id;

          onStart(element, eventData);

          $document.on(Input.EVENTS.move, _onMove);
          $document.on(Input.EVENTS.end, _onEnd);
        }
      });

      var _onMove = function (e) {
        eventData = Input.activeTouches[sessionId];

        if(!!eventData) {
          onMove(element, eventData);
        }
      };

      var _onEnd = function () {
        // TODO: start a drag session with another touch if it's there
        if(!Input.activeTouches[sessionId]) {
          Input.dragging = false;
          sessionId = null;

          $document.off(Input.EVENTS.move, _onMove);
          $document.off(Input.EVENTS.end, _onEnd);
        }
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