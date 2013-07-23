/* Galleria Fullscreen Theme 2012-04-04 | http://galleria.io/license/ | (c) Aino */
(function(a) {
  var copyToClipboard = function(text, done, isHtml) {
    chrome.runtime.sendMessage({
      type: 'Copy',
      content: text,
      isHtml: isHtml
    }, done || function() {});
  }

  Galleria.addTheme({
    name: "fullscreen",
    author: "Galleria",
    //css: "galleria.fullscreen.css",
    defaults: {
      transition: "none",
      imageCrop: !0,
      thumbCrop: "height",
      easing: "galleriaOut",
      trueFullscreen: !1,
      _hideDock: Galleria.TOUCH ? !1 : !0,
      _closeOnClick: !1
    },
    init: function(b) {
      this.addElement("thumbnails-tab"), this.appendChild("thumbnails-container", "thumbnails-tab");
      this.addElement('exit');
      this.append({
        stage: 'exit'
      });

      var t = this;

      var exit = function() {
        t.$('target').parents('.galleria-modal').fadeOut(function() {
          t.exitFullscreen();
          t.destroy();
        });
      }

      var getFileName = function(url) {
        var parts = url.split('/');
        return parts[parts.length - 1].split('?')[0] || 'Untitled';
      };

      var alert = {
        init: function() {
          t.addElement('alert-area');
          t.appendChild('stage', 'alert-area');
        },
        show: function(content) {
          var $a = $('<div/>')
            .addClass('alert alert-block alert-success')
            .addClass('fade in alert-instance')
            .appendTo(t.$('alert-area'))
            .html('<p>' + content + '</p>');

          $a.alert().click(function() {
            $a.alert('close');
          });

          setTimeout(function() {
            $a.alert('close');
          }, 4000);
        }
      };

      alert.init();

      var toolbar = {
        elements: {
          single: {
            desc: '在新窗口打开当前图片',
            action: function(elm) {
              var url = toolbar.dataSource[t.getIndex()].image;
              child = window.open('about:blank', '_blank');
              child.document.write('<img src="' + url + '"/>');
              child.document.body.style.margin = '0 0';
              child.document.title = getFileName(url);
            }
          },
          bulk: {
            desc: '下载全部图片',
            hover: function(elm) {
              elm.popover({
                html: true,
                placement: 'top',
                content: ('<p>请确认浏览器不会询问图片下载位置: </p>' +
                  '<img width="300" height="69px" src="' +
                  chrome.extension.getURL('galleria/download-help.png') + '"/>' +
                  '<p><a class="chrome-settings"' +
                  ' href="javascript:void(0)">现在去设置</a>' +
                  '</p>'),
                container: t.$('clt-bulk'),
                trigger: 'hover'
              });

              t.$('clt-bulk').delegate(
                '.chrome-settings', 'click', function(e) {
                  e.stopPropagation();
                  chrome.extension.sendMessage({
                    type: 'OpenTab',
                    url: 'chrome://settings/search#' + encodeURIComponent(
                      chrome.i18n.getMessage('downloadSearch'))
                  });
                });
            },
            action: function(elm, data) {
              elm.popover('hide');
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

              var saveImage = function(index) {
                saveAs(data[index].image, getFileName(data[index].image));
              }

              saveImage(0);
              alert.show("已开始下载图片,请耐心等待...");

              var index = 1;

              var itr = setInterval(function() {
                if (!data[index]) {
                  clearInterval(itr);
                  return;
                }

                saveImage(index);
                index += 1;
              }, 200);
            }
          },
          magnet: {
            desc: '复制磁链',
            action: function(elm, data) {
              var magnets = [];
              for (var i in data) {
                magnets.push(data[i].magnet);
              }

              copyToClipboard(magnets.join('\n'), function() {});
              alert.show("已经复制{n}个磁链到剪切板".replace(/{n}/,
                magnets.length));
            }
          },
          prev: {
            desc: '上一个帖子',
            action: function(elm, data) {
              data.trigger('click');
              exit();
            }
          },
          next: {
            desc: '下一个帖子',
            action: function(elm, data) {
              data.trigger('click');
              exit();
            }
          },
        },

        addItem: function(name, data) {
          var item = this.elements[name];
          var cls = 'clt-' + name;
          t.addElement(cls);
          t.appendChild('clt', cls);

          item.custom && item.custom(t.$(cls));

          var e = t.$(cls).on('click', function() {
            item.action && item.action($(this), data);
          }).attr('title', item.desc).addClass('galleria-clt-item');

          if (!item.hover) {
            e.tooltip({});
          } else {
            item.hover(e);
          }
        },

        init: function(options) {
          options.clt = options.clt || {};
          this.opts = options.clt;
          this.dataSource = options.dataSource;
          t.addElement('clt');
          t.appendChild('stage', 'clt');
          this.addItem('single'); // bulk copy picutres url
          this.addItem('bulk', options.dataSource); // bulk copy picutres url
          if (options.clt.torrents && options.clt.torrents.length > 0) {
            this.addItem('magnet', options.clt.torrents);
          }

          if (options.clt.prev) {
            this.addItem('prev', options.clt.prev);
          }

          if (options.clt.next) {
            this.addItem('next', options.clt.next);
          }

          $('.galleria-clt-item')
            .delegate('.popover', 'click', function(e) {
              e.stopPropagation();
            });
        },
      };

      toolbar.init(t._options);

      var c = this.$("thumbnails-tab"),
        d = this.$("loader"),
        e = this.$("thumbnails-container"),
        f = this.$("thumbnails-list"),
        g = this.$("info-text"),
        h = this.$("info"),
        clt = this.$('clt'),
        i = !b._hideDock,
        Exit = this.$('exit');
      j = 0;
      Galleria.IE && (this.addElement("iefix"), this.appendChild("container", "iefix"), this.$("iefix").css({
        zIndex: 3,
        position: "absolute",
        backgroundColor: "#000",
        opacity: .4,
        top: 0
      })), b.thumbnails === !1 && e.hide();
      var k = this.proxy(function(b) {
        if (!b && !b.width) return;
        //var c = Math.min(b.width, a(window).width());
        var c = a(window).width();
        g.width(c - 40), Galleria.IE && this.getOptions("showInfo") && this.$("iefix").width(h.outerWidth()).height(h.outerHeight())
      });


      Exit.attr('title', '关闭预览');
      Exit.click(exit);

      this.bind("rescale", function() {
        j = this.getStageHeight() - c.height() - 2, e.css("top", i ? j - f.outerHeight() + 2 : j);
        var a = this.getActiveImage();
        a && k(a)
      }), this.bind("loadstart", function(b) {
        b.cached || d.show().fadeTo(100, 1), a(b.thumbTarget).css("opacity", 1).parent().siblings().children().css("opacity", .6)
      }), this.bind("loadfinish", function(a) {
        d.fadeOut(300), this.$("info, iefix").toggle(this.hasInfo())
      }), this.bind("image", function(a) {
        k(a.imageTarget)
      }), this.bind("thumbnail", function(d) {
        a(d.thumbTarget).parent(":not(.active)").children().css("opacity", .6), a(d.thumbTarget).click(function() {
          i && b._closeOnClick && c.click()
        })
      }), this.trigger("rescale"), Galleria.TOUCH || (this.addIdleState(e, {
        opacity: 0
      }), this.addIdleState(this.get("info"), {
        opacity: 0
      })), Galleria.TOUCH || (this.addIdleState(this.get('clt'), {
        opacity: 0.05
      })), Galleria.TOUCH || (this.addIdleState(this.get('exit'), {
        opacity: 0.05
      })), Galleria.TOUCH || (this.addIdleState(this.get('counter'), {
        opacity: 0.05
      })), Galleria.IE && this.addIdleState(this.get("iefix"), {
        opacity: 0
      }), this.$("image-nav-left, image-nav-right").css("opacity", .01).hover(function() {
        a(this).animate({
          opacity: 1
        }, 100)
      }, function() {
        a(this).animate({
          opacity: 0
        })
      }).show(), b._hideDock ? c.click(this.proxy(function() {
        c.toggleClass("open", !i), i ? (e.animate({
          top: j
        }, 400, b.easing), clt.fadeIn(400)) : (e.animate({
          top: j - f.outerHeight() + 2
        }, 400, b.easing), clt.fadeOut(400)), i = !i
      })) : (this.bind("thumbnail", function() {
        e.css("top", j - f.outerHeight() + 2)
      }), c.css("visibility", "hidden")), this.$("thumbnails").children().hover(function() {
        a(this).not(".active").children().stop().fadeTo(100, 1)
      }, function() {
        a(this).not(".active").children().stop().fadeTo(400, .6)
      }), this.enterFullscreen(), this.attachKeyboard({
        escape: function(a) {
          return !1
        },
        up: function(a) {
          i || c.click(), a.preventDefault()
        },
        down: function(a) {
          i && c.click(), a.preventDefault()
        }
      });

    }
  })
})(jQuery);
