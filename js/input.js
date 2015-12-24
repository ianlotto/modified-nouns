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

// TODO: differentiate between single and multi touch events
.factory('Input', function () {
  var pos = {};

  var touch, changedTouch;

  return {
    // Normalize between mouse and touch
    getPos: function (e) {
      touch = (!!e.touches && e.touches.length > 0 && e.touches[0]) || e;
      changedTouch = !!e.changedTouches && e.changedTouches[0];

      touch = changedTouch || touch;

      pos.x = touch.pageX;
      pos.y = touch.pageY;

      return pos;
    }
  };
});