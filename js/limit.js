'use strict';

angular.module('modifiedNouns.limit', [])

.factory('Limit', function (ModifiedNouns) {
  var orderedLimits = [];
  var limits = {};
  var limitCheck = { limits: limits };

  var widerParent, tallerParent, curLevel;

  return {
    setXY: function (startData, parentData) {
      widerParent = parentData.width > startData.width;
      tallerParent = parentData.height > startData.height;

      orderedLimits[0] = parentData.left;
      orderedLimits[1] = parentData.width - startData.width;

      limits.minX = widerParent ? orderedLimits[0] : orderedLimits[1];
      limits.maxX = widerParent ? orderedLimits[1] : orderedLimits[0];

      orderedLimits[2] = parentData.top;
      orderedLimits[3] = parentData.height - startData.height;

      limits.minY = tallerParent ? orderedLimits[2] : orderedLimits[3];
      limits.maxY = tallerParent ? orderedLimits[3] : orderedLimits[2];
    },

    setZ: function (max, min) {
      limits.maxZ = max;
      limits.minZ = min;
    },

    check: function (pos) {
      limitCheck.x = pos.x < limits.minX ? -1 : pos.x > limits.maxX ? 1 : 0;
      limitCheck.y = pos.y < limits.minY ? -1 : pos.y > limits.maxY ? 1 : 0;
      limitCheck.z = pos.z < limits.minZ ? -1 : pos.z > limits.maxZ ? 1 : 0;

      return limitCheck;
    },

    onResize: function (parentData) {
      curLevel = ModifiedNouns.getCurLevel();

      var diffX = parentData.width - (curLevel.position.left + curLevel.size.width);

      // TODO: quick resizes don't work.

      if(curLevel.size.width < parentData.width) {

        // - when level is smaller than window and window is being shrunk, first take away from right / bottom, then take away from left / top.
        if(diffX < 0) {

          ModifiedNouns.positionLevel(
            curLevel,
            Math.floor(parentData.width - curLevel.size.width),
            curLevel.position.top
          );

        }

      } else {
        // - when level is larger than window in a dim and window is being enlarged the level should be anchored to enlarged side, if need be.

        if(diffX > 0) {

          ModifiedNouns.positionLevel(
            curLevel,
            curLevel.position.left + diffX,
            curLevel.position.top
          );

        }

      }

    }

  };

})

.directive('watchResize', function ($window, Limit) {
  return {
    restrict: 'A',
    link: function (scope, element) {
      angular.element($window).on('resize', function (e) {
        Limit.onResize(element[0].getBoundingClientRect());
      });
    }
  };
});