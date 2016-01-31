'use strict';

angular.module('modifiedNouns.zoom', [])

.factory('ZoomAnimation', function ($interval) {
  var FREQUENCY = 10;
  var DURATION = 200;
  var COUNT = DURATION / FREQUENCY;

  var cancel;

  return {
    start: function (zoom, zoomObj) {
      zoom(zoomObj);
      cancel = $interval(zoom, FREQUENCY, COUNT, false, zoomObj);

      return cancel;
    },
    stop: function () {
      if (angular.isDefined(cancel)) {
        $interval.cancel(cancel);
        cancel = undefined;
      }
    }
  };
})

.factory('Zoom',
  function (
    $window, $document, $timeout,
    Geometry, Limit, Input, ZoomAnimation, ModifiedNouns
  ) {

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

    var zoomTouch, prevLevel, level, position, cancel;

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

    var isZoom = function (touch1, touch2) {
             // One touch is stationary
      return (touch1.dir[0] === 0 && touch1.dir[1] === 0) ||
             (touch2.dir[0] === 0 && touch2.dir[1] === 0) ||
             // One of the axes are moving in different directions
             (touch1.dir[0] < 0 && touch2.dir[0] > 0) ||
             (touch1.dir[0] > 0 && touch2.dir[0] < 0) ||
             (touch1.dir[1] < 0 && touch2.dir[1] > 0) ||
             (touch1.dir[1] > 0 && touch2.dir[1] < 0) ||
             false;
    };

    var zoom = function (zoomTouch) {
      pos.z += zoomTouch.dir * curIncrement;
      pos = constrainScale(pos, Limit.check(pos));

      prevLevel = level;
      level = findLevel(pos, level);

      size = getScaledSize(size, pos.z);
      position = getScaledPosition(level, size, zoomTouch);

      ModifiedNouns.scaleLevel(level, size, position);

      if(!!prevLevel && prevLevel !== level) {
        ModifiedNouns.hideLevel(prevLevel);
      }
    };

    return {

      bind: function (element) {
        var zooming = false;

        var i = 0;

        var touches = [];
        var prevTouches = [];
        var touchVecs = [];

        var zoomVector, prevZoomVector;

        var _startZoom = function (zoomObj) {
          if(!zooming) {

            if(!level) {
              level = findLevel(pos);
            }

            zooming = true;
            $document.triggerHandler('zoomstart', level);
          }

          if(!!cancel) { $timeout.cancel(cancel); }
          cancel = $timeout(_endZoom, 200);

          zoom(zoomObj);
        };

        var _endZoom = function () {
          if(zooming) {
            zooming = false;
            $document.triggerHandler('zoomend', level);
          }
        };

        var _onMove = function () {
          prevTouches[0] = touches[0];
          prevTouches[1] = touches[1];

          touches[0] = Input.activeTouches[ Input.orderedTouches[0] ];
          touches[1] = Input.activeTouches[ Input.orderedTouches[1] ];

          prevZoomVector = zoomVector;
          zoomVector = Geometry.createVector(touches[0], touches[1]);

          if(!prevTouches[0] || !prevTouches[1]) {
            return;
          }

          touchVecs[0] = Geometry.createVector(prevTouches[0], touches[0]);
          touchVecs[1] = Geometry.createVector(prevTouches[1], touches[1]);

          if(isZoom(touchVecs[0], touchVecs[1])) {

            zoomTouch = {
              x: zoomVector.startX + zoomVector.x / 2,
              y: zoomVector.startY + zoomVector.y / 2,
              dir: zoomVector.length > prevZoomVector.length ? 1 : -1
            };

            _startZoom(zoomTouch);
          } else {
            _endZoom();
          }
        };

        // Double-touch
        element.on(Input.EVENTS.start, function (e) {
          ZoomAnimation.stop();

          $timeout(function () {
            var doubleTouch = Input.checkDoubleTouch();

            if(!!doubleTouch) {
              zoomTouch = {
                x: doubleTouch.finishX,
                y: doubleTouch.finishY,
                dir: 1
              };

              ZoomAnimation.start(_startZoom, zoomTouch);
            }
          });
        });

        // Drag-zoom
        element.on(Input.EVENTS.move, function (e) {
          if(Input.activeTouches.length > 1 && element[0] !== e.target) {
            i++;

            if(i % 2 === 0) { // Throttle for better data
              _onMove();
            }
          }
        });

        element.on('wheel', function (e) {
          e.preventDefault();

          zoomTouch = Input.getWheelTouch(e);

          if(!!zoomTouch.dir && element[0] !== e.target) {
            ZoomAnimation.stop();

            _startZoom(zoomTouch);
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