'use strict';

angular.module('modifiedNouns.loader', [])

.factory('Loader', function ($window, $timeout, $q, $http, ASSET_DATA) {

  var hasLocalStorage = (function () {
    try {
      var test = '__test__';

      $window.localStorage.setItem(test, '');
      $window.localStorage.removeItem(test);

      return true;
    }
    catch(e) {
      return false;
    }
  })();

  var progressData = {
    total: {
      total: 0,
      loaded: 0,
      complete: false
    }
  };

  var images = {
    length: 0
  };

  return {

    images: images,
    progressData: progressData,

    getModifiedNouns: function () {
      var key = 'modifiedNouns';

      var modifiedNouns, promise;

      var _http = function () {
        return $http.get(ASSET_DATA.mnSrc).then(function (response) {
          modifiedNouns = response.data;

          $window.localStorage.setItem(key, angular.toJson(modifiedNouns));
          return modifiedNouns;
        });
      };

      if(hasLocalStorage) {
        modifiedNouns = angular.fromJson($window.localStorage.getItem(key));
      }

      promise = (!modifiedNouns || !hasLocalStorage) ?
        _http() :
        $timeout(function () { return modifiedNouns; });

      return promise;
    },

    onProgress: function (key, e) {
      if(progressData.hasOwnProperty(key)) {
        if(e.lengthComputable && angular.isObject(progressData[key])) {
          progressData[key].loaded = e.loaded;
          progressData[key].complete = e.loaded / e.total === 1;
        }
      } else {
        if(e.lengthComputable) {

          progressData[key] = {
            loaded: e.loaded,
            total: e.total
          };

        } else {
          progressData[key] = null;
        }
      }

      var total = 0;
      var loaded = 0;

      for (var _key in progressData) { // Sum the parts
        if(!!progressData[_key] && _key !== 'total') {
          total = total + progressData[_key].total;
          loaded = loaded + progressData[_key].loaded;
        }
      }

      progressData.total.total = total;
      progressData.total.loaded = loaded;
      progressData.total.percent = Math.round((loaded / total) * 100);
    },

    getImageKey: function (input) {
      return '_' + input.join('_');
    },

    getImage: function (src) {
      var loader = this;

      var deferred = $q.defer();
      var req = new $window.XMLHttpRequest();

      var key = loader.getImageKey(src.match(/\d+/g));

      req.addEventListener('progress', function (e) {
        loader.onProgress(key, e);
      });

      req.addEventListener('load', function () {
        var blob = new $window.Blob([req.response]);
        var image = new $window.Image();

        image.src = $window.URL.createObjectURL(blob);

        images[key] = image;
        images.length++;

        deferred.resolve(image);
      });

      req.open('GET', src);
      req.responseType = 'arraybuffer';

      req.send();

      return deferred.promise;
    },

    getImages: function () {
      var loader = this;

      var imgData = ASSET_DATA.img;
      var imgCount = imgData.levels * imgData.tiles;

      var srcData = [];
      var deferred = $q.defer();

      var _getImage = function () {
        var src = imgData.template.replace(imgData.regExp,
          function (match, number) {
            return srcData[ $window.parseInt(number) ];
          }
        );

        loader.getImage(src).then(function () {
          if(images.length === imgCount) {
            progressData.total.complete = true;
            deferred.resolve(loader.images);
          }
        });
      };

      for (var i = 0; i < imgData.levels; i++) {
        srcData[0] = $window.Math.pow(2, i);

        for (var j = 0; j < imgData.tiles; j++) {
          srcData[1] = j;
          _getImage();
        }
      }

      return deferred.promise;
    },

    hasLevel: function (number) {
      for (var i = 0; i < ASSET_DATA.img.tiles; i++) {
        var key = this.getImageKey([number, i]);

        if(!this.images.hasOwnProperty(key)) {
          return false;
        }
      }

      return true;
    }

  };

})

.directive('loadProgress', function (Loader) {
  return {
    restrict: 'A',
    scope: true,
    link: function (scope, element) {
      scope.progressData = Loader.progressData.total;

      var scaledPercent;

      scope.$watch('progressData.percent', function (percent) {
        scaledPercent = percent + (percent * 0.1);
        element.css('width', scaledPercent + '%');
      });
    }
  };
});