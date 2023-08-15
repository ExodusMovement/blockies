(function () {
  // The random number is a js implementation of the Xorshift PRNG
  var randseed = new Array(4); // Xorshift: [x, y, z, w] 32 bit values

  function seedrand(seed) {
    for (var i = 0; i < randseed.length; i++) {
      randseed[i] = 0;
    }
    for (var i = 0; i < seed.length; i++) {
      randseed[i % 4] =
        (randseed[i % 4] << 5) - randseed[i % 4] + seed.charCodeAt(i);
    }
  }

  function rand() {
    // based on Java's String.hashCode(), expanded to 4 32bit values
    var t = randseed[0] ^ (randseed[0] << 11);

    randseed[0] = randseed[1];
    randseed[1] = randseed[2];
    randseed[2] = randseed[3];
    randseed[3] = randseed[3] ^ (randseed[3] >> 19) ^ t ^ (t >> 8);

    return (randseed[3] >>> 0) / ((1 << 31) >>> 0);
  }

  function createColor() {
    //saturation is the whole color spectrum
    var h = Math.floor(rand() * 360);
    //saturation goes from 40 to 100, it avoids greyish colors
    var s = rand() * 60 + 40 + "%";
    //lightness can be anything from 0 to 100, but probabilities are a bell curve around 50%
    var l = (rand() + rand() + rand() + rand()) * 25 + "%";

    var color = "hsl(" + h + "," + s + "," + l + ")";
    return color;
  }

  function createImageData(size) {
    var width = size; // Only support square icons for now
    var height = size;

    var dataWidth = Math.ceil(width / 2);
    var mirrorWidth = width - dataWidth;

    var data = [];
    for (var y = 0; y < height; y++) {
      var row = [];
      for (var x = 0; x < dataWidth; x++) {
        // this makes foreground and background color to have a 43% (1/2.3) probability
        // spot color has 13% chance
        row[x] = Math.floor(rand() * 2.3);
      }
      var r = row.slice(0, mirrorWidth);
      r.reverse();
      row = row.concat(r);

      for (var i = 0; i < row.length; i++) {
        data.push(row[i]);
      }
    }

    return data;
  }

  function buildOpts(opts) {
    if (opts) {
      // Sanitize opts
      let { scale, color, spotcolor, bgcolor, size, seed } = opts;
      opts = { __proto__: null };
      if (typeof scale === "number") {
        opts.scale = scale;
      }
      if (typeof size === "number") {
        opts.size = size;
      }
      if (typeof seed === "string") {
        opts.seed = seed;
      }
      if (isColor(color)) {
        opts.color = color;
      }
      if (isColor(spotcolor)) {
        opts.spotcolor = spotcolor;
      }
      if (isColor(bgcolor)) {
        opts.bgcolor = bgcolor;
      }
    }

    var newOpts = { __proto__: null };

    newOpts.seed =
      opts.seed || Math.floor(Math.random() * Math.pow(10, 16)).toString(16);

    seedrand(newOpts.seed);

    newOpts.size = opts.size || 8;
    newOpts.scale = opts.scale || 4;
    newOpts.color = opts.color || createColor();
    newOpts.bgcolor = opts.bgcolor || createColor();
    newOpts.spotcolor = opts.spotcolor || createColor();

    return newOpts;
  }

  function renderIcon(opts, canvas) {
    opts = buildOpts(opts || { __proto__: null });
    var imageData = createImageData(opts.size);
    var width = Math.sqrt(imageData.length);

    canvas.width = canvas.height = opts.size * opts.scale;

    var cc = canvas.getContext("2d");
    cc.fillStyle = opts.bgcolor;
    cc.fillRect(0, 0, canvas.width, canvas.height);
    cc.fillStyle = opts.color;

    for (var i = 0; i < imageData.length; i++) {
      // if data is 0, leave the background
      if (imageData[i]) {
        var row = Math.floor(i / width);
        var col = i % width;

        // if data is 2, choose spot color, if 1 choose foreground
        cc.fillStyle = imageData[i] == 1 ? opts.color : opts.spotcolor;

        cc.fillRect(col * opts.scale, row * opts.scale, opts.scale, opts.scale);
      }
    }
    return canvas;
  }

  function createIcon(opts) {
    var canvas = document.createElement("canvas");

    renderIcon(opts, canvas);

    return canvas;
  }

  function isColor(color) {
    const hexPattern = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
    return hexPattern.test(color);
  }

  function createSvg(opts) {
    opts = buildOpts(opts || { __proto__: null });
    var imageData = createImageData(opts.size);

    var width = Math.sqrt(imageData.length);

    let rects = "";

    for (var i = 0; i < imageData.length; i++) {
      // if data is 0, leave the background
      if (imageData[i]) {
        var row = Math.floor(i / width);
        var col = i % width;

        const rect = `
        <rect
          x="${col * opts.scale}"
          y="${row * opts.scale}"
          width="${opts.scale}"
          height="${opts.scale}"
          fill="${imageData[i] == 1 ? opts.color : opts.spotcolor}"/>\n`;
        rects += rect;
      }
    }

    const size = opts.scale * opts.size;
    return `
    <svg viewBox="0 0 ${size} ${size}">
      <rect width="100%" height="100%" fill="${opts.bgcolor}"/>
      ${rects}
    </svg>`;
  }

  var api = {
    create: createIcon,
    render: renderIcon,
    createSvg,
  };

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})();
