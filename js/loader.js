angular.module('modifiedNouns.loader', [])

.constant('ASSET_DATA', {
  mnSrc: 'data/modified_nouns.json',
  img: {
    template: 'data/{0}/{1}.jpg',
    regExp: /\{(\d)\}/g,
    levels: 5,
    tiles: 4
  }
})

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
  
  var createImage = function (data) {
    var blob = new $window.Blob([data]);
    var image = new $window.Image();
    
    image.src = $window.URL.createObjectURL(blob);
    
    return image;
  };
  
  var progressData = {
    total: {
      total: 0,
      loaded: 0
    }
  };
  
  return {
    
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
    
    onProgress: function (src, e) {
      
      if(progressData.hasOwnProperty(src)) {
        if (e.lengthComputable && angular.isObject(progressData[src])) {
          progressData[src].loaded = e.loaded;
          progressData[src].complete = e.loaded / e.total === 1;
        }
      } else {
        if (e.lengthComputable) {  
          
          progressData[src] = {
            loaded: e.loaded,
            total: e.total
          };
          
        } else {
          progressData[src] = null;
        }
      }
      
      var total = 0;
      var loaded = 0;
      
      for (var key in progressData) {
        if(!!progressData[key] && key !== 'total') {
          total = total + progressData[key].total;
          loaded = loaded + progressData[key].loaded;
        }
      }
      
      progressData.total.total = total;
      progressData.total.loaded = loaded;
      progressData.total.percent = Math.round((loaded / total) * 100);
    },
    
    getImage: function (src) {
      var loader = this;
      
      var deferred = $q.defer();
      var req = new $window.XMLHttpRequest();
      
      req.addEventListener('progress', function (e) {
        loader.onProgress(src, e);
      });
      
      req.addEventListener('load', function () {
        deferred.resolve(createImage(req.response));
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
      
      var images = [];
      var srcData = [];
      var deferred = $q.defer();
      
      var _getImage = function () {
        var src = imgData.template.replace(imgData.regExp,
          function (match, number) {
            return srcData[ $window.parseInt(number) ];
          }
        );
        
        loader.getImage(src).then(function (image) {
          images.push(image);
          
          if(images.length === imgCount) {
            deferred.resolve(images);
          }
        });
      };
      
      for (var i = 0; i < imgData.levels; i++) {
        srcData[0] = Math.pow(2, i);
        
        for (var j = 0; j < imgData.tiles; j++) {
          srcData[1] = j;
          _getImage();
        }
      }
      
      return deferred.promise;
    }
  };
  
})

.run(function (Loader) {
  Loader.getModifiedNouns();
  Loader.getImages();
});