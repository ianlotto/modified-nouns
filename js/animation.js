'use strict';

angular.module('modifiedNouns.animation', [])

.factory('Animation', function ($window, $interval, Limit, ModifiedNouns) {

  var FREQUENCY = 10;
  var DURATION = 1000;
  var BOUNCE_DAMPER = 0.25;
  var COUNT = DURATION / FREQUENCY;

  var pos = {};

  var i, difference, easeFactor, cancel, curLimit, checkResult;

  var easeOut = function (curTime, duration, power) {
    return 1 - $window.Math.pow(1 - (curTime / duration), power);
  };

  var calcBounce = function (value, limit) {
    difference = value - limit;
    return limit - difference * BOUNCE_DAMPER;
  };

  var bouncePos = function (pos, data) {
    checkResult = Limit.check(pos);

    if(checkResult.x !== 0) {
      curLimit = checkResult.x === 1 ? 'maxX' : 'minX';

      data.finishX = calcBounce(data.finishX, checkResult.limits[curLimit]);
      pos.x = data.startX = checkResult.limits[curLimit];
      data.startY = pos.y;

      i = 0;
    }

    if(checkResult.y !== 0) {
      curLimit = checkResult.y === 1 ? 'maxY' : 'minY';

      data.finishY = calcBounce(data.finishY, checkResult.limits[curLimit]);
      pos.y = data.startY = checkResult.limits[curLimit];
      data.startX = pos.x;

      i = 0;
    }

    return pos;
  };

  var increment = function (data, level, limit) {
    i++;

    easeFactor = easeOut(i * FREQUENCY, DURATION, 3);

    pos.x = data.startX + (data.finishX - data.startX) * easeFactor;
    pos.y = data.startY + (data.finishY - data.startY) * easeFactor;

    pos = limit(pos, data);

    ModifiedNouns.positionLevel(level, pos.x, pos.y);
  };

  var start = function (data, level, limit) {
    stop();

    i = 0;

    limit = limit === 'constrain' ? Limit.constrainPos.bind(Limit) : bouncePos;

    increment(data, level, limit);
    cancel = $interval(increment, FREQUENCY, COUNT, false, data, level, limit);

    return cancel;
  };

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
  function ($window, $document, Geometry, Input, Drag, Animation) {

    var MAX_IDLE_TIME = 25;
    var MIN_POINTS = 6;

    var fling = {};

    var idleTime, lastPoint, startPoint, flingVector, flingLength;

    var decide = function (idleTime, numPoints) { // Heuristic
      return idleTime <= MAX_IDLE_TIME && numPoints >= MIN_POINTS;
    };

    var create = function (level, startPoint, lastPoint) {
      flingVector = Geometry.createVector(startPoint, lastPoint);
      flingLength = flingVector.length * (flingVector.duration / 50);

      fling.startX  = level.position.left;
      fling.finishX = level.position.left + (flingVector.dir[0] * flingLength);
      fling.startY  = level.position.top;
      fling.finishY = level.position.top + (flingVector.dir[1] * flingLength);

      Animation.start(fling, level);
    };

    return {
      bind: function (element) {

        element.on(Input.EVENTS.start, function () {
          Animation.stop();
        });

        $document.on('zoomstart', function (e, level) {
          if(!!level && level.element === element) {
            Animation.stop();
          }
        });

        element.on('dragstart', function () {
          $document.one('dragend', onEnd);
        });

        var onEnd = function (e, level) {
          lastPoint = Drag.points[ Drag.points.length - 1 ];

          if(!!lastPoint && Input.activeTouches.length === 0) {
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