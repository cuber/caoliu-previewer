(function() {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.extension.getURL(
      'galleria/themes/classic/galleria.classic.css'
    );
  document.head.appendChild(link);
})();

$(function() {
  $('body').delegate('.preview', 'click', function (e) {
    e.preventDefault();

    if ($(this).attr('data-disabled')) {
      return;
    }

    var href = $(this).attr('data-target');
    var title = $(this).attr('title');
    $(this).html("载入中...").attr('data-disabled', 1).css({
      cursor: 'not-allowed'
    });

    var _this = this;

    $.ajax({
      url: href,
      success: function (text) {
        // Find images
        var images = (function (text) {
          var regex = /https?:\/\/[^\s<>"]+?\.(png|jpg|jpeg)/ig;
          var images = {};
          var image;
          while ((image = regex.exec(text)) !== null) {
            var link = image[0];
            images[link] = true;
          }

          var imageSet = [];
          for (var image in images) {
            imageSet.push({
              image: image
            })
          }

          return imageSet;
        })(text);

        if (images.length == 0) {
          $(_this).html("No images");
          return;
        }

        // find torrent download link
        var torrents = (function (text) {
          var regex = /http:\/\/www\.rmdown.com\/link\.php\?hash=[0-9a-f]+/gi;
          var torrents = {};
          var torrent;
          while((torrent = regex.exec(text)) !== null) {
            torrents[torrent] = true;
          }

          return torrents;
        })(text);

        $('#galleria').remove();
        var modal = $('<div/>', {
          'class': 'modal hide fade',
          'id': 'galleria'
        }).append((function() {
            var head = $('<div/>', {
              html: '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>',
              'class': 'modal-header'
            }).append($('<a/>', {
              html: '<h3>' + title + '</h3>',
              href: href,
              target: '_blank'
            }).css({'font-weight': 'bold'}));

            for (var torrent in torrents) {
              head.append($('<a/>', {
                href: torrent,
                target: '_blank',
                html: '!下载种子'
              }).css({
                color: 'blue',
                margin: 'auto auto auto 5px'
              }));
            }

            return head;
          })()
        ).append(
          $('<div/>', {
            'class': 'modal-body'
          }).append(
            $('<div/>', {
              'class': 'content'
            }).css({
              margin: '0 auto'
            })
          )
        );

        $('body').append(modal);

        Galleria.run('#galleria .content', {
          dataSource: images,
          width: 660,
          height: 467,
          popupLinks: true
        });

        $('#galleria').modal('show');

        $(_this).html('预览');
      },
      error: function () {
        $(_this).html('重试');
      },
      complete: function () {
        $(_this).removeAttr('data-disabled').css({
          cursor: 'auto'
        });
      }
    });
  });

  $('tr').each(function () {
    var _this = $(this).children('td:eq(1)').find('a');
    var href = _this.attr('href');
    if (href && href.match(/^htm_data/)) {
      _this.css({
        'font-weight': 'bold'
      }).parents('td').append(
        $('<a/>', {
          href: 'javascript:void(0)',
          'data-target': href,
          'title': _this.text()
        }).html('预览').addClass('preview')
      );
    }
  });
});

