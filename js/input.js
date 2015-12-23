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

.factory('Fling', function ($window, $interval, Limit) {
  var FREQUENCY = 10;
  var DURATION = 1000;
  var BOUNCE_DAMPER = .25;
  
  var COUNT = DURATION / FREQUENCY;
  
  var MAX_IDLE_TIME = 25;
  var MIN_POINTS = 6;
  
  var i, left, top, easeFactor, cancel, checkResult;
  
  var easeOut = function (curTime, duration, power){
    return 1 - $window.Math.pow(1 - (curTime / duration), power);
  };
  
  var increment = function (data, callback) {
    i++;
    
    easeFactor = easeOut(i * FREQUENCY, DURATION, 3);
    
    left = data.startX + (data.finishX - data.startX) * easeFactor;
    top = data.startY + (data.finishY - data.startY) * easeFactor;
    
    checkResult = Limit.check(left, top);
    
    var d;
    
    if(checkResult.x === 1) {
      d = left - checkResult.limits.maxX;
      left = checkResult.limits.maxX - d * BOUNCE_DAMPER;
    }
    else if(checkResult.x === -1) {
      d = left - checkResult.limits.minX;
      left = checkResult.limits.minX - d * BOUNCE_DAMPER;
    }
    
    if(checkResult.y === 1) {
      d = top - checkResult.limits.maxY;
      top = checkResult.limits.maxY - d * BOUNCE_DAMPER;
    }
    else if(checkResult.y === -1) {
      d = top - checkResult.limits.minY;
      top = checkResult.limits.minY - d * BOUNCE_DAMPER;
    }
    
    callback(left, top);
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

.factory('Limit', function () {
  var limits = {};
  var limitCheck = { limits: limits };
  
  return {
    
    $set: function (startData, parentData) {
      limits.maxX = parentData.left;
      limits.minX = parentData.width - startData.width;
      
      limits.maxY = parentData.top
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
      var mousedown = false;
      var $parent = element.parent();
      
      var startData, _point, point, idleTime, flingData;
      var flingVector, flingLength, checkResult, startX, startY, posX, posY;
            
      var positionElement = function (left, top) {
        element.css({
          left: left + 'px',
          top: top + 'px'
        });
      };
      
      //TODO: port to Fling
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
        
        // Start with a clean sheet
        Fling.cancel();
        Drag.clearData();
        
        // Store element and mouse positions on initial mousedown
        startData = element[0].getBoundingClientRect();
        startData.mouseX = e.pageX;
        startData.mouseY = e.pageY;
        
        Limit.$set(startData, $parent[0].getBoundingClientRect());
        
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
          
          //TODO: fix stickiness when out of limits and coming back
          posX = startData.left + (_point.x - startData.mouseX);
          posY = startData.top + (_point.y - startData.mouseY);
          
          checkResult = Limit.check(posX, posY);
          
          posX = checkResult.x === -1 ? 
            checkResult.limits.minX : checkResult.x === 1 ?
            checkResult.limits.maxX : posX;
          
          posY = checkResult.y === -1 ?
            checkResult.limits.minY : checkResult.y === 1 ?
            checkResult.limits.maxY : posY;
      
          positionElement(posX, posY);
        }
      };
      
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