function getInstanceJs(parentClass, scriptInterface, addonTriggers, C3) {
  return class extends parentClass {
    constructor(inst, properties) {
      super(inst);
      this.alpha = false;
      this.antialias = false;
      this.depth = true;
      this.stencil = false;
      this.autoClear = true;
      this.backgroundColor = [0, 0, 0];
      this.backgroundOpacity = 1;
      if (properties) {
        this.alpha = properties[0];
        this.antialias = properties[1];
        this.depth = properties[2];
        this.stencil = properties[3];
        this.autoClear = properties[4];
        this.backgroundColor = properties[5];
        this.backgroundOpacity = properties[6];
      }
      this._StartTicking();

      this.tickCallbacks = [];
      this.drawCallbacks = [];
      this.resizeCallbacks = [];
      this.oglRenderer = new globalThis.OGL.Renderer({
        dpr: this._runtime._devicePixelRatio,
        alpha: this.alpha,
        antialias: this.antialias,
        depth: this.depth,
        stencil: this.stencil,
        autoClear: this.autoClear,
        powerPreference: this._runtime._canvasManager._gpuPreference,
      });
      this.camera = new globalThis.OGL.Camera(this.oglRenderer.gl);
    }

    SaveToJson() {
      return {
        // data to be saved for savegames
      };
    }

    LoadFromJson(o) {
      // load state for savegames
    }

    MaybeUpdateRenderTarget() {
      const renderer = this._runtime.GetRenderer();
      const wi = this.GetWorldInfo();
      if (!this.renderTarget) {
        this.renderTarget = renderer.CreateDynamicTexture(
          wi.GetWidth(),
          wi.GetHeight()
        );
        this.Resize(this, this.renderTarget);
      } else {
        if (
          this.renderTarget.GetWidth() !== wi.GetWidth() ||
          this.renderTarget.GetHeight() !== wi.GetHeight()
        ) {
          renderer.DeleteTexture(this.renderTarget);
          this.renderTarget = renderer.CreateDynamicTexture(
            wi.GetWidth(),
            wi.GetHeight()
          );
          this.Resize(this, this.renderTarget);
        }
      }
    }

    OnDraw(callback, once = false) {
      this.drawCallbacks.push({ handler: callback, once });
    }

    OnTick(callback, once = false) {
      this.tickCallbacks.push({ handler: callback, once });
    }

    OnResize(callback, once = false) {
      this.resizeCallbacks.push({ handler: callback, once });
    }

    Draw(renderer) {
      // initial setup
      this.MaybeUpdateRenderTarget();
      this.oglRenderer.gl.clearColor(
        this.backgroundColor[0],
        this.backgroundColor[1],
        this.backgroundColor[2],
        this.backgroundOpacity
      );
      if (!this.renderTarget) return; // dynamic texture load which hasn't completed yet; can't draw anything

      // render callbacks for OGL
      this.drawCallbacks.forEach((cb) => cb.handler(this.oglRenderer));
      this.drawCallbacks = this.drawCallbacks.filter((cb) => !cb.once);

      // render to C3
      const wi = this.GetWorldInfo();
      let quad = wi.GetBoundingQuad();
      renderer.UpdateTexture(this.oglRenderer.gl.canvas, this.renderTarget);
      renderer.SetTexture(this.renderTarget);
      if (this._runtime.IsPixelRoundingEnabled())
        quad = wi.PixelRoundQuad(quad);
      renderer.Quad(quad);
    }

    Tick() {
      this.MaybeUpdateRenderTarget();
      this.tickCallbacks.forEach((cb) => cb.handler());
      this.tickCallbacks = this.tickCallbacks.filter((cb) => !cb.once);
    }

    Resize() {
      this.oglRenderer.setSize(
        this.renderTarget.GetWidth(),
        this.renderTarget.GetHeight()
      );
      this.resizeCallbacks.forEach((cb) => cb.handler());
      this.resizeCallbacks = this.resizeCallbacks.filter((cb) => !cb.once);
    }
  };
}
