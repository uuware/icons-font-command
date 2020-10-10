/*
Optimize icons and create sample fonts for icons-font-customization project

By Sacrificing the performance (dynamically create css in html) reduced the html file size from 10M to 1M!
*/
var Path = require('path');
var { SvgOptimize } = require('./svg-optimize');
var { Utils } = require('../utils');
var Fs = require('fs');

// the starting unicode for icons in font
var START_CODE = 10000;

exports.MaintainIcons = class MaintainIcons {
    // save processing data
    static hub = {};
    static async update() {
        // find icons repertory: icons-font-customization project, whether is at same folder?
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

        // promise for waiting until streamSvg finished
        var wrapperPromise = Utils.wrapperPromise();

        console.log(`Started to optimize icons and create sample html at: ${distPath}`);
        var stream = require('stream');
        var SVGIcons2SVGFontStream = require('svgicons2svgfont');
        var fontStream = new SVGIcons2SVGFontStream({
            fontName: 'i-font',
            fontHeight: 1024,
            normalize: true,
        }).on('error', err => {
            console.log('SVGIcons2SVGFontStream error', err);
        });

        this.hub.index = START_CODE - 1;
        this.hub.svg = [];
        this.hub.list = [];
        this.hub.list.push('{');
        var streamSvg = new stream.Writable({
            write: function (chunk, encoding, next) {
                MaintainIcons.hub.svg.push(chunk);
                next();
            }
        });
        streamSvg.on('finish', () => {
            // notice to continue
            wrapperPromise.resolve();
        });
        fontStream.pipe(streamSvg).on('error', err => {
            console.log('streamSvg error', err);
        });
        this.hub.fontStream = fontStream;

        // html for icons to be replaced into sample page
        var output = '';
        var list = Utils.fList(distPath, false, true);
        for (var i = 0, len = list.length; i < len; i++) {
            var oneGroup = await this.updateOneGroup(distPath, list[i]);
            output += oneGroup;
        }

        // use plain text to save icons data
        this.hub.list.push('}');
        var iconsJSON = 'var iconsJSON = ' + this.hub.list.join('\n');

        var tempPath = Path.resolve(customizationPath, 'dist/template.html');
        var html = Utils.fRead(tempPath).toString();
        var regex = new RegExp('\<\!-- REMOVE-S --\>[\\s\\S]*?\<\!-- REMOVE-E --\>', 'gm');
        html = html.replace(regex, '');

        html = html.replace('[#ICONS-LIST#]', output);
        html = html.replace('/*ICONS-JSON*/', iconsJSON);
        var outputPath = Path.resolve(customizationPath, 'dist/index.html');
        Fs.writeFileSync(outputPath, html);

        console.log(`populated ${this.hub.index - START_CODE} icons`);
        // Do not forget to end the stream
        fontStream.end();

        // waiting until streamSvg finished
        await wrapperPromise.promise;
        this.outputFontFile(customizationPath);
    }

    // optimize icon and filename
    static async optimizeIcon(parentPath, iconPath, iconName, iconOptimizedName) {
        var newContent = '';
        var fContent = Utils.fRead(iconPath);
        try {
            if (iconOptimizedName !== iconName) {
                Utils.fRemove(iconPath);
            }
            // if run twice, the icon can reduce a little size again
            var result = await SvgOptimize.optimize(fContent);
            newContent = (result && result.data) || fContent;
            if (newContent != fContent) {
                console.log(`Optimized ${fContent.length} to ${newContent.length} for ${parentPath}${iconName}`);
            }
            if (newContent != fContent || iconOptimizedName !== iconName) {
                iconPath = Path.resolve(parentPath, iconOptimizedName);
                Utils.fWrite(iconPath, newContent, false, true);
            }
        } catch (err) {
            console.log(`Error while processing ${parentPath}${iconName}`, err);
        }
        return newContent;
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
                var newContent = await this.optimizeIcon(parentPath, iconPath, listFiles[i3], iconOptimizedName);
                this.hub.index++;
                var name = 'i' + this.hub.index;
                var Readable = require('stream').Readable;
                var glyph = Readable.from([newContent])
                glyph.metadata = {
                    name: name,
                    unicode: [String.fromCharCode(this.hub.index)],
                };
                this.hub.fontStream.write(glyph);
                // code for css is removed, then create css dynamically in sample html
                var src = parentSrc + iconOptimizedName;
                // plain text is less than JSON code
                var oneIcon = `{c:${this.hub.index},n:'${iconName2}',l:${newContent.length}${src === iconName2 + '.svg' ? '' : ",s:'" + src + "'"}},`;
                iList.push(oneIcon);
            } catch (err) {
                console.log(`Error while processing ${parentSrc}${listFiles[i3]}`, err);
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
    static outputFontFile(customizationPath) {
        var svgBuffer = Buffer.concat(MaintainIcons.hub.svg);
        var svg2ttf = require('svg2ttf');
        var ttf = svg2ttf(svgBuffer.toString(), {});

        var ttf2woff = require('ttf2woff');
        var outputPathWoff = Path.resolve(customizationPath, 'dist/index.woff');
        var woff = ttf2woff(ttf.buffer, {});
        Fs.writeFileSync(outputPathWoff, woff.buffer);
        console.log(`Wrote woff: ${woff.buffer.length}`);
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
        this.hub.list.push(`"${id}":{preName:'at',sub:{`);
        var oneGroup = `\n<div class="icon-group hide" id="${id}">
<div class="info"><label class="name"><input type="checkbox" title="show or hide icons" onclick="onGroup('${id}')">${json.Name}</label>
Source: <a target="_blank" href="${json.Source}">visit</a>, 
License: <span class="license"><a target="_blank" href="${json['License Link']}">${json.License}${json['Copy License'] ? ' (Copy License File)' : ''}</a></span>
</div>
<div class="icons">\n<div class="about">${json.About}</div>\n
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
        return oneGroup;
    }
}
