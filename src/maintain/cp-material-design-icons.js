/*
  copy files
*/
var Path = require('path');
var { Utils } = require('../utils');
var Fs = require('fs');
/*
1, map-icons/icons: remove "undefined" icons
2, core-ui-icons: remove "flag" folder as all contain colors
3, free-minimal-icon-pack: remove "white_icons" folder
super-tiny-icons: removed icons caused errors
Don't include (https://github.com/game-icons/icons) as it needs to include a mention "Icons made by {author}" in your derivative work.
capitaine-cursors: remove light
cryptocurrency-icons: remove color, icon (color), white
*/

const from = '../svgs/material-design-icons/symbols/web';
const to = '../icons-font-customization/dist/svgs/material-design-icons/symbols';
const cpOne = (one) => {
    Utils.fCopy(`${from}/${one}/materialsymbolsoutlined/${one}_48px.svg`, `${to}/${one}_outlined.svg`)
    Utils.fCopy(`${from}/${one}/materialsymbolsoutlined/${one}_fill1_48px.svg`, `${to}/${one}_outlined_fill1.svg`)

    Utils.fCopy(`${from}/${one}/materialsymbolsrounded/${one}_48px.svg`, `${to}/${one}_rounded.svg`)
    Utils.fCopy(`${from}/${one}/materialsymbolsrounded/${one}_fill1_48px.svg`, `${to}/${one}_rounded_fill1.svg`)

    Utils.fCopy(`${from}/${one}/materialsymbolssharp/${one}_48px.svg`, `${to}/${one}_sharp.svg`)
    Utils.fCopy(`${from}/${one}/materialsymbolssharp/${one}_fill1_48px.svg`, `${to}/${one}_sharp_fill1.svg`)
}
const cp = () => {
    if (!Utils.dExist(from) || !Utils.dExist(to)) {
        console.error(`From or To folder does not exist. From: ${from}, To: ${to}`);
        return;
    }
    console.log(`Copy: ${from} -> ${to}`);
    var list = Utils.fList(from, false, true);
    for (var i = 0, len = list.length; i < len; i++) {
        cpOne(list[i]);
    }
}
cp();
