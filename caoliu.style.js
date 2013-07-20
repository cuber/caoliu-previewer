(function() {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.extension.getURL(
      'galleria/themes/fullscreen/galleria.fullscreen.css'
    );
  document.head.appendChild(link);
})();

var CL_HASH = '#cl-previewer';

var CLPreview = (function () {
  var CLPreview = function (elm, href) {
    var _this = this;

    this.threadURL = href;
    this._disabled = false;
    this.elm = elm;
    this.btn = $('<a/>', {
        href: 'javascript:void(0)',
        'title': elm.text()
      }).addClass('preview').data('clPreview', this)
        .on('click', function (e) {
          e.preventDefault();
          if (_this._disabled) {
            return;
          }

          _this.load();
        });

    elm.parents('td').append(this.btn);

    this.reset();
  }

  CLPreview.prototype.st = function (text) {
    this.btn.html(text);
  };

  CLPreview.prototype.failed = function () {
    this.reset();
    this.st('重试');
  };

  CLPreview.prototype.noImage = function () {
    this.st('没有图片');
  };

  CLPreview.prototype.reset = function () {
    this._disabled = false;
    this.btn.css({cursor: 'auto'});
    this.st('预览');
  };

  CLPreview.prototype.load = function () {
    if (CLPreview.current) {
      CLPreview.current.data('clPreview').reset();
      CLPreview.current.remove();
    }

    this._disabled = true;
    this.st('正在加载...');
    this.btn.css({cursor: 'not-allowed'});

    CLPreview.current = $('<iframe/>', {src: this.threadURL})
      .css({
        width: '1px',
        height: '1px',
        position: 'absolute',
        top: '-200px'
      })
      .appendTo($('body')).data('clPreview', this);
  };

  return CLPreview;
})();

$.fn.extend({
  clPreview: function (href) {
    new CLPreview(this, href);
    return this;
  }
});

if (window.frameElement && window.parent) {
  if (document.location.hash.match(CL_HASH)) {
    window.parent.$(window.frameElement).data('clPreview').reset();

    var $thread = $('body').find('#main .t.t2:eq(0)');
    var $content = $thread.find('.tpc_content');

    var title = $thread.find('.r_one h4:first').text();

    // Find images
    var images = (function (doc) {
      var regex = /(png|jpg|jpeg|gif)$/ig;
      var images = {};
      doc.find('img, input[type="image"]').each(function () {
        var url = $(this).attr('src');
        if (url.match(regex)) {
          url = url.replace(/_thumb\.jpg$/, '.jpg'); // use big image
          images[url] = true;
        }
      });

      var imageSet = [];
      for (var image in images) {
        imageSet.push({
          image: image,
          title: '<a href="' + document.location.href + '" target="_blank">' +
           title + '</a>'
        });
      }

      var filters = [
          /imagehyper\.com.*\.gif/
        ];

      imageSet = imageSet.filter(function (item) {
        for(var i in filters) {
          if (item.image.match(filters[i])) {
            return false;
          }
        }

        return true;
      });

      return imageSet;
    })($content);

    // Find torrents
    var torrents = (function (doc) {
      var torrents = {};
      doc.find('a').each(function () {
        var text = $(this).text();
        var result;
        if (result = text.match(/http:\/\/www\.(rmdown|xunfs).com\/[a-z0-9\?=\.]+/i)) {
          torrents[result] = true;
        }
      });

      return torrents;
    })($content);


    var thread = {
      images: images,
      torrents: torrents,
    };

    window.parent.$.clPreview(thread);
  }
} else {
  $('tr').each(function () {
    var _this = $(this).children('td:eq(1)').find('a');
    var href = _this.attr('href');
    if (href && href.match(/^htm_data/)) {
      $(_this).clPreview(href + CL_HASH);
    }
  });

  $.clPreview = function () {
    var galleria = {
      existed: false,
      init: function () {
        if (!this.existed) {
          var gadget = '<div class="galleria-modal">' +
                          '<div class="modal-layer"/>' +
                          '<div class="modal-body"/>' +
                       '</div>';
          this.modal = $(gadget).appendTo($('body')).css({
            position: 'fixed'
          });

          this.existed = true;
        }
      },

      show: function (thread) {
        this.init();
        this.modal.show();
        Galleria.run('.galleria-modal .modal-body', {
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
        });
      }
    }

    return function (thread) {
      if (thread.images.length == 0) {
        CLPreview.current.data('clPreview').noImage();
        return;
      }

      galleria.show(thread);
    }
  }();
}

