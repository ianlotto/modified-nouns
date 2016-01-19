'use strict';

angular.module('modifiedNouns.fling', [])

.factory('FlingAnimation', function ($window, $interval, Limit, ModifiedNouns) {

  var FREQUENCY = 10;
  var DURATION = 1000;
  var BOUNCE_DAMPER = 0.25;
  var COUNT = DURATION / FREQUENCY;

  var pos = {};

  var i, difference, easeFactor, cancel;

  var easeOut = function (curTime, duration, power) {
    return 1 - $window.Math.pow(1 - (curTime / duration), power);
  };

  var calcBounce = function (value, limit) {
    difference = value - limit;
    return limit - difference * BOUNCE_DAMPER;
  };

  var bouncePos = function (pos, checkResult) {
    if(checkResult.x === 1) {
      pos.x = calcBounce(pos.x, checkResult.limits.maxX);
    } else if(checkResult.x === -1) {
      pos.x = calcBounce(pos.x, checkResult.limits.minX);
    }

    if(checkResult.y === 1) {
      pos.y = calcBounce(pos.y, checkResult.limits.maxY);
    } else if(checkResult.y === -1) {
      pos.y = calcBounce(pos.y, checkResult.limits.minY);
    }

    return pos;
  };

  var increment = function (data, level) {
    i++;

    easeFactor = easeOut(i * FREQUENCY, DURATION, 3);

    pos.x = data.startX + (data.finishX - data.startX) * easeFactor;
    pos.y = data.startY + (data.finishY - data.startY) * easeFactor;

    pos = bouncePos(pos, Limit.check(pos));

    ModifiedNouns.positionLevel(level, pos.x, pos.y);
  };

  var start = function (data, level) {
    i = 0;

    increment(data, level);
    cancel = $interval(increment, FREQUENCY, COUNT, false, data, level);

    return cancel;
  };

  // TODO: kill fling when zooming begins
  var stop = function () {
    if (angular.isDefined(cancel)) {
      $interval.cancel(cancel);
      cancel = undefined;
    }
  };

  return {
    start: start,
    stop: stop
  };

})

.factory('Fling',
  function ($window, $document, Geometry, Input, Drag, FlingAnimation) {

    var MAX_IDLE_TIME = 25;
    var MIN_POINTS = 6;

    var fling = {};

    var idleTime, lastPoint, startPoint, flingVector, flingLength;

    var decide = function (idleTime, numPoints) { // Heuristic
      return idleTime <= MAX_IDLE_TIME && numPoints >= MIN_POINTS;
    };

    var create = function (level, startPoint, lasPoint) {
      flingVector = Geometry.createVector(startPoint, lasPoint);
      flingLength = flingVector.length * (flingVector.duration / 50);

      fling.startX  = level.position.left;
      fling.finishX = level.position.left + (flingVector.dir[0] * flingLength);
      fling.startY  = level.position.top;
      fling.finishY = level.position.top + (flingVector.dir[1] * flingLength);

      FlingAnimation.start(fling, level);
    };

    return {
      bind: function (element) {

        element.on(Input.EVENTS.start, function () {
          FlingAnimation.stop();
        });

        element.on('dragstart', function () {
          $document.on('dragend', onEnd);
        });

        var onEnd = function (e, level) {
          lastPoint = Drag.points[ Drag.points.length - 1 ];

          if(!!lastPoint) {
            idleTime = $window.Date.now() - lastPoint.time;

            if(decide(idleTime, Drag.points.length)) {
              startPoint = Drag.points[
                Drag.points.length - MIN_POINTS
              ];

              create(level, startPoint, lastPoint);
            }
          }

          $document.off('dragend', onEnd);
        };

      }
    };

  }
)

.directive('fling', function (Fling) {
  return {
    restrict: 'A',
    link: function (scope, element) {
      Fling.bind(element);
    }
  };
});