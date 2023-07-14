# icons-font-command
icons-font-command is a project to generate svg fonts, and it's used by icons-font-customization.

icons-font-command project can be run separately and it gets svg icons remotely from icons-font-customization's github repository.

# How to use

## install
In order to run icons-font-command in your project to generate svg icons, you need to install it first:

```
npm i icons-font-command --save-dev
```

## icons-font.config.js
You need a config file to tell icons-font-command that what svg icons you want to generate.

[A sample inside of this project](https://github.com/uuware/icons-font-command/blob/main/icons-font.config.js)

[icons-font-customization](https://github.com/uuware/icons-font-customization) has a tool to help you choose SVGs from 33,000 icons easily. You jump to [online tool](https://uuware.github.io/icons-font-customization/dist/) and check on any icons set and click on icons to choose them. At the top-right corner there is a triangle icon, click it it will open a panel, and you can click "Populate Configuration" to population configurations.
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
icons-font-customization is a collection of over 33,000 high-quality free svg icons and tools for generating customized icon font. All icons are completely free for personal or business requirements.
[See all icons](https://uuware.github.io/icons-font-customization/dist/)


All icons collected here are completely free for your personal or business requirements.<br>
You can use this tool to combine / generate your own icon webfonts for your project from different sources.

[See detail information at icons-font-customization](https://github.com/uuware/icons-font-customization)
