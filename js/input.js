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
      };
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

.factory('Fling', function ($window, $interval) {
  var FREQUENCY = 10;
  var DURATION = 1000;
  var COUNT = DURATION / FREQUENCY;
  
  var MAX_IDLE_TIME = 25;
  var MIN_POINTS = 6;
  
  var i, left, top, easeFactor, cancel;
  
  var easeOut = function (curTime, duration, power){
    return 1 - $window.Math.pow(1 - (curTime / duration), power);
  };
  
  var increment = function (data, callback) {
    i++;
    
    easeFactor = easeOut(i * FREQUENCY, DURATION, 3);
    
    top = data.startY + (data.finishY - data.startY) * easeFactor;
    left = data.startX + (data.finishX - data.startX) * easeFactor;
    
    callback(top, left);
  };
  
  return {
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

.directive('draggable', function ($document, $window, Drag, Fling) {
  return {
    restrict: 'A',
    link: function(scope, element) {
      var mousedown = false;
      
      var startData, clientRect, _point, point, idleTime, flingData;
      var flingVector, flingLength, startX, startY;
      
      var getElementPos = function () {
        clientRect = element[0].getBoundingClientRect();
                
        return {
          top: clientRect.top,
          left: clientRect.left
        };
      };
      
      var positionElement = function (top, left) {
        element.css({
          top: top + 'px',
          left: left + 'px'
        });
      };
      
      var startFling = function (startPoint, finishPoint) {
        flingVector = Drag.registerVector(startPoint, finishPoint);
        flingLength = flingVector.length * (flingVector.duration / 50);     
        
        startX = startData.left + (finishPoint.x - startData.mouseX);
        startY = startData.top + (finishPoint.y - startData.mouseY);
        
        flingData = {
          startX: startX,
          finishX: startX + (flingVector.dir[0] * flingLength),
          
          startY: startY,
          finishY: startY + (flingVector.dir[1] * flingLength)
        };
        
        Fling.start(flingData, positionElement);
      };
      
      var onMousedown = function (e) {
        e.preventDefault();
        
        mousedown = true;
        
        // Store element and mouse positions on initial mousedown
        startData = getElementPos();
        startData.mouseX = e.pageX;
        startData.mouseY = e.pageY;
        
        Fling.cancel();
        Drag.clearData(); // Start with a clean sheet
        
        point = Drag.registerPoint({ x: e.pageX, y: e.pageY });
        
        $document.on('mousemove', onMousemove);
        $document.on('mouseup', onMouseup);
      };
      
      // Fires about 15ms intervals
      var onMousemove = function (e) {
        if(mousedown) {
          _point = { x: e.pageX, y: e.pageY };
          
          Drag.registerVector(point, _point);
          point = Drag.registerPoint(_point);
          
          positionElement(
            startData.top + (_point.y - startData.mouseY),
            startData.left + (_point.x - startData.mouseX)
          );
        }
      };
      
      //TODO: incoporate bouncing of limits at angles
      //TODO: adapt to touch
      
      var onMouseup = function (e) {
        if(mousedown) {
          mousedown = false;
          
          if(!!point) {
            idleTime = $window.Date.now() - point.time;
          }
          
          if(Fling.decide(idleTime, Drag.points.length)) {
            var startPoint = Drag.points[ Drag.points.length - 6 ];
            startFling(startPoint, point);
          }
          
          $document.off('mousemove', onMousemove);
          $document.off('mouseup', onMouseup);
        }
      };
      
      element.on('mousedown', onMousedown);
    }
  };
});