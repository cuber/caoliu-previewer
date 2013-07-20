(function() {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.extension.getURL(
      'galleria/themes/twelve/galleria.twelve.css'
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

    // Find images
    var images = (function (doc) {
      var regex = /(png|jpg|jpeg)$/ig;
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
          image: image
        });
      }

      return imageSet;
    })($thread);

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
    })($thread);


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
                          '<div class="modal-top">' +
                            '<div class="modal-layer"/>' +
                            '<div class="modal-body"/>' +
                          '</div>' +
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
        width = window.innerWidth - 40;
        height = window.innerHeight - 40;
        Galleria.run('.galleria-modal .modal-body', {
          height: window.innerHeight,
          dataSource: thread.images,
          transition: "pulse",
          thumbCrop: "width",
          imageCrop: !1,
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
      console.log(JSON.stringify(thread))
      galleria.show(thread);
    }
  }();
}

