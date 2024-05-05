function getScriptInterface(parentClass, map) {
  return class extends parentClass {
    constructor() {
      super();
      map.set(this, parentClass._GetInitInst().GetSdkInstance());
      this.sdkInst = map.get(this);
    }

    onDraw(fn, once = false) {
      map.get(this).OnDraw(fn, once);
    }

    onTick(fn, once = false) {
      map.get(this).OnTick(fn, once);
    }

    onResize(fn, once = false) {
      map.get(this).OnResize(fn, once);
    }
  };
}
