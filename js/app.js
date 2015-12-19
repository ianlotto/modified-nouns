'use strict';

angular.module('modifiedNouns', [])

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
  
  return {
    
    imgData: {
      total: {
        total: 0,
        loaded: 0
      }
    },
    
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
      if(this.imgData.hasOwnProperty(src)) {
        if (e.lengthComputable && angular.isObject(this.imgData[src])) {
          this.imgData[src].loaded = e.loaded;
        }
        
        var percentComplete = e.loaded / e.total;
      } else {
        if (e.lengthComputable) {  
          
          this.imgData[src] = {
            loaded: e.loaded,
            total: e.total
          };
          
        } else {
          this.imgData[src] = null;
        }
      }
      
      var total = 0;
      var loaded = 0;
      
      for (var key in this.imgData) {
        if(!!this.imgData[key]) {
          total = total + this.imgData[key].total;
          loaded = loaded + this.imgData[key].loaded;
        }
      }
      
      this.imgData.total.total = total;
      this.imgData.total.loaded = loaded;
      
      console.log(loaded / total);
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
  Loader.getModifiedNouns().then(function (modifiedNouns) {
  });
  
  Loader.getImages().then(function (images) {
    console.log(Loader.imgData)
  });
});