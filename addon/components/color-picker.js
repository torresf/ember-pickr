/** @documenter yuidoc */

import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { computed, action, getProperties }  from '@ember/object';
import { assert } from '@ember/debug';
import { arg } from 'ember-arg-types';
import { object, func, string, bool, number, array } from 'prop-types';
import mergeDeep from "ember-pickr/utils/mergeDeep";
import Pickr from 'pickr';

const OPTION_FIELDS = [
  'theme',
  'closeOnScroll',
  'appClass',
  'useAsButton',
  'inline',
  'autoReposition',
  'sliders',
  'disabled',
  'lockOpacity',
  'outputPrecision',
  'comparison',
  'default',
  'swatches',
  'defaultRepresentation',
  'showAlways',
  'closeWithKey',
  'position',
  'adjustableNumber'
];

const DEFAULT_COMPONENTS = {
  palette: true,
  preview: true,
  opacity: true,
  hue: true,
  interaction: {
    hex: true,
    rgba: true,
    hsva: true,
    input: true,
    clear: true,
    save: true
  }
};

/**
 * class ColorPicker
 * @class ColorPicker
 * @public
 */
export default class ColorPicker extends Component {
  /**
    Components
    @argument components
    @type {object}
    @default '{}'
  */
  @arg(object) components = {}

  /**
    Which theme you want to use. Can be 'classic', 'monolith' or 'nano'
    @argument theme
    @type {'classic' | 'monolith' | 'nano'}
    @default 'classic'
   */
  @arg(string) theme = 'classic'

  /**
    Nested scrolling is currently not supported and as this would be really sophisticated to add this
    it's easier to set this to true which will hide pickr if the user scrolls the area behind it.
    @argument closeOnScroll
    @type boolean
    @default false
   */
  @arg(bool) closeOnScroll = false

  /**
    Custom class which gets added to the pcr-app. Can be used to apply custom styles.
    @argument appClass
    @type string
   */
  @arg(string) appClass = null

  /**
    Don't replace 'el' Element with the pickr-button, instead use 'el' as a button.
    If true, appendToBody will also be automatically true.
    @argument useAsButton
    @type boolean
    @default false
   */
  @arg(bool) useAsButton = false

  /**
    If true pickr won't be floating, and instead will append after the in el resolved element.
    Setting this to true will also set showAlways to true. It's possible to hide it via .hide() anyway.
    @argument inline
    @type boolean
    @default false
   */
  @arg(bool) inline = false

  /**
    If true, pickr will be repositioned automatically on page scroll or window resize.
    Can be set to false to make custom positioning easier.
    @argument autoReposition
    @type boolean
    @default true
   */
  @arg(bool) autoReposition = true

  /**
    Defines the direction in which the knobs of hue and opacity can be moved.
    'v' => opacity- and hue-slider can both only moved vertically.
    'hv' => opacity-slider can be moved horizontally and hue-slider vertically.
    Can be used to apply custom layouts
    @argument sliders
    @type {'v' | 'hv'}
    @default null
   */
  @arg(string) sliders = null

  /**
    Start state. If true 'disabled' will be added to the button's classlist.
    @argument disabled
    @type boolean
    @default false
   */
  @arg(bool) disabled = false

  /**
    If true, the user won't be able to adjust any opacity.
    Opacity will be locked at 1 and the opacity slider will be removed.
    The HSVaColor object also doesn't contain an alpha, so the toString() methods just
    print HSV, HSL, RGB, HEX, etc.
    @argument lockOpacity
    @type boolean
    @default false
   */
  @arg(bool) lockOpacity = false

  /**
    Precision of output string (only effective if components.interaction.input is true)
    @argument outputPrecision
    @type number
    @default 0
   */
  @arg(number) outputPrecision = 0

  /**
    If set to false it would directly apply the selected color on the button and preview.
    @argument comparison
    @type boolean
    @default true
   */
  @arg(bool) comparison = true

  /**
    Default color
    @argument comparison
    @type string
    @default '#42445a'
   */
  @arg(string) default = '#42445a'

  /**
    Optional color swatches. When null, swatches are disabled.
    Types are all those which can be produced by pickr e.g. hex(a), hsv(a), hsl(a), rgb(a), cmyk, and also CSS color names like 'magenta'.
    Example: swatches: ['#F44336', '#E91E63', '#9C27B0', '#673AB7'],
    @argument swatches
    @type array
   */
  @arg(array) swatches = []

  /**
    Default color representation of the input/output textbox.
    Valid options are `HEX`, `RGBA`, `HSVA`, `HSLA` and `CMYK`.
    @argument defaultRepresentation
    @type {'HEX' | 'RGBA' | 'HSVA' | 'HSLA' | 'CMYK' }
    @default true
   */
  @arg(string) defaultRepresentation = 'HEX'

  /**
    Option to keep the color picker always visible.
    You can still hide / show it via 'pickr.hide()' and 'pickr.show()'.
    The save button keeps its functionality, so still fires the onSave event when clicked.
    @argument showAlways
    @type boolean
    @default true
   */
  @arg(bool) showAlways = false

