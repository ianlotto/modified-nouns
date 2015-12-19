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
  
  return {
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
    getImages: function () {
      var imgData = ASSET_DATA.img;
      var imgCount = imgData.levels * imgData.tiles;
      
      var numLoaded = 0;
      var tiles = [];
      var srcData = [];
      var deferred = $q.defer();
      
      var tile;
      
      var _getImage = function () {
        tile = new $window.Image();
        tiles.push(tile);
        
        tile.onload = function () {
          numLoaded++;
          
          if(numLoaded === imgCount) {
            deferred.resolve(tiles);
          }
        };
        
        tile.src = imgData.template.replace(imgData.regExp,
          function (match, number) {
            return srcData[ $window.parseInt(number) ];
          }
        );
      };
      
      for (var i = 0; i < imgData.levels; i++) {
        srcData[0] = Math.pow(2, i);
        
        for (var j = 0; j < imgData.tiles; j++) {
          srcData[1] = j    
          _getImage();
        }
      }
      
      return deferred.promise;
    }
  };
  
})

.run(function (Loader) {
  Loader.getModifiedNouns().then(function (data) {
    
  });
  
  Loader.getImages().then(function (data) {
    console.log(data);
  });
});