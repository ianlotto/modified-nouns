module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    jscs: {
      src: ['Gruntfile.js', 'js/*.js'],
      options: {
        config: '.jscsrc',
      }
    },

    jshint: {
      options: {
        jshintrc: true
      },
      all: ['Gruntfile.js', 'js/*.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');

  grunt.registerTask('test', ['jshint', 'jscs']);
};