var idArray = {};

self.onmessage = function(e) {
  switch (e.data.command) {
    case 'interval:start':
      idArray[e.data.id] = setInterval(function() {
        postMessage({
          message: 'interval:tick',
          id: e.data.id
        });
      }, e.data.interval);

      break;

    case 'interval:clear':
      clearInterval(idArray[e.data.id]);

      postMessage({
        message: 'interval:cleared',
        id: e.data.id
      });

      delete idArray[e.data.id];

      break;

    case 'timeout:start':
      idArray[e.data.id] = setTimeout(function() {
        postMessage({
          message: 'timeout:ended',
          id: e.data.id
        });
      }, e.data.delay);

      break;

    case 'timeout:clear':
      clearTimeout(idArray[e.data.id]);

      postMessage({
        message: 'timeout:cleared',
        id: e.data.id
      });

      delete idArray[e.data.id];

      break;
  }
};