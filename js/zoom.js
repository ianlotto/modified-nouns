'use strict';

angular.module('modifiedNouns.zoom', [])

.factory('Zoom',
  function ($window, $timeout, Geometry, Limit, Input, ModifiedNouns) {

    var maxZ = 1;
    var minZ = $window.Math.pow(2, -ModifiedNouns.levels.length);
    var scalePower = 0;

    while($window.Math.round(minZ) !== minZ) {
      maxZ *= 10;
      minZ *= 10;
      scalePower += 1;
    }

    Limit.setZ(maxZ, minZ);

    var baseIncrement = $window.Math.pow(10, scalePower - 2);
    var curIncrement = baseIncrement;

    var levels = ModifiedNouns.levels;
    var scaledRanges = new $window.Array(ModifiedNouns.levels.length);

    var pos = { z: maxZ };
    var size = {};
    var offset = {};

    var wheelTouch, prevLevel, level, position, cancel;

    var getScaledSize = function (size, z) {
      size.width = ModifiedNouns.FULL_SIZE.width * z / maxZ;
      size.height = ModifiedNouns.FULL_SIZE.height * z / maxZ;

      return size;
    };

    var getScaledPosition = function (level, size, center) {
      offset.x = (center.x - level.position.left);
      offset.y = (center.y - level.position.top);

      offset.newX = size.width * (offset.x / level.size.width);
      offset.newY = size.height * (offset.y / level.size.height);

      return {
        x: level.position.left - (offset.newX - offset.x),
        y: level.position.top - (offset.newY - offset.y)
      };
    };

    var constrainScale = function (pos, checkResult) {
      pos.z = checkResult.z === -1 ?
        checkResult.limits.minZ : checkResult.z === 1 ?
        checkResult.limits.maxZ : pos.z;

      return pos;
    };

    var findLevel = function (pos, level) {
      // Check the current level first
      if(!level || !inRange(pos.z, scaledRanges[level.order])) {
        for (var i = 0; i < levels.length; i++) {
          // Lazy-build scaled range
          if(!scaledRanges[i]) {
            buildScaledRange(i);
          }

          if(inRange(pos.z, scaledRanges[i])) {
            // Correct pos.z to new increment
            if(curIncrement !== scaledRanges[i].increment) {
              pos.z += (level.order < i) ?
                scaledRanges[i].increment : curIncrement;
            }

            level = levels[i];
            curIncrement = scaledRanges[i].increment;

            break;
          }
        }
      }

      return level;
    };

    var inRange = function (z, range) {
      return !!(z <= range.max && z >= range.min);
    };

    var buildScaledRange = function (i) {
      scaledRanges[i] = {};

      scaledRanges[i].max = levels[i].range.max * maxZ;
      scaledRanges[i].min = levels[i].range.min * maxZ;
      scaledRanges[i].increment = baseIncrement;

      while(
        scaledRanges[i].max % scaledRanges[i].increment !== 0 ||
        scaledRanges[i].min % scaledRanges[i].increment !== 0
      ) {
        scaledRanges[i].increment /= 2;
      }

      return scaledRanges[i];
    };

    var zoom = function (wheelTouch) {
      pos.z += wheelTouch.dir * curIncrement;
      pos = constrainScale(pos, Limit.check(pos));

      prevLevel = level;
      level = findLevel(pos, level);

      size = getScaledSize(size, pos.z);
      position = getScaledPosition(level, size, wheelTouch);

      ModifiedNouns.scaleLevel(level, size, position);

      if(!!prevLevel && prevLevel !== level) {
        ModifiedNouns.hideLevel(prevLevel);
      }
    };

    var startPoint, endPoint, zoomVector, prevVector;

    return {
      zooming: false,

      // with touch: if both are moving, we zoom, else we drag.

      // there should be an either / or with zoom / drag.
      // let a zoom override and stop a drag session?

      bind: function (element) {
        var _zoom = this;

        element.on(Input.EVENTS.start, function (e) {
          if(Input.activeTouches.length > 1 && element[0] !== e.target) {

            startPoint = Input.activeTouches[ Input.orderedTouches[0] ];
            endPoint = Input.activeTouches[ Input.orderedTouches[1] ];

            zoomVector = Geometry.createVector(startPoint, endPoint);

          }
        });

        element.on(Input.EVENTS.move, function (e) {
          if(Input.activeTouches.length > 1 && element[0] !== e.target) {

            startPoint = Input.activeTouches[ Input.orderedTouches[0] ];
            endPoint = Input.activeTouches[ Input.orderedTouches[1] ];

            //TODO: code to analyze the two vectors and decide if we should
            // drag or zoom
            prevVector = zoomVector;
            zoomVector = Geometry.createVector(startPoint, endPoint);

            var centerX = zoomVector.startX + zoomVector.x / 2;
            var centerY = zoomVector.startY + zoomVector.y / 2;

            var dir = !!prevVector && zoomVector.length > prevVector.length ? 1 : -1;

            var zoomObj = { x: centerX, y: centerY, dir: dir };

            // TODO: try to slow this down a bit
            zoom(zoomObj);
          }
        });

        element.on('wheel', function (e) {
          e.preventDefault();

          wheelTouch = Input.getWheelTouch(e);

          if(!!wheelTouch.dir && element[0] !== e.target) {
            _zoom.zooming = true;

            if(!!cancel) {
              $timeout.cancel(cancel);
            }

            cancel = $timeout(function () {
              _zoom.zooming = false;
            }, 200);

            zoom(wheelTouch);
          }
        });
      }
    };

  }
)

.directive('zoom', function (Zoom) {
  return {
    restrict: 'A',
    link: function (scope, element) {
      Zoom.bind(element);
    }
  };
});