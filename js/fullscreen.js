'use strict';

angular.module('modifiedNouns.fullscreen', [])

.factory('Fullscreen', function ($document) {
  var $$document = $document[0];
  var body = $$document.body;

  var candidates = {
    request: [
      body.requestFullscreen,
      body.webkitRequestFullscreen,
      body.mozRequestFullScreen,
      body.msRequestFullscreen
    ],
    exit: [
      $$document.exitFullscreen,
      $$document.webkitExitFullscreen,
      $$document.mozCancelFullScreen,
      $$document.msExitFullscreen
    ]
  };

  var _fsElement;

  return {
    setMethods: function () {
      var methods;
      var fullScreen = {};

      for (var key in candidates) {
        if(candidates.hasOwnProperty(key)) {
          methods = candidates[key];

          for (var i = 0; i < methods.length; i++) {

            if(angular.isFunction(methods[i])) {
              fullScreen[key] = methods[i];
              break;
            }
          }

          if(!fullScreen[key]) {
            return false;
          }
        }
      }

      this.request = fullScreen.request.bind(body);
      this.exit    = fullScreen.exit.bind($$document);

      return true;
    },

    isActive: function () {
      _fsElement =
        $$document.fullscreenElement ||
        $$document.webkitFullscreenElement ||
        $$document.mozFullScreenElement ||
        $$document.msFullscreenElement;
        
      return !!_fsElement;
    },

    toggle: function () {
      this[this.isActive() ? 'exit' : 'request']();
    }

  };
})

.directive('toggleFullscreen', function (Fullscreen) {
  return {
    restrict: 'A',
    link: function (scope, element) {
      var success = Fullscreen.setMethods();
      
      if(success) {
        element.on('click', Fullscreen.toggle.bind(Fullscreen));
      } else {
        element.remove();
      }
      
    }
  };
});