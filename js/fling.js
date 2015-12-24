'use strict';

angular.module('modifiedNouns.fling', [])

.factory('Fling', function ($window, $interval, Limit) {
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

  var increment = function (data, callback) {
    i++;

    easeFactor = easeOut(i * FREQUENCY, DURATION, 3);

    pos.x = data.startX + (data.finishX - data.startX) * easeFactor;
    pos.y = data.startY + (data.finishY - data.startY) * easeFactor;

    pos = bouncePos(pos, Limit.check(pos.x, pos.y));

    callback(pos.x, pos.y);
  };

  return {
    MAX_IDLE_TIME: MAX_IDLE_TIME,
    MIN_POINTS: MIN_POINTS,
    // Heuristic
    decide: function (idleTime, numPoints) {
      return idleTime <= MAX_IDLE_TIME && numPoints >= MIN_POINTS;
    },

    start: function (data, callback) {
      i = 0;

      increment(data, callback);
      cancel = $interval(increment, FREQUENCY, COUNT, false, data, callback);

      return cancel;
    },

    cancel: function () {
      if (angular.isDefined(cancel)) {
        $interval.cancel(cancel);
        cancel = undefined;
      }
    }
  };

});