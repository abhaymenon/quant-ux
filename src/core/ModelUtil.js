import lang from '../dojo/_base/lang'
import CoreUtil from './CoreUtil'

class ModelUtil {

    constructor() {
      this.designTokenCssProps = [
          'color',
          'fontSize',
          'fontWeight',
          'fontFamily',
          'textAlign',
          'letterSpacing',
          'lineHeight',
          'background',
          'boxShadow',
          'paddingTop',
          'paddingBottom',
          'paddingLeft',
          'paddingRight',
          'borderTopWidth',
          'borderRightWidth',
          'borderLeftWidth',
          'borderBottomWidth',
          'borderTopColor',
          'borderBottomColor',
          'borderRightColor',
          'borderLeftColor'
        ].map(t => 'dt-' + t)
    }

    isLogicWidget (widget) {
        return widget && (widget.type === 'LogicOr' || widget.type === "Rest")
    }

    inlineModelDesignTokens (model) {
        /**
         * This is quite costly. Can we do this smarter? Maybe we could do it in the
         * RenderFactory (beawre of hover etc). Then we would have to just add here
         * for all the reference design token the modified?
         */
        if (model.designtokens) {
            for (let widgetID in model.widgets) {
                let widget = model.widgets[widgetID]
                this.inlineBoxDesignToken(widget, model)
            }
            for (let screenId in model.screens) {
                let scrn = model.screens[screenId]
                this.inlineBoxDesignToken(scrn, model)
            }
            /**
             * FIXME Add tempaltes
             */
        }
        return model
    }

    inlineBoxDesignToken (box, model) {
        /**
         * If the box is templates, we copy all the designtokens from the template
         */
        if (box && box.template && model.templates && model.templates[box.template]) {
            let template = model.templates[box.template]
            if (template.designtokens) {
                /**
                 * We could mix this in....
                 */
                box.designtokens = template.designtokens
            }
        }
        if (box && box.designtokens) {
            let designtokens = box.designtokens
            for (let state in designtokens) {
                if (!box[state]) {
                    box[state] = {}
                }
                let stateTokens = designtokens[state]
                for (let cssProp in stateTokens) {
                    let designTokenId = stateTokens[cssProp]
                    let designToken = model.designtokens[designTokenId]
                    if (designToken) {
                        if (designToken.isComplex) {
                            box[state][cssProp] = designToken.value[cssProp]
                        } else {
                            box[state][cssProp] = designToken.value
                        }
                    } else {
                        console.warn('ModelUtil.inlineBoxDesignToken() > NO token with id or no value:' + designTokenId, designToken)
                    }
                }
            }
        }
        return box
    }


    inlineTemplateModifies(model) {
      /**
       * We set the template modfied date, so in RenderFlow we can recognize that we have to update the widget.
       */
      if (model.templates) {
          for (let widgetID in model.widgets) {
              let widget = model.widgets[widgetID]
              if (widget.template) {
                let t = model.templates[widget.template];
                if (t) {
                    widget._templateModified = t.modified
                }
              }
          }
        }
        return model
    }

    inlineTemplateStyles(model) {
      for (let widgetID in model.widgets) {
          let widget = model.widgets[widgetID]
          if (widget.template) {

              let hover = this.getTemplatedStyle(widget, model, 'hover')
              if (hover) {
                  widget.hover = hover
              }
              let error = this.getTemplatedStyle(widget, model, 'error')
              if (error) {
                  widget.error = error
              }
              let focus = this.getTemplatedStyle(widget, model, 'focus')
              if (focus) {
                  widget.focus = focus
              }
              let active = this.getTemplatedStyle(widget, model, 'active')
              if (active) {
                  widget.active = active
              }
          }

      }
      return model
  }

  getTemplatedStyle(widget, model, prop) {
      if (widget.template) {
          if (model.templates) {
              var t = model.templates[widget.template];
              if (t && t[prop]) {
                  /**
                   * Merge in overwriten styles
                   */
                  var merged = lang.clone(t[prop])
                  if (widget[prop]) {
                      let props = widget[prop]
                      for (var key in props) {
                          merged[key] = props[key]
                      }
                  }
                  return merged;
              }
          }
      }
      return widget[prop];
  }

  createScalledModel(model, zoom) {

    var zoomedModel = lang.clone(model);
    zoomedModel.isZoomed = true;

    this.getZoomedBox(zoomedModel.screenSize, zoom, zoom);

    for (let id in zoomedModel.widgets) {
      this.getZoomedBox(zoomedModel.widgets[id], zoom, zoom);
    }

    for (let id in zoomedModel.screens) {
        var zoomedScreen = this.getZoomedBox(
            zoomedModel.screens[id],
            zoom,
            zoom
        );

        /**
         * This has a tiny tiny bug that makes copy of the same screen jump as x and y and rounded()
         * To fix this, we should take the relative and x and y in the parent and round that...
         *
         * scalledWidget.x = scalledScreen.x + (orgWidget.x - orgScreen.x)*zoomX
         *
         * As an alternative we could stop using Math.round() ...
         */
        for (let i = 0; i < zoomedScreen.children.length; i++) {
            let wid = zoomedScreen.children[i];
            let zoomWidget = zoomedModel.widgets[wid];
            let orgWidget = model.widgets[wid];
            if (orgWidget) {
                /**
                 * When we copy a screen we might not have the org widget yet
                 */
                var orgScreen = model.screens[zoomedScreen.id];
                var difX = this.getZoomed(orgWidget.x - orgScreen.x, zoom);
                var difY = this.getZoomed(orgWidget.y - orgScreen.y, zoom);
                if (orgWidget.parentWidget) {
                    if (zoomWidget.x >= 0) {
                        zoomWidget.x = zoomedScreen.x + difX;
                    }
                    if (zoomWidget.y >= 0) {
                        zoomWidget.y = zoomedScreen.y + difY;
                    }
                } else {
                    zoomWidget.x = zoomedScreen.x + difX;
                    zoomWidget.y = zoomedScreen.y + difY;
                }
            }
        }
    }

    for (let id in zoomedModel.lines) {
        let line = zoomedModel.lines[id];
        for (let i = 0; i < line.points.length; i++) {
          this.getZoomedBox(line.points[i], zoom, zoom);
        }
    }


    return zoomedModel;
  }

  getZoomedBox (box, zoomX, zoomY) {
    return CoreUtil.getZoomedBox(box, zoomX, zoomY, false);
  }

  getZoomed (v, zoom) {
    return CoreUtil.getZoomed(v, zoom, false);
  }

  updateInheritedRefs (model) {
    for (let screenId in model.screens) {
        let screen = model.screens[screenId]
        /**  
         * We need to update master refs only for screens
         * that have a master
         */
        if (screen.parents && screen.parents.length > 0) {
        this.updateErrorLabelsInScreen(screen, model)
        }
         
      }
      return model
  }

  updateErrorLabelsInScreen (screen, model) {
    screen.children.forEach(id => {
        let widget = model.widgets[id]
        /**
         * Inherited input widgets might have errorLabels attached. These will
         * point to the ids in the master screen and need to be updated.
         */
        if (widget.inherited) {
          if(widget.props && widget.props.refs){
            let errorLabels = widget.props.refs.errorLabels
            if (errorLabels) {
                /**
                 * Update all error labels by adding the current screen id
                 */
                let inheritedErrorLabels = errorLabels.map(l => l + '@' + screen.id)
                widget.props.refs.errorLabels = inheritedErrorLabels
            }
          }
        }
      })
  }
}

export default new ModelUtil()