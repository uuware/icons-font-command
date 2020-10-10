/*
icons-font-command
Sub project of icons-font-customization, a collection of over 33,000 high-quality free svg icons and tools
for generating customized icon font. All icons are completely free for personal or business requirements.
See all icons at: https://uuware.github.io/icons-font-customization/dist/
See detail information at icons-font-customization: https://github.com/uuware/icons-font-customization

author: uuware@gmail.com
license: MIT
*/
var Path = require('path');
var { Utils } = require('./utils');
var { FontUtils } = require('./font-utils');
var { MaintainIcons } = require('./maintain/maintain-icons');

class IconsFontLite {

    // called from command line interface
    static async cmd() {
        var cmdMap = Utils.getCmdMap();
        // Optimize icons and create sample fonts for icons-font-customization project
        if (cmdMap['--maintain']) {
            await MaintainIcons.update();
            process.exit();
            return;
        }
        if (cmdMap['--copyconfig']) {
            var cwd = process.cwd();
            var cfgPath = Path.resolve(cwd, 'icons-font.config.js');
            if (Utils.fExist(cfgPath)) {
                console.log(`icons-font.config.js exists in current folder: ${cfgPath}`);
                return;
            }
            var cfgPathSrc = Path.resolve(__dirname, '../icons-font.config.js');
            if (!Utils.fExist(cfgPathSrc)) {
                console.log(`Couldn't find icons-font.config.js: ${cfgPathSrc}`);
                return;
            }
            if (!Utils.fCopy(cfgPathSrc, cfgPath)) {
                console.error(`Failed to copy icons-font.config.js from ${cfgPathSrc} to ${cfgPath}`);
                return;
            }
            console.log(`Copied icons-font.config.js to ${cfgPath}`);
            return;
        }

        // for most the case, generate icon font
        this.generateFont(cmdMap);
    }

    static async generateFont(cmdMap) {
        console.log(`${'*'.repeat(40)}
Generate icon font:\n\ticons-font-command --config config-file-path
Copy default configuration file:\n\ticons-font-command --copyconfig
${'*'.repeat(40)}`);

        // the path of config file should be relative to pwd
        var cfgPath = cmdMap['--config'] || 'icons-font.config.js';
        if (!cfgPath.startsWith('/')) {
            var cwd = process.cwd();
            cfgPath = Path.resolve(cwd, cfgPath);
        }
        if (!Utils.fExist(cfgPath)) {
            console.log(`Can't find config file: ${cfgPath}`);
            return;
        }

        console.log(`Import configuration from: ${cfgPath}`);
        var jsonCfg = require(cfgPath);
        if (!jsonCfg || !jsonCfg.icons || jsonCfg.icons.length < 1) {
            console.log(`"icons" are not defined in config file: ${cfgPath}`);
            return;
        }
        await FontUtils.generateFont(jsonCfg);
        process.exit();
    }
}

module.exports = { IconsFontLite, Utils };
// Offer ES module interop compatibility.
module.exports.default = IconsFontLite;
