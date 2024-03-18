var Fs = require('fs');
var Path = require('path');
var { Utils } = require('./utils');

const template = `
<div><span class="ifc-box"><i class="ifc-icon [#name#]"></i></span>
	HTML code: <span class="code">
		With CSS: &lt;span class=&quot;ifc-box&quot;&gt;&lt;i class=&quot;ifc-icon [#name#]&quot;&gt;&lt;/i&gt;&lt;/span&gt; (<span class='cp' onclick='navigator.clipboard.writeText("&lt;style&gt;.[#name#]:before { content: \\"\\\\[#code#]\\"; }&lt;/style&gt;\\n<span class=\\"ifc-box\\"><i class=\\"ifc-icon [#name#]\\"></i></span>")'>copy</span>)<br>
		Without CSS: &lt;span class=&quot;ifc-box&quot;&gt;&lt;i class=&quot;ifc-icon&quot;&gt;&amp;#x[#code#];&lt;/i&gt;&lt;/span&gt; (<span class='cp' onclick='navigator.clipboard.writeText("<span class=\\"ifc-box\\"><i class=\\"ifc-icon\\">"+"&"+"#x[#code#];</i></span>")'>copy</span>)
	</span> From: [#from#]</div>
`;
exports.FontUtils = class FontUtils {
    static async generateFont(jsonCfg) {
        var cwd = process.cwd();
        var iconsRoot = jsonCfg.iconsRoot; // should point to icons-font-customization/dist/svgs/
        if (!iconsRoot) {
            // if project icons-font-customization exists, then retrieve icons from there, otherwise request icons remotely
            // find icons repertory: icons-font-customization project
            var customizationPath = Path.resolve(__dirname, '../../icons-font-customization/dist/svgs/') + Path.sep;
            if (Utils.dExist(customizationPath)) {
                iconsRoot = customizationPath;
                console.error(`Retrieve icons locally form ${customizationPath}`);
            } else {
                iconsRoot = 'https://raw.githubusercontent.com/uuware/icons-font-customization/main/dist/svgs/';
            }
        }
        if (iconsRoot.indexOf('://') < 0) {
            if (!iconsRoot.startsWith('/') && !iconsRoot.startsWith('\\')) {
                iconsRoot = Path.resolve(cwd, iconsRoot);
            }
            if (!Utils.fExist(iconsRoot)) {
                console.log(`Can't find icons' folder: ${iconsRoot}`);
                return;
            }
        }
        console.log(`iconsRoot: ${iconsRoot}`);

        var targetPath = jsonCfg.outputPath;
        if (!targetPath.startsWith('/') && !targetPath.startsWith('\\')) {
            targetPath = Path.resolve(cwd, targetPath);
        }
        console.log(`outputPath: ${targetPath}`);
        if (!Utils.dExist(targetPath)) {
            Utils.dCreate(targetPath, true);
        }
        if (!Utils.fExist(targetPath)) {
            console.log(`Can't create outputPath: ${targetPath}`);
            return;
        }

        // promise for waiting until streamSvg finished
        var wrapperPromise = Utils.wrapperPromise();
    
        var stream = require('stream');
        var SVGIcons2SVGFontStream = require('svgicons2svgfont');
        var fontStream = new SVGIcons2SVGFontStream({
            fontName: jsonCfg.fontName,
            fontHeight: (jsonCfg.svgicons2svgfont && jsonCfg.svgicons2svgfont.fontHeight) || 1024,
            normalize: true,
        });

        var jsonSaved = {};
        var cssBuffer = [];
        var htmlBuffer = [];
        var svgBuffer = [];
        var streamSvg = new stream.Writable({
            write: function (chunk, encoding, next) {
                svgBuffer.push(chunk);
                next();
            }
        });
        streamSvg.on('finish', () => {
            // notice to continue
            wrapperPromise.resolve();
        });

        // Output to streamSvg
        var stream = require('stream');
        fontStream.pipe(streamSvg);

        var startChar = jsonCfg.startChar;
        for (var i = 0, len = jsonCfg.icons.length; i < len; i++) {
            var one = jsonCfg.icons[i];
            var isRemote;
            var inputPath = one.path;
            if (!inputPath.startsWith('http://') && !inputPath.startsWith('https://')) {

                var tempIconsRoot = one.iconsRoot || iconsRoot;
                if (!tempIconsRoot.endsWith('/') && !tempIconsRoot.endsWith('\\')) {
                    tempIconsRoot += '/';
                }
                inputPath = tempIconsRoot + one.path;
                isRemote = inputPath.indexOf('://') > 0;

                var firstFolder = one.path.split('/')[0];
                var json = jsonSaved[firstFolder];
                if (!json) {
                    jsonSaved[firstFolder] = 1;
                    var infoPath = tempIconsRoot + firstFolder + '/info.json';
                    json = await this.getInfoJson(infoPath, isRemote);
                    if (json && json.Name && json.License && json['License Link']) {
                        cssBuffer.push(`\n/* ${json.Name}, License: ${json.License}, Link: ${json['License Link']} */\n`);
                        if (json['Copy License']) {
                            var licensePath = tempIconsRoot + firstFolder + '/License.txt';
                            var licenseText = await this.getFileContent(licensePath, isRemote);
                            if (licenseText) {
                                var licenseTo = Path.resolve(targetPath, 'License-' + firstFolder + '.txt');
                                Utils.fWrite(licenseTo, licenseText);
                            }
                        }
                    }
                }
            } else {
                isRemote = true;
            }

            try {
                // Writing glyphs
                startChar++;
                var name = one.name;
                var unicode = one.code || startChar;

                var iconContent = await this.getFileContent(inputPath, isRemote);
                var glyph = new stream.PassThrough();
                glyph.end(Buffer.from(iconContent));
                // var glyph = Fs.createReadStream(inputPath);
                glyph.metadata = {
                    name: name,
                    unicode: [String.fromCharCode(unicode)],
                };
                fontStream.write(glyph);
            } catch (err) {
                console.log(`Error while processing ${inputPath}`, err);
                continue;
            }

            var unicode16 = unicode.toString(16);
            cssBuffer.push(`.${name}:before { content: "\\${unicode16}"; }\n`);
            htmlBuffer.push(template.replace(/\[#name#\]/g, name).replace(/\[#code#\]/g, unicode16).replace(/\[#from#\]/g, firstFolder));
        }
        console.log(`populated ${startChar - jsonCfg.startChar} icons, at: ${targetPath}`);

        // Do not forget to end the stream
        fontStream.end();

        // waiting until streamSvg finished
        await wrapperPromise.promise;
        await this.generateFontSub(targetPath, jsonCfg, Buffer.concat(svgBuffer), cssBuffer.join(''), htmlBuffer.join(''));
        return true;
    }

    static async getFileContent(filePath, isRemote) {
        if (isRemote) {
            var content = await Utils.getWeb(filePath).catch((error) => {
                console.log('Error getWeb:' + filePath);
                return false;
            });
            return content;
        }

        // get locally
        if (Utils.fExist(filePath)) {
            var content = Utils.fRead(filePath);
            return content;
        }
        return false;
    }

    static async getInfoJson(filePath, isRemote) {
        var content = await this.getFileContent(filePath, isRemote);
        if (content) {
            try {
                return JSON.parse(content);
            } catch (err) {
                console.log(`Error while getting info file ${filePath}`, err);
            }
        }
        return {};
    }

    static async generateFontSub(targetPath, jsonCfg, svgBuffer, cssText, htmlText) {
        var t = '?t=' + (Date.now() % 1000000);

        var svg2ttf = require('svg2ttf');
        var outputPathTtf = Path.resolve(targetPath, jsonCfg.outputName + '.ttf');
        var ttf = svg2ttf(svgBuffer.toString(), {});
        var cssSrc = '';
        if (jsonCfg.fontType.eot) {
            var ttf2eot = require('ttf2eot');
            var outputPathEot = Path.resolve(targetPath, jsonCfg.outputName + '.eot');
            var eot = ttf2eot(ttf.buffer);
            Fs.writeFileSync(outputPathEot, eot.buffer);
            cssSrc += `url('${jsonCfg.outputName}.eot${t}');\n  src:url('${jsonCfg.outputName}.eot${t}#iefix') format('embedded-opentype')`;
        }

        if (jsonCfg.fontType.woff2) {
            var wawoff2 = require('wawoff2');
            var outputPathWoff2 = Path.resolve(targetPath, jsonCfg.outputName + '.woff2');
            // src - Buffer or Uint8Array
            const outWoff2 = await wawoff2.compress(ttf.buffer);
            Fs.writeFileSync(outputPathWoff2, outWoff2);
            if (cssSrc !== '') { cssSrc += ',\n    '; }
            cssSrc += `url('${jsonCfg.outputName}.woff2${t}') format('woff2')`;
        }

        if (jsonCfg.fontType.woff) {
            var ttf2woff = require('ttf2woff');
            var outputPathWoff = Path.resolve(targetPath, jsonCfg.outputName + '.woff');
            var woff = ttf2woff(ttf.buffer, {});
            Fs.writeFileSync(outputPathWoff, woff.buffer);
            if (cssSrc !== '') { cssSrc += ',\n    '; }
            cssSrc += `url('${jsonCfg.outputName}.woff${t}') format('woff')`;
        }

        if (jsonCfg.fontType.ttf) {
            Fs.writeFileSync(outputPathTtf, ttf.buffer);
            if (cssSrc !== '') { cssSrc += ',\n    '; }
            cssSrc += `url('${jsonCfg.outputName}.ttf${t}') format('truetype')`;
        }

        if (jsonCfg.fontType.svg) {
            var outputPathSvg = Path.resolve(targetPath, jsonCfg.outputName + '.svg');
            Fs.writeFileSync(outputPathSvg, svgBuffer);
            if (cssSrc !== '') { cssSrc += ',\n    '; }
            cssSrc += `url('${jsonCfg.outputName}.svg${t}#${jsonCfg.fontName}') format('svg')`;
        }

        var fontFace = `@font-face {
  font-family: '${jsonCfg.fontName}';
  src:${cssSrc};
  font-weight: normal;
  font-style: normal;
}
`;
        var css = jsonCfg.cssTemplate;
        css = css.replace(/\/\*font-face\*\//g, fontFace).replace(/\/\*icons-css\*\//g, cssText).replace(/#font-family#/g, jsonCfg.fontName);
        var outputPathCss = Path.resolve(targetPath, 'style.css');
        Fs.writeFileSync(outputPathCss, css);

        var html = jsonCfg.htmlTemplate;
        html = html.replace(/#icons-html#/g, htmlText);
        var outputPathHtml = Path.resolve(targetPath, 'sample.html');
        Fs.writeFileSync(outputPathHtml, html);
        console.log('Finished');
    }

}
