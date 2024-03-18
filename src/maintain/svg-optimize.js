exports.SvgOptimize = class SvgOptimize {

    static svgo = require('svgo');
    static async optimize(content) {
        const config = {
            path: '',
            multipass: true,
            plugins: [
                {
                    name: 'preset-default',
                    params: {
                        overrides: {
                            inlineStyles: false,
                            removeViewBox: false,
                            cleanupEnableBackground: false,
                            removeHiddenElems: false,
                            convertShapeToPath: false,
                            moveElemsAttrsToGroup: false,
                            moveGroupAttrsToElems: false,
                            convertPathData: false,
                        }
                    }
                },
                'cleanupAttrs',
                'removeDoctype',
                'removeXMLProcInst',
                'removeComments',
                'removeMetadata',
                'removeTitle',
                'removeDesc',
                'removeUselessDefs',
                'removeEditorsNSData',
                'removeEmptyAttrs',
                'removeHiddenElems',
                'removeEmptyText',
                'removeEmptyContainers',
                // removeViewBox: false,
                'cleanupEnableBackground',
                // convertStyleToAttrs: true,
                'convertColors',
                'convertPathData',
                'convertTransform',
                'removeUnknownsAndDefaults',
                'removeNonInheritableGroupAttrs',
                'removeUselessStrokeAndFill',
                'removeUnusedNS',
                // 'cleanupIDs',
                'cleanupNumericValues',
                'moveElemsAttrsToGroup',
                'moveGroupAttrsToElems',
                'collapseGroups',
                // removeRasterImages: false,
                'mergePaths',
                'convertShapeToPath',
                'convertEllipseToCircle',
                'removeOffCanvasPaths',
                'removeDimensions',
                'removeOffCanvasPaths',
                {
                    name: 'removeAttrs',
                    params: { attrs: '(stroke|id|baseProfile|overflow|class|fill)' } //fill
                },
                'convertStyleToAttrs',
                'cleanupListOfValues',
                'sortAttrs'
            ],
        };
        return this.svgo.optimize(content, config);
    }
}
