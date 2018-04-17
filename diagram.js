var diagram = (function () {
  var avatarEditor, defaultOption, thisOption, thisEl, zrObject, data, tooltip;

  var arrowHeight = 10,
    defaultOption = {
      containerWidth: 600,
      containerHeight: 400,
      padding: 10,
      itemWidth: 80,
      itemHeight: 50,
      itemMargin: 50,
      msgBoxPadding: 3,
      msgBorderWidth: 1,
      titleFontSize: 24,
      fontSize: 14,
      lineWidth: 2
    },
    defaultItemOption = {
      shape: {
        r: 6,
      },
      style: {
        lineWidth: 3,
        stroke: '#385d8a',
        fill: '#4f81bd',
        textFill: '#fff',
      }
    }
  

  zrender.Arrow = zrender.Path.extend({
    type: 'arrow',
    rectHover: true,
    shape: {
      x: 0,
      y: 0,
      toX: 0,
      toY: 0,
      theta: 30,
      headlen: 10
    },
    style: {
      stroke: '#333',
      fill: null,
      lineWidth: 2,
      textFill: '#333',
      textPosition: 'bottom',
      textBackgroundColor: '#fff',
      textBorderColor: '#333',
      textBorderWidth: 1,
      textPadding: 4,
      textOffset: [0, -4],
    },
    buildPath: function (ctx, shape) {
      var theta = shape.theta,
        headlen = shape.headlen,
        width = shape.width,
        x = shape.x,
        y = shape.y,
        toX = shape.toX,
        toY = shape.toY;
      var angle = Math.atan2(y - toY, x - toX) * 180 / Math.PI,
        angle1 = (angle + theta) * Math.PI / 180,
        angle2 = (angle - theta) * Math.PI / 180,
        topX = headlen * Math.cos(angle1),
        topY = headlen * Math.sin(angle1),
        botX = headlen * Math.cos(angle2),
        botY = headlen * Math.sin(angle2);

      var arrowX = x - topX,
        arrowY = y - topY;
      ctx.moveTo(x, y);
      ctx.lineTo(toX, toY);

      arrowX = toX + topX;
      arrowY = toY + topY;
      ctx.lineTo(arrowX, arrowY);
      ctx.moveTo(toX, toY);
      arrowX = toX + botX;
      arrowY = toY + botY;
      ctx.lineTo(arrowX, arrowY);
    }
  });

  zrender.Tooltip = zrender.Path.extend({
    type: 'tooltip',
    zlevel: 100,
    shape: {
      x: 0,
      y: 0,
      width: 160,
      height: 80
    },
    style: {
      fill: '#ff0',
      textFill: '#333',
      fontFamily: 'Courier'
    },
    buildPath: function (ctx, shape) {
      var x = shape.x, y = shape.y,
        width = shape.width, height = shape.height;
      y = y - 4;
      ctx.moveTo(x, y);
      ctx.lineTo(x - 6, y - 6);
      ctx.lineTo(x - width / 2, y - 6);
      ctx.lineTo(x - width / 2, y - 6 - height);
      ctx.lineTo(x + width / 2, y - 6 - height);
      ctx.lineTo(x + width / 2, y - 6);
      ctx.lineTo(x + 6, y - 6);
      ctx.lineTo(x, y);
    }
  });

  /**
   * generate mimeType
   * @param  {String} type the old mime-type
   * @return the new mime-type
   */
  var _fixType = function (type) {
    type = type.toLowerCase().replace(/jpg/i, 'jpeg');
    var r = type.match(/png|jpeg|bmp|gif/)[0];
    return 'image/' + r;
  };

  var pretreatment = function (inputStr) {
    inputStr = inputStr.replace(/[\r\n]/g,"");
    var arr = inputStr.split(';');
    var data = { Messages: [] };
    for (var i = 0; i < arr.length; i++) {
      var line = arr[i];
      if (line) {
        var key = line.split(':')[0],
          value = line.split(':')[1];
        if (key == 'Title' || key == 'Members') {
          data[key.trim()] = value.trim();
        } else {
          var msg = {};
          msg.source = key.split(' to ')[0].trim();
          msg.target = key.split(' to ')[1].trim();
          var content = value.split('(');
          msg.msg = content[0].trim();
          if (content.length > 1) {
            msg.desc = content[1].substring(0, content[1].indexOf(')')).trim();
          }
          data.Messages.push(msg);
        }
      }
    }
    var members = data.Members.split(',');
    data.Members = [];
    members.map(function (v) {
      data.Members.push(v.trim());
    });
    return data;
  }

  var draw = function () {
    if(zrObject){
      zrender.dispose()
    }
    var zrenderElements = [];
    var members = data.Members,
      messages = data.Messages;
      op = thisOption;
    var tmpText = new zrender.Text({style:{ fontSize: op.fontSize}});
    
    var currentX = op.padding,
      currentMsgY = op.padding + op.titleFontSize + 10 + op.itemHeight,
      itemTopY = op.padding + op.titleFontSize + 10,
      itemXMap = {};
    itemXMap[members[0]] = currentX;
    var itemOption = zrender.util.clone(defaultItemOption);
    itemOption.shape.x = currentX;
    itemOption.shape.y = itemTopY;
    itemOption.style.text = members[0];
    var item0 = new zrender.Rect(itemOption);
    zrenderElements.push(item0);
    for (var i = 1; i < members.length; i++) {
      var member = members[i],
        itemX = currentX + op.itemWidth + op.itemMargin;
      for (var j = i - 1; j >= 0; j--) {
        var tmp = members[j];
        tmpX = itemXMap[tmp];
        var maxMsgWidth = op.itemWidth + op.itemMargin;
        for (var k = 0; k < messages.length; k++) {
          if ((messages[k].source == member && messages[k].target == tmp) || (messages[k].target == member && messages[k].source == tmp)) {
            tmpText.setStyle({text: messages[k].msg});
            var msgWidth = tmpText.getBoundingRect().width + 30;
            maxMsgWidth = msgWidth > maxMsgWidth ? msgWidth : maxMsgWidth;
          }
        }
        var maxX = tmpX + maxMsgWidth;
        maxX = maxX < itemX ? itemX : maxX;
        currentX = currentX < maxX ? maxX : currentX;
      }
      itemXMap[member] = currentX;
      itemOption = zrender.util.clone(defaultItemOption);
      itemOption.shape.x = currentX;
      itemOption.shape.y = itemTopY;
      itemOption.style.text = member;
      zrenderElements.push(new zrender.Rect(itemOption));
    }
    var preRange = '';
    for (var i = 0; i < messages.length; i++) {
      var message = messages[i],
        range = [members.indexOf(message.source), members.indexOf(message.target)];
        forward = range[0] < range[1];
      if(!forward){
        range.reverse();
      }
      if (!preRange || (range[0] >= preRange[1] || range[1] <= preRange[0])) {
        currentMsgY += arrowHeight * 2;
      } else {
        currentMsgY += 2 * arrowHeight + op.fontSize + 6;
      }
      preRange = range;
      arrowPadding = forward ? op.lineWidth + 2 : -(op.lineWidth + 2)
      var arrow = new zrender.Arrow({
        tooltip: message.desc,
        shape: {
          x: itemXMap[message.source] + op.itemWidth / 2 + arrowPadding,
          y: currentMsgY,
          toX: itemXMap[message.target] + op.itemWidth / 2 - arrowPadding - (forward ? 2 : -2),
          toY: currentMsgY
        },
        style: {
          text: message.msg,
          fontSize: op.fontSize
        },
        zlevel: 99
      });
      arrow.on('mousemove', function (e) {
        e.target.attr({
          style:{
            stroke: '#ff0'}
        });
        if(e.target.tooltip){
          var desc = '', str = e.target.tooltip;
          var spaceIndex = 0, newline = 0;
          for(var i = 0; i< str.length; i++){
            if(str[i] == ' '){
              spaceIndex = i;
            }
            if(((i - newline)+1)%17 == 0){
              if(str[i+1] != ' ' && str[i] != ' '){
                desc = desc.substring(0, spaceIndex+1) + '\n';
                i = spaceIndex;
                newline = i + 1;
              }else{
                desc += str[i] + '\n';
              }
            }else{
              desc += str[i];
            }
          }
          var x, y = e.topTarget.shape.y;
          if(e.target.shape.toX > e.target.shape.x){
            x = e.target.shape.x + (e.target.shape.toX - e.target.shape.x)/2;
          }else{
            x = e.target.shape.toX + (e.target.shape.x - e.target.shape.toX)/2;
          }
          tooltip.attr({
            shape:{
              x: x, y: y
            },
            style:{
              text: desc
            }
          });
          tooltip.show();
        }
      }).on('mouseout', function (e) {
        tooltip.hide();
        e.target.attr({
          style:{
            stroke: '#333'}
        });
      });
      zrenderElements.push(arrow);
    }
    var itemBottomY = currentMsgY + 2 * arrowHeight + op.fontSize + 6;
    for (var i = 0; i < members.length; i++) {
      var itemOption = zrender.util.clone(defaultItemOption);
      itemOption.shape.x = itemXMap[members[i]];
      itemOption.shape.y = itemBottomY;
      itemOption.style.text = members[i];
      zrenderElements.push(new zrender.Rect(itemOption));
      zrenderElements.push(new zrender.Line({
        shape: {
          x1: itemXMap[members[i]] + op.itemWidth / 2,
          y1: itemTopY + op.itemHeight,
          x2: itemXMap[members[i]] + op.itemWidth / 2,
          y2: itemBottomY
        },
        style: {
          stroke: '#4f81bd',
          lineWidth: 2
        }
      }));
    }
    var canvasWidth = currentX + op.itemWidth + op.padding;
    var canvasHeight = itemBottomY + op.itemHeight + op.padding;

    var ratioWidth = canvasWidth / thisEl.offsetWidth,
      ratioHeight = canvasHeight /thisEl.offsetHeight;
    var devicePixelRatio = ratioWidth > ratioHeight ? ratioWidth : ratioHeight;

    zrObject = zrender.init(thisEl, {
      devicePixelRatio: devicePixelRatio,
      width: canvasWidth, 
      height: canvasHeight
    });
    tooltip = new zrender.Tooltip({
      style: {
        fontSize: op.fontSize
      }
    });
    tooltip.hide();
    zrObject.add(tooltip);
    zrObject.add(new zrender.Text({
      style: {
        textAlign: 'center',
        textVerticalAlign: 'middle',
        text: data.Title,
        textFill: '#333',
        textPosition: 'top',
        textOffset: [0, op.titleFontSize],
        fontWeight: 'bolder',
        fontSize: op.titleFontSize
      },
      position: [zrObject.getWidth() / 2, op.padding * 2]
    }));
    zrenderElements.forEach(function(element) {
      zrObject.add(element);
    });
    thisEl.querySelector('div').style.transform = 'scale('+1/devicePixelRatio+')'
    thisEl.querySelector('div').style.transformOrigin = '0 0';
    thisEl.querySelector('div').style.webkitTransform = 'scale('+1/devicePixelRatio+')'
    thisEl.querySelector('div').style.webkitTransformOrigin = '0 0';
  }

  var extend = function (target, source) {
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }
    return target;
  }

  diagram = {
    init: function (el, option) {
      var op = thisOption = extend(option, defaultOption);
      defaultItemOption.shape.width = op.itemWidth;
      defaultItemOption.shape.height = op.itemHeight;
      defaultItemOption.style.fontSize = op.fontSize;
      thisEl = el;
      el.className = 'diagram';
      data = pretreatment(op.data);
      draw();
      return this;
    },
    setData: function(input) {
      data = pretreatment(input);
      draw();
    },
    saveImage: function (type) {
      type = type || 'png';
      var canvas = thisEl.querySelectorAll('canvas');
      var newCanvas = document.createElement('canvas');
      newCanvas.width = canvas[0].width;
      newCanvas.height = canvas[0].height;
      newCanvas.getContext('2d').drawImage(canvas[0],0,0);
      newCanvas.getContext('2d').drawImage(canvas[1],0,0);
      var imgData = newCanvas.toDataURL(type);
      imgData = imgData.replace(_fixType(type), 'image/octet-stream');
      var download = document.createElement('a');
      download.download = "diagram." + type;
      download.style.display = 'none';
      download.href = imgData;
      document.body.appendChild(download);
      download.click();
      document.body.removeChild(download);
    }
  };

  return diagram;
})();
