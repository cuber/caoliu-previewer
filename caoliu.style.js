var onReady = function() {
  var CL_HASH = '#cl-previewer';

  var CLPreview = (function() {
    var CLPreview = function(elm, href) {
      var _this = this;

      this.threadURL = href;
      this._disabled = false;
      this.elm = elm;
      this.btn = $('<a/>', {
        href: 'javascript:void(0)',
        'title': elm.text()
      }).addClass('preview').data('clPreview', this)
        .on('click', function(e) {
          e.preventDefault();
          if (_this._disabled) {
            return;
          }

          _this.load();
        });

      elm.parents('td').append(this.btn);

      this.reset();
    }

    CLPreview.prototype.getNext = function() {
      var e = this.elm.parents('tr').next().find('.preview');
      if (e.length > 0) return $(e[0]);
    }

    CLPreview.prototype.getPrev = function() {
      var e = this.elm.parents('tr').prev().find('.preview');
      if (e.length > 0) return $(e[0]);
    }

    CLPreview.prototype.destoryIfr = function() {
      if (this.ifr) {
        this.ifr.remove();
        this.ifr = null;
      }
    }

    CLPreview.prototype.st = function(text) {
      this.btn.html(text);
    };

    CLPreview.prototype.failed = function() {
      this.reset();
      this.st('重试');
    };

    CLPreview.prototype.noImage = function() {
      this.st('没有图片');
    };

    CLPreview.prototype.reset = function() {
      this._disabled = false;
      this.btn.css({
        cursor: 'auto'
      });
      this.st('预览');
    };

    CLPreview.prototype.unload = function() {
      this.reset();
      this.destoryIfr();
      this.elm.parents('td').removeClass('active');
      CLPreview.current = null;
    }

    CLPreview.prototype.load = function() {
      if (CLPreview.current) {
        CLPreview.current.unload();
      }

      this.elm.parents('td').addClass('active');
      this._disabled = true;
      this.st('正在加载...');
      this.btn.css({
        cursor: 'not-allowed'
      });

      this.ifr = $('<iframe/>', {
        src: this.threadURL
      })
        .css({
          width: '1px',
          height: '1px',
          position: 'absolute',
          top: '-200px'
        })
        .appendTo($('body'));

      CLPreview.current = this;
    };

    return CLPreview;
  })();

  $.fn.extend({
    clPreview: function(href) {
      new CLPreview(this, href);
      return this;
    }
  });

  if (window.frameElement && document.location.hash.match(CL_HASH)) {
    var $thread = $('body').find('#main .t.t2:eq(0)');
    var $content = $thread.find('.tpc_content');

    var title = $thread.find('.r_one h4:first').text();

    // Find images
    var images = (function(doc) {
      var filters = [
        /imagehyper\.com.*\.gif/,
      ];

      var images = {};
      var prevText;

      var guessDesc = function(elm) {
        var prev = elm.previousSibling;
        var maxContext = 10;
        while (prev && maxContext > 0) {
          maxContext--;

          if (!prev) {
            return;
          }

          if (prev.tagName && prev.tagName.toLowerCase() == 'br') {
            prev = prev.previousSibling;
            continue;
          } else if (!prev.tagName || prev.tagName.toLowerCase() == 'span') {
            var text = $(prev).text().trim();
            if (text.length == 0) {
              prev = prev.previousSibling;
              continue;
            }

            //if (text.length > 30) {
            //  text = text.substr(0, 30) + '...';
            //}

            prevText = text;

            return text;
          } else {
            // do nothing
          }
        }

        if (prevText) return prevText;
      }

      doc.find('img, input[type="image"]').each(function() {
        var url = $(this).attr('src');
        //if (url.match(regex)) {
        for (var i in filters) {
          if (url.match(filters[i])) return;
        }

        var _this = this;

        var link = (function() {
          if (url == "http://i218.photobucket.com/albums/cc151/yuuwill/crimg.gif") {
            var onClick = _this.onclick;
            if (onClick) {
              var func = onClick.toString();
              if (func) {
                var result;
                if (result = func.match(/http:\/\/www\.viidii\.com\/\?(.*)&z/)) {
                  url = result[1].replace(/______/g, '.');
                  return url;
                }
              }
            }
          } else {
            return url;
          }
        })();

        if (link) {
          images[link] = {
            image: link
            //description: guessDesc(this)
          }
        }
      });

      var imageSet = [];
      for (var key in images) {
        var image = images[key];
        image.title = '<a href="' +
          document.location.href.replace(CL_HASH, '') +
          '" target="_blank">' + title + '</a>';

        imageSet.push(image);
      }

      return imageSet;
    })($content);

    // Find torrents
    var torrents = (function(doc) {
      var torrents = [];
      doc.find('a').each(function() {
        var text = $(this).text();
        var result;
        if (result = text.match(/http:\/\/www\.(rmdown|xunfs)\.com\/[a-z0-9\?=\.]+?hash=([a-f0-9]+)/i)) {
          var magnet = 'magnet:?xt=urn:btih:' + result[2].substr(3);
          torrents.push({
            url: result[0],
            magnet: magnet
          });
        }
      });

      var result, text = doc.text(),
        regexp = /magnet:\?xt=urn:btih:[\da-f]+/ig;
      while (result = regexp.exec(text)) {
        torrents.push({
          magnet: result
        });
      }

      return torrents;
    })($content);

    var thread = {
      images: images,
      torrents: torrents
    };

    ga('showGalleria',
      'images=' + thread.images.length + ',torrents=' + thread.torrents.length);
    iframeTransport(thread);
  } else {
    if (chrome.extension && chrome.extension.onMessage) {
      chrome.extension.onMessage.addListener(function(
        message, sender, callback) {
        switch (message.type) {
          case 'IFrame':
            $.clPreview(message.thread);
            callback();
            break;
          default:
            callback();
            break;
        }

        return true;
      });

      $('tr').each(function() {
        var _this = $(this).children('td:eq(1)').find('a');
        var href = _this.attr('href');
        if (href && href.match(/^htm_data/)) {
          $(_this).clPreview(href + CL_HASH);
        }
      });

      $.clPreview = function() {
        var galleria = {
          existed: false,
          init: function() {
            if (!this.existed) {
              var gadget = '<div class="galleria-modal">' +
                '<div class="galleria-layer"/>' +
                '<div id="galleria"/>' +
                '</div>';
              this.modal = $(gadget).appendTo($('body')).css({
                position: 'fixed'
              });

              this.existed = true;
            }
          },

          show: function(thread) {
            this.init();
            this.modal.show();
            setTimeout(function() {
              var preview = $('#galleria').data('galleria');
              if (preview) preview.destroy();
              Galleria.run('#galleria', {
                dummy: chrome.extension.getURL('galleria/no-error-sign-md.png'),
                height: window.innerHeight,
                maxScaleRatio: 1,
                dataSource: thread.images,
                transition: "pulse",
                thumbCrop: false,
                thumbQuality: false,
                imageCrop: 'false',
                carousel: !1,
                easing: "galleriaOut",
                fullscreenDoubleTap: !1,
                trueFullscreen: !1,
                _webkitCursor: !1,
                _animate: !0,
                clt: thread
              });
            });

            CLPreview.current.reset();
          }
        }

        return function(thread) {
          var current = CLPreview.current;
          thread.next = current.getNext();
          thread.prev = current.getPrev();

          if (thread.images.length != 0) {
            galleria.show(thread);
          }

          // prevent direct invoking of iframe
          setTimeout(function() {
            if (thread.images.length == 0) {
              CLPreview.current.noImage();
            }

            CLPreview.current.destoryIfr();
          });
        }
      }();
    }
  }
}

$(onReady);
