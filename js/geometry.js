'use strict';

angular.module('modifiedNouns.geometry', [])

.factory('Geometry', function ($window) {

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

});