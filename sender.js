copyToClipboard = function(text, done, isHtml) {
  chrome.extension.sendMessage({
    type: 'Copy',
    content: text,
    isHtml: isHtml
  }, done || function() {});
}

ga = function() {
  try {
    var s = [];
    for (var i = 0; i < arguments.length; i++) {
      s.push(arguments[i]);
    }

    chrome.extension.sendMessage({
      type: 'GA',
      event: s
    }, function() {});
  } catch (e) {}
}
