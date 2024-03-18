# icons-font-command
A collection of over 78,000 high-quality free svg icons and tools for generating customized icon font. All icons are completely free for personal or business requirements.

Open [See all icons](https://uuware.github.io/icons-font-customization/dist/), to view all icons. You can change the icons color, size and background color, or search icons by a name, or save selected results.

You also can download PNG, JPG, ICO and Apple ICNS image files directly from online.


icons-font-command is icons-font-customization's sub project containing scripts to generate fonts.

icons-font-command project can be run separately and it gets svg icons remotely from icons-font-customization's github repository.

# How to use

## install
In order to run icons-font-command in your project to generate svg icons, you need to install it first:

```
npm i icons-font-command --save-dev
```

## icons-font.config.js
You need a config file to tell icons-font-command that what svg icons you want to use for generating the fonts.

[A sample inside of this project](https://github.com/uuware/icons-font-command/blob/main/icons-font.config.js)

You can select icons on [online tool](https://uuware.github.io/icons-font-customization/dist/) and click the menu icon at the top-right corner to open a panel, then you can click "Populate Configuration" to population configurations.
You copy those configurations and paste it to your icons-font.config.js, now you can generate your svg fonts.


## run it
You can run it from the command line like this:

```
npx icons-font-command
```

Or you can write a piece of code like this and for example, save it as generate-svg-fonts.js:
```
var path = require('path');
// if this js file is located at the same place of icons-font.config.js
var parameters = {'--config': path.join(__dirname, 'icons-font.config.js')};
var cmd = require('icons-font-command');
cmd.IconsFontLite.generateFont(parameters);
```

then you can run it like:

```
node generate-svg-fonts.js
```

Actually you can put above code at the end of icons-font.config.js and then run it:
```
node icons-font.config.js
```

## output
In icons-font.config.js you can define whether to output, so you can find font file(s) and license file(s) there.
If you open "sample.html" then you can confirm all generated icons.
You need to include "style.css" file to your web page or copy style.css's content to one of your existing css files.

---

# icons-font-customization
icons-font-customization is a collection of over 75,000 high-quality free svg icons and tools for generating customized icon font.

[See all icons](https://uuware.github.io/icons-font-customization/dist/)

And also there is a Desktop version for for Windows, Linux, MacOS.

All icons collected here are completely free for your personal or business requirements.<br>
You can use this tool to combine / generate your own icon webfonts for your project from different sources.

[See detail information at icons-font-customization](https://github.com/uuware/icons-font-customization)
