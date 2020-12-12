exports.SvgOptimize = class SvgOptimize {

    static instance() {
        try {
            // don't need this for electron and also it has error for require('SVGO'), so treat it as try ... catch
            const Svgo = require('SVGO');
            this.svgo = new Svgo({
                plugins: [{
                    cleanupAttrs: true,
                }, {
                    removeDoctype: true,
                }, {
                    removeXMLProcInst: true,
                }, {
                    removeComments: true,
                }, {
                    removeMetadata: true,
                }, {
                    removeTitle: true,
                }, {
                    removeDesc: true,
                }, {
                    removeUselessDefs: true,
                }, {
                    removeEditorsNSData: true,
                }, {
                    removeEmptyAttrs: true,
                }, {
                    removeHiddenElems: true,
                }, {
                    removeEmptyText: true,
                }, {
                    removeEmptyContainers: true,
                }, {
                    removeViewBox: false,
                }, {
                    cleanupEnableBackground: true,
                }, {
                    convertStyleToAttrs: true,
                }, {
                    convertColors: true,
                }, {
                    convertPathData: true,
                }, {
                    convertTransform: true,
                }, {
                    removeUnknownsAndDefaults: true,
                }, {
                    removeNonInheritableGroupAttrs: true,
                }, {
                    removeUselessStrokeAndFill: true,
                }, {
                    removeUnusedNS: true,
                }, {
                    cleanupIDs: true,
                }, {
                    cleanupNumericValues: true,
                }, {
                    moveElemsAttrsToGroup: true,
                }, {
                    moveGroupAttrsToElems: true,
                }, {
                    collapseGroups: true,
                }, {
                    removeRasterImages: false,
                }, {
                    mergePaths: true,
                }, {
                    convertShapeToPath: true,
                }, {
                    sortAttrs: true,
                }, {
                    removeDimensions: true,
                }, {
                    removeAttrs: { attrs: '(stroke|fill|id|baseProfile|overflow|class)' },
                }, {
                    convertEllipseToCircle: true,
                }, {
                    removeOffCanvasPaths: true,
                    // }, {
                    //     reusePaths: true,
                }]
            });
        } catch (exp) {
            console.log(exp);
        }
    }

    static async optimize(content) {
        if (!this.svgo) {
            this.svgo = this.instance();
        }
        if (!this.svgo) {
            return;
        }
        return this.svgo.optimize(content);
    }
}
