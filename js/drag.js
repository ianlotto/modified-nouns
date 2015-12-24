'use strict';

angular.module('modifiedNouns.drag', [])

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

.directive('draggable',
  function ($document, $window, Drag, Fling, Limit, Input) {
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

        var constrainPos = function (pos, checkResult) {
          pos.x = checkResult.x === -1 ?
            checkResult.limits.minX : checkResult.x === 1 ?
            checkResult.limits.maxX : pos.x;

          pos.y = checkResult.y === -1 ?
            checkResult.limits.minY : checkResult.y === 1 ?
            checkResult.limits.maxY : pos.y;

          return pos;
        };

        var onStart = function (e) {
          Fling.cancel(); // Start with a clean sheet
          Drag.clearData();

          elementRect = element[0].getBoundingClientRect();

          pos.x = elementRect.left;
          pos.y = elementRect.top;

          Limit.$set(elementRect, $parent[0].getBoundingClientRect());

          point = Drag.registerPoint(Input.getPos(e));

          toggleHandlers('on');
        };

        //TODO: stickiness on window resize
        var onMove = function (e) {
          _point = Input.getPos(e);

          vector = Drag.registerVector(point, _point);
          point  = Drag.registerPoint(_point); // New, latest point

          pos.x = pos.x + vector.x;
          pos.y = pos.y + vector.y;

          pos = constrainPos(pos, Limit.check(pos.x, pos.y));

          positionElement(pos.x, pos.y);
        };

        var onEnd = function () {
          if(!!point) {
            idleTime = $window.Date.now() - point.time;

            if(Fling.decide(idleTime, Drag.points.length)) {
              createFling();
            }
          }

          toggleHandlers('off');
        };

        var toggleHandlers = function (state) {
          $document[state]('mousemove touchmove', onMove);
          $document[state]('mouseup touchend', onEnd);
        };

        element.on('mousedown touchstart', onStart);
      }
    };
  }
);