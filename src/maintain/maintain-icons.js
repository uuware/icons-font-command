/*
Optimize icons and create sample fonts for icons-font-customization project

By Sacrificing the performance (dynamically create css in html) reduced the html file size from 10M to 1M!
*/
var Path = require('path');
var { SvgOptimize } = require('./svg-optimize');
var { Utils } = require('../utils');
var Fs = require('fs');
var DOMParser = require('@xmldom/xmldom').DOMParser;

// !! the font file can't contain more than 30K a bit more icons
// the starting unicode for icons in font
var START_CODE = 10000;
var MAX_CODE = 30000;
var isChecking = false;
var checkingLastFile = '';

exports.MaintainIcons = class MaintainIcons {
    // save processing data
    static hub = {};

    static async update() {
        // find icons repertory: icons-font-customization project, whether is at the same folder?
        var customizationPath = Path.resolve(__dirname, '../../../icons-font-customization/');
        if (!Utils.dExist(customizationPath)) {
            // whether is under icons-font-customization?
            if (Utils.fExist(Path.resolve(__dirname, '../../../../package.json')) && Utils.dExist(Path.resolve(__dirname, '../../../../dist/svgs/'))) {
                customizationPath = Path.resolve(__dirname, '../../../../');
            } else {
                console.error(`Couldn't find project "icons-font-customization"`);
                return;
            }
        }
        var distPath = Path.resolve(customizationPath, 'dist/svgs') + Path.sep;
        if (!Utils.dExist(distPath)) {
            console.error(`The project "icons-font-customization" should have folder: ${distPath}`);
            return;
        }

        console.log(`Started to optimize icons and create sample html at: ${distPath}`);

        this.hub.index = -1;
        this.hub.fileIndex = 0;
        this.hub.svg = [];
        this.hub.list = [];
        this.hub.list.push('{');
        this.hub.countGroup = 0;
        this.hub.countAll = 0;
        this.hub.customizationPath = customizationPath;
        await this.switchFontStream(false);

        // html for icons to be replaced into sample page
        var output = '';
        var list = Utils.fList(distPath, false, true);
        for (var i = 0, len = list.length; i < len; i++) {
            this.hub.countGroup = 0;
            var oneGroup = await this.updateOneGroup(distPath, list[i]);
            output += oneGroup;
            this.hub.countAll += this.hub.countGroup;
        }

        // use plain text to save icons data
        this.hub.list.push('}');
        var iconsJSON = 'var iconsJSON = ' + this.hub.list.join('\n');

        var tempPath = Path.resolve(customizationPath, 'dist/template.html');
        var html = Utils.fRead(tempPath).toString();
        var regex = new RegExp('\<\!-- REMOVE-S --\>[\\s\\S]*?\<\!-- REMOVE-E --\>', 'gm');
        html = html.replace(regex, '');

        html = html
            .replace('<!-- ICONS-LIST -->', output)
            .replace('/*ICONS-JSON*/', iconsJSON)
            .replace('/*MAX_CODE*/', `${MAX_CODE}; //`)
            .replace('[#COUNT-ALL#]', this.hub.countAll.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"));
        var outputPath = Path.resolve(customizationPath, 'dist/index.html');
        Fs.writeFileSync(outputPath, html);

        console.log(`populated ${this.hub.countAll} icons`);

        // waiting until streamSvg finished
        await this.switchFontStream(true);
    }

    static async check() {
        isChecking = true;
        MAX_CODE = 1;
        await this.update();
    }

    static async switchFontStream(isLast) {
        if (this.hub.fontStream) {
            // close previous font file
            console.log('Create font file: ' + this.hub.fileIndex);
            this.hub.fontStream.end();
            await this.hub.wrapperPromise.promise;
            await this.outputFontFile(this.hub.customizationPath, this.hub.fileIndex);
            this.hub.fileIndex++;
        }
        if (isLast === true) {
            return;
        }

        // promise for waiting until streamSvg finished
        this.hub.wrapperPromise = Utils.wrapperPromise();

        var stream = require('stream');
        var SVGIcons2SVGFontStream = require('svgicons2svgfont');
        var fontStream = new SVGIcons2SVGFontStream({
            fontName: 'i-font' + this.hub.fileIndex,
            fontHeight: 1024,
            normalize: true,
        }).on('error', err => {
            console.log('SVGIcons2SVGFontStream error', err);
            isChecking && Utils.fRemove(checkingLastFile);
            isChecking && console.log(`Removed file: ${checkingLastFile}`);
        });

        var streamSvg = new stream.Writable({
            write: (chunk, encoding, next) => {
                this.hub.svg.push(chunk);
                next();
            }
        });
        streamSvg.on('finish', () => {
            // notice to continue
            this.hub.wrapperPromise.resolve();
        });
        fontStream.pipe(streamSvg).on('error', err => {
            console.log('streamSvg error', err);
        });
        this.hub.fontStream = fontStream;
    }

    // optimize icon and filename
    static async optimizeIcon(parentPath, iconPath, iconName, iconOptimizedName) {
        var fContent = Utils.fRead(iconPath).toString();
        try {
            // if run twice, the icon can reduce a little bit size again
            var result = await SvgOptimize.optimize(fContent);
            var newContent = (result && result.data) || fContent;
            // if (newContent != fContent) {
            //     console.log(`Optimized ${fContent.length} to ${newContent.length} for ${parentPath}${iconName}`);
            // }
            if (iconOptimizedName !== iconName) { //newContent != fContent || 
                Utils.fRemove(iconPath);
                iconPath = Path.resolve(parentPath, iconOptimizedName);
                Utils.fWrite(iconPath, fContent, false, true);
            }
            return newContent;
        } catch (err) {
            console.log(`Error while optimizeIcon ${parentPath}${iconName}`, err);
            return '';
        }
    }

    static async updateFolder(parentPath, parentSrc, iList) {
        var listFiles = Utils.fList(parentPath, true, false);
        for (var i3 = 0, len3 = listFiles.length; i3 < len3; i3++) {
            if (!listFiles[i3].endsWith('.svg')) {
                continue;
            }

            var iconPath = Path.resolve(parentPath, listFiles[i3]);
            var iconOptimizedName = listFiles[i3].replace(/[ "'\]\;\>\}]/g, '').replace(/[\#\[\<\{\&\$]/g, '-').replace(/--/g, '-').toLocaleLowerCase();
            var iconName2 = iconOptimizedName.substring(0, iconOptimizedName.length - 4);
            try {
                checkingLastFile = iconPath;
                var newContent = await this.optimizeIcon(parentPath, iconPath, listFiles[i3], iconOptimizedName);
                if (!newContent) {
                    isChecking && Utils.fRemove(checkingLastFile);
                    isChecking && console.log(`Removed file: ${checkingLastFile}`);
                    console.error(`Skip for error: ${parentSrc}${listFiles[i3]}`);
                    continue;
                }
                var doc = (new DOMParser()).parseFromString(newContent, 'application/xml');
                if (!doc) {
                    isChecking && Utils.fRemove(checkingLastFile);
                    isChecking && console.log(`Removed file: ${checkingLastFile}`);
                    console.error(`Skip for error: ${parentSrc}${listFiles[i3]}`);
                    continue;
                }

                isChecking && console.log(`index: ${this.hub.index}, iconPath: ${iconPath}`);
                this.hub.index++;
                if (this.hub.index - this.hub.fileIndex * MAX_CODE >= MAX_CODE) {
                    // create a new font file
                    await this.switchFontStream(false);
                }
                const fontCodeIndex = START_CODE + this.hub.index - this.hub.fileIndex * MAX_CODE;
                // console.log(`this.hub.index: ${this.hub.index}, fontCodeIndex: ${fontCodeIndex}`)
                var name = 'i' + fontCodeIndex;
                var Readable = require('stream').Readable;
                var glyph = Readable.from([newContent])
                glyph.metadata = {
                    name: name,
                    unicode: [String.fromCharCode(fontCodeIndex)],
                };
                this.hub.fontStream.write(glyph);
                // code for css is removed, then create css dynamically in sample html
                var src = parentSrc + iconOptimizedName;
                // plain text is less than JSON code
                var oneIcon = `{c:${this.hub.index},n:'${iconName2}',l:${newContent.length}${src === iconName2 + '.svg' ? '' : ",s:'" + src + "'"}},`;
                iList.push(oneIcon);
                this.hub.countGroup++;
            } catch (err) {
                console.log(`Error while update ${parentSrc}${listFiles[i3]}`, err);
            }
        }

        // Recursive for all sub folders
        var listSub = Utils.fList(parentPath, false, true);
        for (var i2 = 0, len2 = listSub.length; i2 < len2; i2++) {
            var subPath = Path.resolve(parentPath, listSub[i2]) + Path.sep;
            await this.updateFolder(subPath, `${parentSrc}${listSub[i2]}/`, iList);
        }
    }

    // write stream to font file
    static async outputFontFile(customizationPath, fileIndex) {
        var svgBuffer = Buffer.concat(this.hub.svg);
        this.hub.svg = [];
        var svg2ttf = require('svg2ttf');
        var ttf;
        try {
            ttf = svg2ttf(svgBuffer.toString(), {});
        } catch (error) {
            console.log(`Error while svg2ttf, fileIndex: ${fileIndex}`, error);
            isChecking && Utils.fRemove(checkingLastFile);
            isChecking && console.log(`Removed file: ${checkingLastFile}`);
        }

        // var ttf2woff = require('ttf2woff');
        // var outputPathWoff = Path.resolve(customizationPath, 'dist/index.woff');
        // var woff = ttf2woff(ttf.buffer, {});
        // Fs.writeFileSync(outputPathWoff, woff.buffer);
        // console.log(`Wrote woff: ${woff.buffer.length}`);

        var wawoff2 = require('wawoff2');
        var outputPathWoff2 = Path.resolve(customizationPath, `dist/index${fileIndex}.woff2`);
        const outWoff2 = await wawoff2.compress(ttf.buffer);
        !isChecking && Fs.writeFileSync(outputPathWoff2, outWoff2);
        console.log(`Wrote woff2: ${outputPathWoff2}`);
    }

    static async updateOneGroup(distPath, folderName) {
        var subPath = Path.resolve(distPath, folderName) + Path.sep;
        var subFiles = Utils.fList(subPath, false, true);
        console.log(`Processing ${folderName}`);
        var jsonPath = Path.resolve(subPath, 'info.json');
        var jsonText = Utils.fRead(jsonPath);
        var json = JSON.parse(jsonText);
        var id = folderName.replace(/\"\'\r\n/g, '');

        // icons' group for one group (category folder)
        this.hub.list.push(`"${id}":{preName:'${json.PreName}',sub:{`);
        // ${json['Copy License'] ? ' (Copy License File)' : ''}
        var oneGroup = `\n<div class="icon-group close" id="${id}">
<div class="info"><label class="name"><input type="checkbox" title="show or hide icons" onclick="onGroup('${id}')">${Utils.escapeHtml(json.Name)} (count: [#COUNT#])</label>,
Source: <a target="_blank" href="${json.Source}">visit</a>, 
License: <span class="license"><a target="_blank" href="${json['License Link']}">${json.License}</a></span>
</div>
<div class="icons">\n<div class="about">${Utils.escapeHtml(json.About)}</div>\n
`;
        for (var i = 0, len = subFiles.length; i < len; i++) {
            var subName = subFiles[i];
            oneGroup += `<div class="sub">${subName}</div>\n`;
            oneGroup += `<div id="${subName}" class="sub-icons">Loading...</div>\n`;

            var subPath2 = Path.resolve(subPath, subName) + Path.sep;
            this.hub.list.push(`"${subName}":[`);
            await this.updateFolder(subPath2, '', this.hub.list);
            this.hub.list.push('],');
        }
        oneGroup += `</div>\n</div>\n\n`;
        this.hub.list.push('}},');
        return oneGroup.replace('[#COUNT#]', this.hub.countGroup.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"));
    }
}
