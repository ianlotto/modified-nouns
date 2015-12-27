'use strict';

angular.module('modifiedNouns.fling', [])

.factory('Fling', function ($window, $interval, Limit, positionElement) {
  var FREQUENCY = 10;
  var DURATION = 1000;
  var BOUNCE_DAMPER = 0.25;

  var COUNT = DURATION / FREQUENCY;

  var MAX_IDLE_TIME = 25;
  var MIN_POINTS = 6;

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

  var increment = function (data, element) {
    i++;

    easeFactor = easeOut(i * FREQUENCY, DURATION, 3);

    pos.x = data.startX + (data.finishX - data.startX) * easeFactor;
    pos.y = data.startY + (data.finishY - data.startY) * easeFactor;

    pos = bouncePos(pos, Limit.check(pos.x, pos.y));

    positionElement(element, pos.x, pos.y);
  };

  return {
    MAX_IDLE_TIME: MAX_IDLE_TIME,
    MIN_POINTS: MIN_POINTS,
    // Heuristic
    decide: function (idleTime, numPoints) {
      return idleTime <= MAX_IDLE_TIME && numPoints >= MIN_POINTS;
    },

    start: function (data, element) {
      i = 0;

      increment(data, element);
      cancel = $interval(increment, FREQUENCY, COUNT, false, data, element);

      return cancel;
    },

    cancel: function () {
      if (angular.isDefined(cancel)) {
        $interval.cancel(cancel);
        cancel = undefined;
      }
    }
  };

})

.directive('fling', function ($window, $document, Geometry, Input, Fling) {

  return {
    restrict: 'A',
    link: function (scope, element) {
      var flingData = {};

      var idleTime, lastPoint, startPoint, flingVector, flingLength;

      var createFling = function (startPoint, lasPoint) {
        flingVector = Geometry.registerVector(startPoint, lasPoint);
        flingLength = flingVector.length * (flingVector.duration / 50);

        flingData.startX  = pos.x;
        flingData.finishX = pos.x + (flingVector.dir[0] * flingLength);
        flingData.startY  = pos.y;
        flingData.finishY = pos.y + (flingVector.dir[1] * flingLength);

        Fling.start(flingData, element);
      };

      var onStart = function () {
        Fling.cancel();
        $document.on(Input.EVENTS.end, onEnd);
      };

      var onEnd = function () {
        lastPoint = Geometry.points[ Geometry.points.length - 1 ];

        if(!!lastPoint) {
          idleTime = $window.Date.now() - lastPoint.time;

          if(Fling.decide(idleTime, Geometry.points.length)) {
            startPoint = Geometry.points[
              Geometry.points.length - Fling.MIN_POINTS
            ];

            createFling(startPoint, lasPoint);
          }
        }

        $document.off(Input.EVENTS.end, onEnd);
      };

      element.on(Input.EVENTS.start, onStart);
    }
  };

});