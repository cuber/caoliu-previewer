/* Galleria Fullscreen Theme 2012-04-04 | http://galleria.io/license/ | (c) Aino */
(function(a) {
  Galleria.addTheme({
    name: "fullscreen",
    author: "Galleria",
    css: "galleria.fullscreen.css",
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

      var c = this.$("thumbnails-tab"),
        d = this.$("loader"),
        e = this.$("thumbnails-container"),
        f = this.$("thumbnails-list"),
        g = this.$("info-text"),
        h = this.$("info"),
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
        var c = Math.min(b.width, a(window).width());
        g.width(c - 40), Galleria.IE && this.getOptions("showInfo") && this.$("iefix").width(h.outerWidth()).height(h.outerHeight())
      });
      var t = this;
      var exit = function () {
        t.$('target').parents('.galleria-modal').fadeOut(function () {
          t.exitFullscreen();
          t.destroy();
        });
      }

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
        c.toggleClass("open", !i), i ? e.animate({
          top: j
        }, 400, b.easing) : e.animate({
          top: j - f.outerHeight() + 2
        }, 400, b.easing), i = !i
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