  /**
    Close pickr with a keypress.
    Default is 'Escape'. Can be the event key or code.
    (see: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key)
    @argument closeWithKey
    @type string
    @default 'Escape'
   */
  @arg(string) closeWithKey = 'Escape'

  /**
    Defines the position of the color-picker.
    Any combinations of top, left, bottom or right with one of these optional modifiers: start, middle, end
    Examples: top-start / right-end
    If clipping occurs, the color picker will automatically choose its position.
    @argument position
    @type string
    @default 'bottom-middle'
   */
  @arg(string) position = 'bottom-middle'

  /**
    Enables the ability to change numbers in an input field with the scroll-wheel.
    To use it set the cursor on a position where a number is and scroll, use ctrl to make steps of five
    @argument adjustableNumbers
    @type boolean
    @default true
   */
  @arg(bool) adjustableNumbers = true

  /**
   * Initialization done - Pickr can be used
   * @argument onInit
   * @type {Function}
   */
  @arg(func) onInit

  /**
   * Pickr got closed
   * @argument onHide
   * @type {Function}
   */
  @arg(func) onHide

  /**
   * Pickr got opened
   * @argument onShow
   * @type {Function}
   */
  @arg(func) onShow

  /**
   * User clicked the save / clear button. Also fired on clear with `null` as color.
   * @argument onSave
   * @type {Function}
   * @param {HSVaColorObject} colorObject
   */
  @arg(func) onSave

  /**
   * Called after user cleared the color.
   * @argument onClear
   * @type {Function}
   */
  @arg(func) onClear

  /**
   * Called after color has changed (but not saved). Also fired on `swatchselect`.
   * @argument onChange
   * @type {Function}
   * @param {HSVaColorObject} colorObject
   */
  @arg(func) onChange

  /**
   * User has stopped changing the color.
   * @argument onChangeStop
   * @type {Function}
   * @param {HSVaColorObject} colorObject
   */
  @arg(func) onChangeStop

  /**
   * Called after user clicked the cancel button (return to previous color).
   * @argument onCancel
   * @type {Function}
   */
  @arg(func) onCancel

  /**
   * Called after user clicked one of the swatches.
   * @argument onSwatchSelect
   * @type {Function}
   * @param {HSVaColorObject} colorObject
   */
  @arg(func) onSwatchSelect

  @tracked pickr;
  @tracked _options = {}
  @tracked _value;

  get value() {
    return this._value;
  }

  set value(value) {
    if (this.pickr) {
      let currentColor = this.formatColor(this.pickr.getColor());
      // This check is to avoid setting the same color twice one after another
      // Without this check, this will result in two computations for every color change
      if (currentColor !== value) {
        this.pickr.setColor(value);
      }
    }

    return value;
  }

  @action
  setupPickr(element) {
    this._options = {
      ...getProperties(this.args, OPTION_FIELDS),
      // Default color
      default: this.value || this.default || 'fff',
      strings: {
        save: this.args.saveLabel || 'Save',
        clear: this.args.clearLabel || 'Clear',
        cancel: this.args.cancelLabel || 'Cancel',
      }
    };

    this._components = mergeDeep(
      DEFAULT_COMPONENTS,
      this.components
    );

    this.pickr = Pickr.create({
      el: element,
      ...this._options,
      components: this._components
    });

    this.pickr.on('init', (...args) => {
      this._value = this.formatColor(this.pickr.getColor())

      if (this.onInit) {
        this.onInit(...args);
      }
    }).on('save', (...args) => {
      let [hsva, instance] = args;
      let value = this.formatColor(hsva);
      this._value = value;

      if (this.onSave) {
        this.onSave(hsva, instance);
      }
    }).on('hide', (...args) => {
      if (this.onHide) {
        this.onHide(...args);
      }
    }).on('show', (...args) => {
      if (this.onShow) {
        this.onShow(...args);
      }
    }).on('clear', (...args) => {
      if (this.onClear) {
        this.onClear(...args);
      }
    }).on('change', (...args) => {
      if (this.onChange) {
        this.onChange(...args);
      }
    }).on('changestop', (...args) => {
      if (this.onChangeStop) {
        this.onChangeStop(...args);
      }
    }).on('cancel', (...args) => {
      if (this.onCancel) {
        this.onCancel(...args);
      }
    }).on('swatchselect', (...args) => {
      if (this.onSwatchSelect) {
        this.onSwatchSelect(...args);
      }
    });
  }

  formatColor(hsva) {
    if (!hsva) {
      return null;
    }

    let value = hsva;
    let format = this.format;

    if (format) {
      format = format.toUpperCase();
      // backward compat till next major version
      if (format === 'HEX') {
        format = 'HEXA';
      }

      assert(
        '[ember-pickr]: Format must be one of HSVA, HSLA, RGBA, HEXA, CMYK',
        ['HSVA', 'HSLA', 'RGBA', 'HEXA', 'CMYK'].includes(format)
      );

      value = value[`to${format}`]().toString();
    }

    return value;
  }

  willDestroy() {
    this.pickr.destroyAndRemove();

    super.willDestroy(...arguments);
  }
}
