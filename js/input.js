'use strict';

angular.module('modifiedNouns.input', [])

.factory('Drag', function ($window) {
  var point, vector, diffX, diffY, finishTime, length, duration;
  
  var getLength = function (a, b) {
    return $window.Math.sqrt(
      $window.Math.pow(a, 2) + $window.Math.pow(b, 2)
    );
  };
  
  return {
    points: [],
    vectors: [],
    
    _register: function (item, array) {
      array.push(item);
      
      if(array.length > 10) {
        array.shift();
      };
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
      length = getLength(diffX, diffY);
      
      vector = {
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
      var _elementPos = {};
      
      var drag, startX, startY, startTime, elementPos, clientRect;
      
      var _point, point;
      
      var getElementPos = function () {
        clientRect = element[0].getBoundingClientRect();
        
        _elementPos.top = clientRect.top;
        _elementPos.left = clientRect.left;
        
        return _elementPos;
      };
      
      var onMousedown = function (e) {
        e.preventDefault();
        
        mousedown = true;
        drag = {}
        
        startX = e.pageX;
        startY = e.pageY;
        
        elementPos = getElementPos();
        startTime = $window.Date.now();
        
        point = Drag.registerPoint({ x: e.pageX, y: e.pageY });
        
        $document.on('mousemove', onMousemove);
        $document.on('mouseup', onMouseup);
      };
      
      // Fires about 15ms intervals
      var onMousemove = function (e) {
        if(mousedown) {
          drag.diffX = e.pageX - startX;
          drag.diffY = e.pageY - startY;
          
          // Record time stamp and location
          // compare this previous to location for drag vector
          
          _point = { x: e.pageX, y: e.pageY };
          
          Drag.registerVector(point, _point);
          point = Drag.registerPoint(_point);
          
          console.log(Drag.vectors[ Drag.vectors.length - 1 ]);
          
          element.css({
            left: elementPos.left + drag.diffX + 'px',
            top: elementPos.top + drag.diffY + 'px'
          });
          
          // TODO: keep track of last three directions to figure out extra dimension
          
        }
      };

      var onMouseup = function (e) {
        if(mousedown) {
          mousedown = false;
          
          //drag.length = getLength(drag.diffX, drag.diffY);
          
          //drag.duration = $window.Date.now() - startTime;
          //drag.rate = drag.length / drag.duration;
          
          //drag.dir = [drag.diffX / drag.length, drag.diffY / drag.length];
          
          //console.log(drag);
          
          //Totally made up
          // if(drag.rate > 1) {
//             var length = drag.duration * (drag.duration / drag.length);
//             var duration = drag.duration * 2;
//
//             var now = Date.now();
//             var then;
//
//             var times = [];
//
//             var diffX = 0, diffY = 0;
//
//             //TODO: use dir from last 2/3 points, not overall dir
//             //TODO: incorporate decceleration curve
//             //TODO: figure out how long and far to 'throw' it for
//             //TODO: incoporate bouncing of limits at angles
//
//             var intId = setInterval(function () {
//               then = now;
//               now = Date.now();
//
//               times.push(now - then);
//
//               diffX += drag.dir[0] * 5;
//               diffY += drag.dir[1] * 5;
//
//               element.css({
//                 left: elementPos.left + drag.diffX + diffX + 'px',
//                 top: elementPos.top + drag.diffY + diffY + 'px'
//               });
//
//             }, 5);
//
//             setTimeout(function () {
//               clearInterval(intId);
//             }, duration);
//
//           }
          
          $document.off('mousemove', onMousemove);
          $document.off('mouseup', onMouseup);
        }
      };
      
      element.on('mousedown', onMousedown);
    }
  };
});