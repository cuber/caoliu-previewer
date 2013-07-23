var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-42580233-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

chrome.extension.onMessage.addListener(function(message, sender, callback) {
  callback = callback || function() {};
  switch (message.type) {
    case 'Copy':
      var $e = $('<textarea/>')
        .text(message.content)
        .appendTo($('body'));

      $e.trigger('select');
      document.execCommand('copy');
      $e.remove();
      callback(true);
      break;
    case 'SaveImage':
      var saveAs = function(Url, filename) {
        var blob = new Blob([''], {
          type: 'application/octet-stream'
        });
        var url = webkitURL.createObjectURL(blob);
        var a = document.createElementNS(
          'http://www.w3.org/1999/xhtml', 'a');
        var e = document.createEvent('MouseEvents');
        a.href = Url;
        a.download = filename;
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0,
          false, false, false, false, 0, null);
        a.dispatchEvent(e);
        webkitURL.revokeObjectURL(url);
      }

      saveAs(message.url, message.filename);
      callback(true);
      break;
    case 'OpenTab':
      chrome.tabs.create({url:message.url}, function(tab) {
        callback(tab);
      });
      break;
    case 'GA':
      _gaq.push(['_trackEvent'].concat(message.event));
      callback(true);
      break;
    default:
      callback(true);
      break;
  }

  return true;
});

