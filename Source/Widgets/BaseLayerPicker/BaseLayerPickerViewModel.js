/*global define*/
define([
        '../../Core/defaultValue',
        '../../Core/defined',
        '../../Core/defineProperties',
        '../../Core/DeveloperError',
        '../../Core/isArray',
        '../../Scene/EllipsoidTerrainProvider',
        '../createCommand',
        '../../ThirdParty/knockout'
    ], function(
        defaultValue,
        defined,
        defineProperties,
        DeveloperError,
        isArray,
        EllipsoidTerrainProvider,
        createCommand,
        knockout) {
    "use strict";

    /**
     * The view model for {@link BaseLayerPicker}.
     * @alias BaseLayerPickerViewModel
     * @constructor
     *
     * @param {CentralBody} options.centralBody The CentralBody to use.
     * @param {ProviderViewModel[]} [options.imageryProviderViewModels=[]] The array of ProviderViewModel instances to use for imagery.
     * @param {ProviderViewModel} [options.selectedImageryProviderViewModel] The view model for the current base imagery layer, if not supplied the first available base layer is used.  This value is only valid if options.baseLayerPicker is set to true.
     * @param {ProviderViewModel[]} [options.terrainProviderViewModels=[]] The array of ProviderViewModel instances to use for terrain.
     * @param {ProviderViewModel} [options.selectedTerrainProviderViewModel] The view model for the current base terrain layer, if not supplied the first available base layer is used.  This value is only valid if options.baseLayerPicker is set to true.
     *
     * @exception {DeveloperError} imageryProviderViewModels must be an array.
     * @exception {DeveloperError} terrainProviderViewModels must be an array.
     */
    var BaseLayerPickerViewModel = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var centralBody = options.centralBody;
        var imageryProviderViewModels = defaultValue(options.imageryProviderViewModels, []);
        var terrainProviderViewModels = defaultValue(options.terrainProviderViewModels, []);

        //>>includeStart('debug', pragmas.debug);
        if (!defined(centralBody)) {
            throw new DeveloperError('centralBody is required');
        }
        //>>includeEnd('debug');

        this._centralBody = centralBody;

        /**
         * Gets or sets an array of ProviderViewModel instances available for imagery selection.
         * This property is observable.
         * @type {Array}
         */
        this.imageryProviderViewModels = imageryProviderViewModels.slice(0);

        /**
         * Gets or sets an array of ProviderViewModel instances available for terrain selection.
         * This property is observable.
         * @type {Array}
         */
        this.terrainProviderViewModels = terrainProviderViewModels.slice(0);

        /**
         * Gets or sets whether the imagery selection drop-down is currently visible.
         * @type {Boolean}
         * @default false
         */
        this.dropDownVisible = false;

        knockout.track(this, ['imageryProviderViewModels', 'terrainProviderViewModels', 'dropDownVisible']);

        /**
         * Gets the button tooltip.  This property is observable.
         * @type {String}
         */
        this.buttonTooltip = undefined;
        knockout.defineProperty(this, 'buttonTooltip', function() {
            var selectedImagery = this.selectedImagery;
            var selectedTerrain = this.selectedTerrain;

            var imageryTip = defined(selectedImagery) ? selectedImagery.name : undefined;
            var terrainTip = defined(selectedTerrain) ? selectedTerrain.name : undefined;

            if (defined(imageryTip) && defined(terrainTip)) {
                return imageryTip + '\n' + terrainTip;
            } else if (defined(imageryTip)) {
                return imageryTip;
            }
            return terrainTip;
        });

        /**
         * Gets the button background image.  This property is observable.
         * @type {String}
         */
        this.buttonImageUrl = undefined;
        knockout.defineProperty(this, 'buttonImageUrl', function() {
            var viewModel = this.selectedImagery;
            return defined(viewModel) ? viewModel.iconUrl : undefined;
        });

        /**
         * Gets or sets the currently selected imagery.  This property is observable.
         * @type {ProviderViewModel}
         * @default undefined
         */
        this.selectedImagery = undefined;
        var selectedImageryViewModel = knockout.observable();

        this._currentImageryProviders = [];
        knockout.defineProperty(this, 'selectedImagery', {
            get : function() {
                return selectedImageryViewModel();
            },
            set : function(value) {
                if (selectedImageryViewModel() === value) {
                    this.dropDownVisible = false;
                    return;
                }

                var i;
                var currentImageryProviders = this._currentImageryProviders;
                var currentImageryProvidersLength = currentImageryProviders.length;
                var imageryLayers = this._centralBody.imageryLayers;
                for (i = 0; i < currentImageryProvidersLength; i++) {
                    var layersLength = imageryLayers.length;
                    for ( var x = 0; x < layersLength; x++) {
                        var layer = imageryLayers.get(x);
                        if (layer.imageryProvider === currentImageryProviders[i]) {
                            imageryLayers.remove(layer);
                            break;
                        }
                    }
                }

                if (defined(value)) {
                    var newProviders = value.creationCommand();
                    if (isArray(newProviders)) {
                        var newProvidersLength = newProviders.length;
                        for (i = newProvidersLength - 1; i >= 0; i--) {
                            imageryLayers.addImageryProvider(newProviders[i], 0);
                        }
                        this._currentImageryProviders = newProviders.slice(0);
                    } else {
                        this._currentImageryProviders = [newProviders];
                        imageryLayers.addImageryProvider(newProviders, 0);
                    }
                }
                selectedImageryViewModel(value);
                this.dropDownVisible = false;
            }
        });

        /**
         * Gets or sets the currently selected terrain.  This property is observable.
         * @type {ProviderViewModel}
         * @default undefined
         */
        this.selectedTerrain = undefined;
        var selectedTerrainViewModel = knockout.observable();

        knockout.defineProperty(this, 'selectedTerrain', {
            get : function() {
                return selectedTerrainViewModel();
            },
            set : function(value) {
                if (selectedTerrainViewModel() === value) {
                    this.dropDownVisible = false;
                    return;
                }

                var newProvider;
                if (defined(value)) {
                    newProvider = value.creationCommand();
                }

                this._centralBody.depthTestAgainstTerrain = !(newProvider instanceof EllipsoidTerrainProvider);
                this._centralBody.terrainProvider = newProvider;
                selectedTerrainViewModel(value);
                this.dropDownVisible = false;
            }
        });

        var that = this;
        this._toggleDropDown = createCommand(function() {
            that.dropDownVisible = !that.dropDownVisible;
        });

        this.selectedImagery = defaultValue(options.selectedImageryProviderViewModel, imageryProviderViewModels[0]);
        this.selectedTerrain = defaultValue(options.selectedTerrainProviderViewModel, terrainProviderViewModels[0]);
    };

    defineProperties(BaseLayerPickerViewModel.prototype, {
        /**
         * Gets the command to toggle the visibility of the drop down.
         * @memberof BaseLayerPickerViewModel.prototype
         *
         * @type {Command}
         */
        toggleDropDown : {
            get : function() {
                return this._toggleDropDown;
            }
        },

        /**
         * Gets the centralBody.
         * @memberof BaseLayerPickerViewModel.prototype
         *
         * @type {CentralBody}
         */
        centralBody : {
            get : function() {
                return this._centralBody;
            }
        }
    });

    return BaseLayerPickerViewModel;
});