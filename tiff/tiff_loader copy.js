"use strict";


(function () {
    let loadConfig = function() {
        const elem = document.getElementById('custom-config')
        if (elem) {
            return JSON.parse(elem.getAttribute('data-config'))
        }
        throw new Error('Could not load configuration.')
    }
    let loadImage = function (filename) {
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'arraybuffer';
        xhr.open('GET', filename);
        xhr.onload = function (e) {
          var tiff = new Tiff({buffer: xhr.response});
          var width = tiff.width();
          var height = tiff.height();
          var canvas = tiff.toCanvas();
          if (canvas) {
            canvas.setAttribute('style', 'width:' + (width*0.3) +
              'px; height: ' + (height*0.3) + 'px');
            document.body.append(canvas);
          }
        };
        xhr.send();
      }
    
    
    window.addEventListener('load', function () {
        const config = loadConfig()
        console.log("first" + " " + config.path)
        loadImage(config.path)
    }, { once: true });
    


}())

