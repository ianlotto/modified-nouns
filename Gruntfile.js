module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({

    jshint: {
      options: {
        jshintrc: true
      },
      all: ['Gruntfile.js', 'js/*.js', '!js/app.min.js']
    },

    jscs: {
      src: ['Gruntfile.js', 'js/*.js', '!js/app.min.js'],
      options: {
        config: '.jscsrc',
      }
    },

    concat: {
      options: { separator: '\n\n' },
      dist: {
        src: ['js/app.js', 'js/*.js'],
        dest: 'js/app.min.js'
      },
      css: {
        src: ['css/app.css', 'css/*.css'],
        dest: 'css/app.min.css'
      }
    },

    ngAnnotate: {
      options: {
        singleQuotes: true
      },
      dist: {
        files: {
          'js/app.min.js': 'js/app.min.js'
        }
      }
    },

    cssmin: {
      options: {
        shorthandCompacting: false,
        roundingPrecision: -1
      },
      dist: {
        files: {
          'css/app.min.css': 'css/app.min.css'
        }
      }
    },

    uglify: {
      dist: {
        files: {
          'js/app.min.js': 'js/app.min.js'
        }
      }
    },

    processhtml: {
      dist: {
        files: {
          'index.html': ['index.html']
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-processhtml');

  grunt.registerTask('test', ['jshint', 'jscs']);

  grunt.registerTask('production', function () {
    grunt.task.run([
      'test',
      'concat',
      'ngAnnotate',
      'cssmin',
      'uglify',
      'processhtml'
    ]);
  });

};