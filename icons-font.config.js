/*
Define icons for generating font

Suggestions:
1, use WOFF2 for major browsers except IE;
Or: 2, use WOFF for major browsers and IE 9~, Edge 12~
Or: 3, combine WOFF2 with TTF for IE8~
  All 1, 2, 3 needs this code in HTML: `<i class="ifc-icon icon_name"></i>`
Or: 4, IE6-7 requires alternate CSS: Because '.css_class_name:before (not double-colon){ content: "" }'
  in css is only supported from IE8, so it needs different code in html: <i class="icon ifc-icon">&#x66;(icons code)</i>
*/

var cssTemplate = `
/*font-face*/

.ifc-box {
  display: -webkit-inline-flex;
  display: -moz-inline-box;
  display: -ms-inline-flexbox;
  display: inline-flex;
  position: relative;
  border-radius: 3px;
  text-align: center;
  vertical-align: middle;
  border: solid 1px #00f;
  width: 40px;
  height: 40px;
  font-size: 20px;
  color: blue;
  margin: 5px;
}

.ifc-icon {
  font-size: inherit;
  display: inline-block;
  font-family: '#font-family#';
  font-style: normal;
  font-weight: 400;
  font-variant: normal;
  text-transform: none;
  text-rendering: auto;
  line-height: 1em;
  vertical-align: middle;
  text-align: center;
  text-decoration: inherit;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  margin: auto;
}

/* Animation for spinners */
.ifc-spin {
  animation: ifc-spin-f 2s infinite linear;
  display: inline-block;
}
/* @keyframes for IE10~ and major browsers */
@keyframes ifc-spin-f {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(359deg);
  }
}

/*icons-css*/
`;

var htmlTemplate = `
<!DOCTYPE html><html><head>
	<title>icons-font-customization sample</title>
	<link rel="stylesheet" type="text/css" href="style.css">
</head><body><div class="sample">
#icons-html#</div></body></html>
`;

module.exports = {
  fontName: 'i-font',
  outputPath: 'dist/sample/',
  outputName: 'i-font', /* automatically add font extension to it  */
  startChar: 10000, // unicode start number
  svgicons2svgfont: {
    fontHeight: 1024
  },
  icons: [
    /* copy svg from icons-font-customization locally or remotely */
    { path: 'font-awesome/brands/apple.svg', name: 'fa-apple' },
    { path: 'font-awesome/brands/android.svg', name: 'fa-android' },
    { path: 'carbon-icons/svg/app-services.svg', name: 'cb-app-services' },
    { path: 'unicons/line/16-plus.svg', name: 'un-16-plus' },
    /* download svg from any other websites */
    { path: 'https://raw.githubusercontent.com/fontello/awesome-uni.font/29d4e3ff028fc850a21b5eaafde0a83f22f59cf1/src/svg/amazon.svg', name: 'fa-amazon' },
    { path: 'https://raw.githubusercontent.com/fontello/awesome-uni.font/29d4e3ff028fc850a21b5eaafde0a83f22f59cf1/src/svg/adjust.svg', name: 'fa-adjust' },
  ],
  fontType: {
    'woff2': true,
    'woff': true,
    'ttf': true,
    'eot': false,
    'svg': false,
  },
  cssTemplate: cssTemplate,
  htmlTemplate: htmlTemplate,
}
