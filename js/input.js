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

.directive('draggable', function ($document, $window, Drag) {
  return {
    restrict: 'A',
    link: function(scope, element) {
      var mousedown = false;
      
      var startData, clientRect, _point, point;
      
      var getElementPos = function () {
        clientRect = element[0].getBoundingClientRect();
                
        return {
          top: clientRect.top,
          left: clientRect.left
        };
      };
      
      var onMousedown = function (e) {
        e.preventDefault();
        
        mousedown = true;
        
        // Store element and mouse positions on initial mousedown
        startData = getElementPos();
        startData.mouseX = e.pageX;
        startData.mouseY = e.pageY;
        
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
          
          element.css({
            left: startData.left + (_point.x - startData.mouseX) + 'px',
            top: startData.top + (_point.y - startData.mouseY) + 'px'
          });
        }
      };
      
      //TODO: incorporate decceleration curve
      //TODO: figure out how long and far to 'throw' it for
      //TODO: incoporate bouncing of limits at angles
      
      var lastVector, mouseupTime, idleTime;
      
      var onMouseup = function (e) {
        if(mousedown) {
          mousedown = false;
          
          mouseupTime = $window.Date.now();
          lastVector = Drag.vectors[ Drag.vectors.length - 1 ];
          
          if(!!lastVector) {
            idleTime = mouseupTime - lastVector.finishTime;
          }
          
          // Heuristic for now
          if(idleTime < 25 && Drag.vectors.length > 5) {
            
            var startVector = Drag.vectors[ Drag.vectors.length - 5 ];
            
            // build a normalized vector from the last five vectors
            var x = lastVector.finishX - startVector.startX;
            var y = lastVector.finishY - startVector.startY;
            
            var vecLength = Drag.getLength(x, y);
            var dir = [x / vecLength, y / vecLength];
            
            var frequency = 5;
            var i = 0;
            
            // Keep as constant for now
            var duration = 1000;
            
            var intNum = duration / frequency;
            
            // Let's see how this does...
            var length = lastVector.duration * lastVector.length;
            
            var diffX, diffY, left, top;
            
            var intId = setInterval(function () {
              i++;
              
              diffX = dir[0] * frequency * i;
              diffY = dir[1] * frequency * i;
              
              left = startData.left + (point.x - startData.mouseX) + diffX;
              top = startData.top + (point.y - startData.mouseY) + diffY;
              
              element.css({
                left: left + 'px',
                top: top + 'px'
              });

            }, frequency);
            
            setTimeout(function () {
              clearInterval(intId);
            }, duration);
            
          }
          
          $document.off('mousemove', onMousemove);
          $document.off('mouseup', onMouseup);
        }
      };
      
      element.on('mousedown', onMousedown);
    }
  };
});