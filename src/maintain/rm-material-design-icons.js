/*
  tide up files
*/
var Path = require('path');
var { Utils } = require('../utils');
var Fs = require('fs');

// remove materialiconstwotone
const trimStr = (fPath) => {
    // remove <rect fill="none" height="20" width="20"/>
    // <path d="M0 0h24v24H0V0z" fill="none"/>
    // <g fill="none"><path d="M0 0h24v24H0V0z"/><path d="M0 0h24v24H0V0z" opacity=".87"/></g>
    var changed = false;
    var fContent = Utils.fRead(fPath).toString();

    var rectInd = fContent.indexOf('<g fill="none">');
    while (rectInd > 0) {
        changed = true;
        var rectInd2 = fContent.indexOf('</g>', rectInd);
        fContent = fContent.substring(0, rectInd) + fContent.substring(rectInd2 + 1);
        rectInd = fContent.indexOf('<g fill="none">');
    }

    var rectInd = fContent.indexOf(' fill="none"');
    while (rectInd > 0) {
        changed = true;
        var rectInd1 = fContent.lastIndexOf('<', rectInd);
        var rectInd2 = fContent.indexOf('>', rectInd);
        fContent = fContent.substring(0, rectInd1) + fContent.substring(rectInd2 + 1);
        rectInd = fContent.indexOf(' fill="none"');
    }
    changed && Utils.fWrite(fPath, fContent.replace(/\<g\>\<\/g\>/g, ''));
}

const processFiles = (folder) => {
    if (folder.endsWith(`/materialiconstwotone`)) {
        var fList = Utils.fList(`${folder}`, true, false);
        for (var m = 0, fLen = fList.length; m < fLen; m++) {
            Utils.fRemove(`${folder}/${fList[m]}`);
        }
        Utils.dRemove(`${folder}`, true);
        return true;
    }
    if (Utils.fExist(`${folder}/20px.svg`) && Utils.fExist(`${folder}/24px.svg`)) {
        Utils.fRemove(`${folder}/20px.svg`);
    }
    var fList = Utils.fList(`${folder}`, true, false);
    for (var m = 0, fLen = fList.length; m < fLen; m++) {
        trimStr(`${folder}/${fList[m]}`);
    }

    var list3 = Utils.fList(`${folder}`, false, true);
    for (var k = 0, len3 = list3.length; k < len3; k++) {
        processFiles(`${folder}/${list3[k]}`);
    }
    return false;
}
const rm = () => {
    const from = '../icons-font-customization/dist/svgs/material-design-icons/src';
    if (!Utils.dExist(from)) {
        console.error(`From folder does not exist. From: ${from}`);
        return;
    }
    console.log(`Remove materialiconstwotone folders: ${from}`);
    processFiles(from);
}
rm();
