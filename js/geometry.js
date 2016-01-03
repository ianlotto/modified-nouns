'use strict';

angular.module('modifiedNouns.geometry', [])

.factory('Geometry', function ($window) {

  var diffX, diffY, finishTime, length, duration;

  return {

    getLength: function (a, b) {
      return $window.Math.sqrt(
        $window.Math.pow(a, 2) + $window.Math.pow(b, 2)
      );
    },

    createPoint: function (data) {
      return {
        x: data.x,
        y: data.y,
        time: $window.Date.now()
      };
    },

    createVector: function (startPoint, finishPoint) {
      finishTime = $window.Date.now();
      startPoint.time = startPoint.time || finishTime;

      duration = finishTime - startPoint.time;

      diffX = finishPoint.x - startPoint.x;
      diffY = finishPoint.y - startPoint.y;
      length = this.getLength(diffX, diffY);

      return {
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
    }
  };

});