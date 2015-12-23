'use strict';

angular.module('modifiedNouns.input', [])

.factory('Drag', function ($window) {
  var point, vector, diffX, diffY, finishTime, length, duration;

  return {
    points: [],
    vectors: [],

    _register: function (item, array) {
      array.push(item);

      if(array.length > 10) {
        array.shift();
      }
    },

    getLength: function (a, b) {
      return $window.Math.sqrt(
        $window.Math.pow(a, 2) + $window.Math.pow(b, 2)
      );
    },

    clearData: function () {
      while (this.points.length > 0 || this.vectors.length > 0) {
        this.points.pop();
        this.vectors.pop();
      }
    },

    registerPoint: function (data) {
      point = {
        x: data.x,
        y: data.y,
        time: $window.Date.now()
      };

      this._register(point, this.points);

      return point;
    },

    registerVector: function (startPoint, finishPoint) {
      finishTime = $window.Date.now();
      duration = finishTime - startPoint.time;

      diffX = finishPoint.x - startPoint.x;
      diffY = finishPoint.y - startPoint.y;
      length = this.getLength(diffX, diffY);

      vector = {
        x: diffX,
        y: diffY,
        startX: startPoint.x,
        startY: startPoint.y,
        finishX: finishPoint.x,
        finishY: finishPoint.y,

        length: length,
        dir: [diffX / length, diffY / length],

        startTime: startPoint.time,
        finishTime: finishTime,
        duration: duration,

        rate: length / duration
      };

      this._register(vector, this.vectors);

      return vector;
    }
  };

})

.factory('Fling', function ($window, $interval, Limit) {
  var FREQUENCY = 10;
  var DURATION = 1000;
  var BOUNCE_DAMPER = 0.25;

  var COUNT = DURATION / FREQUENCY;

  var MAX_IDLE_TIME = 25;
  var MIN_POINTS = 6;

  var pos = {};

  var i, difference, easeFactor, cancel;

  var easeOut = function (curTime, duration, power){
    return 1 - $window.Math.pow(1 - (curTime / duration), power);
  };

  var calcBounce = function (value, limit) {
    difference = value - limit;
    return limit - difference * BOUNCE_DAMPER;
  };

  var bouncePos = function (pos, checkResult) {
    if(checkResult.x === 1) {
      pos.x = calcBounce(pos.x, checkResult.limits.maxX);
    }
    else if(checkResult.x === -1) {
      pos.x = calcBounce(pos.x, checkResult.limits.minX);
    }

    if(checkResult.y === 1) {
      pos.y = calcBounce(pos.y, checkResult.limits.maxY);
    }
    else if(checkResult.y === -1) {
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

})

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

//TODO: adapt to touch
.directive('draggable', function ($document, $window, Drag, Fling, Limit) {
  return {
    restrict: 'A',
    link: function(scope, element) {
      var $parent = element.parent();
      var pos = {};
      var flingData = {};

      var elementRect, vector, point, _point;
      var idleTime, startPoint, flingVector, flingLength;

      var positionElement = function (left, top) {
        element.css({
          left: left + 'px',
          top: top + 'px'
        });
      };

      var createFling = function () {
        startPoint = Drag.points[ Drag.points.length - Fling.MIN_POINTS ];
        flingVector = Drag.registerVector(startPoint, point);
        flingLength = flingVector.length * (flingVector.duration / 50);

        flingData.startX  = pos.x;
        flingData.finishX = pos.x + (flingVector.dir[0] * flingLength);
        flingData.startY  = pos.y;
        flingData.finishY = pos.y + (flingVector.dir[1] * flingLength);

        Fling.start(flingData, positionElement);
      };

      //TODO: stickiness on window resize
      var constrainPos = function (pos, checkResult) {
        pos.x = checkResult.x === -1 ?
          checkResult.limits.minX : checkResult.x === 1 ?
          checkResult.limits.maxX : pos.x;

        pos.y = checkResult.y === -1 ?
          checkResult.limits.minY : checkResult.y === 1 ?
          checkResult.limits.maxY : pos.y;

        return pos;
      };

      var onMousedown = function (e) {
        e.preventDefault();

        // Start with a clean sheet
        Fling.cancel();
        Drag.clearData();

        elementRect = element[0].getBoundingClientRect();

        pos.x = elementRect.left;
        pos.y = elementRect.top;

        Limit.$set(elementRect, $parent[0].getBoundingClientRect());

        point = Drag.registerPoint({ x: e.pageX, y: e.pageY });

        $document.on('mousemove', onMousemove); // Fires ~15ms
        $document.on('mouseup', onMouseup);
      };

      var onMousemove = function (e) {
        _point = { x: e.pageX, y: e.pageY };

        vector = Drag.registerVector(point, _point);
        point  = Drag.registerPoint(_point); // New, latest point

        pos.x = pos.x + vector.x;
        pos.y = pos.y + vector.y;

        pos = constrainPos(pos, Limit.check(pos.x, pos.y));

        positionElement(pos.x, pos.y);
      };

      var onMouseup = function () {
        if(!!point) {
          idleTime = $window.Date.now() - point.time;

          if(Fling.decide(idleTime, Drag.points.length)) {
            createFling();
          }
        }

        $document.off('mousemove', onMousemove);
        $document.off('mouseup', onMouseup);
      };

      element.on('mousedown', onMousedown);
    }
  };
});