(async () => {
  const RUN_ID = 'money-manager-growth-20260713';
  const PAGE_ID = '2:149';
  const ORIGINAL_COMPONENT_ID = '8:65';
  const page = await figma.getNodeByIdAsync(PAGE_ID);
  if (!page || page.type !== 'PAGE') throw new Error('Components page not found');
  await figma.setCurrentPageAsync(page);

  await Promise.all([
    figma.loadFontAsync({ family: 'Manrope', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'Bold' })
  ]);

  const [collections, variables] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync()
  ]);
  const light = collections.find(collection => collection.name === 'MM2 Color Light');
  if (!light) throw new Error('MM2 Color Light collection not found');
  const colors = Object.fromEntries(
    variables.filter(variable => variable.variableCollectionId === light.id)
      .map(variable => [variable.name, variable])
  );
  const fallbackHex = {
    'bg/surface': '#FFFFFF',
    'bg/brand': '#0CB764',
    'bg/brand-soft': '#D8FCE8',
    'text/brand': '#078B4B',
    'text/secondary': '#625D55',
    'border/default': '#EAE6DD'
  };
  const rgb = hex => ({
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255
  });
  const paint = (name, opacity = 1) => {
    if (!colors[name] || !fallbackHex[name]) throw new Error(`Missing navigation color: ${name}`);
    return figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: rgb(fallbackHex[name]), opacity },
      'color',
      colors[name]
    );
  };

  function iconSvg(path) {
    const node = figma.createNodeFromSvg(
      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${path}" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    );
    node.name = 'Icon';
    node.resize(20, 20);
    return node;
  }

  function tintIcon(node, colorName) {
    const vectorNodes = node.findAll(candidate => 'strokes' in candidate);
    for (const vector of vectorNodes) {
      if (vector.strokes !== figma.mixed && vector.strokes.length > 0) {
        vector.strokes = [paint(colorName)];
      }
    }
  }

  const tabs = [
    {
      key: 'Home',
      label: 'Home',
      x: 7,
      path: 'M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.5Z'
    },
    {
      key: 'Activity',
      label: 'Activity',
      x: 76,
      path: 'M6 3h12v18H6z M9 7h6 M9 11h6 M9 15h4'
    },
    {
      key: 'Invest',
      label: 'Invest',
      x: 224,
      path: 'M4 19V9 M10 19V5 M16 19v-7 M22 19V3 M3 19h20'
    },
    {
      key: 'Profile',
      label: 'Profile',
      x: 293,
      path: 'M20 21a8 8 0 0 0-16 0 M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z'
    }
  ];

  function makeLabel(copy, active) {
    const label = figma.createText();
    label.name = 'Label';
    label.fontName = { family: 'Manrope', style: active ? 'Bold' : 'Medium' };
    label.fontSize = 12;
    label.lineHeight = { value: 16, unit: 'PIXELS' };
    label.characters = copy;
    label.fills = [paint(active ? 'text/brand' : 'text/secondary')];
    return label;
  }

  function buildVariant(component, activeTab) {
    for (const child of [...component.children]) child.remove();
    component.name = `Active=${activeTab}`;
    component.resize(390, 94);
    component.layoutMode = 'NONE';
    component.fills = [];
    component.strokes = [];
    component.effects = [];
    component.clipsContent = false;

    const glass = figma.createFrame();
    glass.name = 'Liquid Glass Surface';
    glass.resize(358, 76);
    glass.x = 16;
    glass.y = 6;
    glass.layoutMode = 'NONE';
    glass.cornerRadius = 26;
    glass.fills = [paint('bg/surface', 0.70)];
    glass.strokes = [paint('border/default', 0.74)];
    glass.strokeWeight = 1;
    glass.strokeAlign = 'INSIDE';
    glass.effects = [
      {
        type: 'BACKGROUND_BLUR',
        visible: true,
        radius: 18
      },
      {
        type: 'INNER_SHADOW',
        visible: true,
        blendMode: 'NORMAL',
        color: { r: 1, g: 1, b: 1, a: 0.36 },
        offset: { x: 0, y: 1 },
        radius: 1,
        spread: 0
      },
      {
        type: 'DROP_SHADOW',
        visible: true,
        blendMode: 'NORMAL',
        color: { r: 0.043, g: 0.043, b: 0.039, a: 0.15 },
        offset: { x: 0, y: 8 },
        radius: 20,
        spread: -5,
        showShadowBehindNode: true
      }
    ];
    component.appendChild(glass);

    for (const tab of tabs) {
      const active = tab.key === activeTab;
      const item = figma.createFrame();
      item.name = `Tab · ${tab.key}`;
      item.resize(54, 58);
      item.x = tab.x;
      item.y = 9;
      item.layoutMode = 'VERTICAL';
      item.primaryAxisSizingMode = 'FIXED';
      item.counterAxisSizingMode = 'FIXED';
      item.primaryAxisAlignItems = 'CENTER';
      item.counterAxisAlignItems = 'CENTER';
      item.itemSpacing = 3;
      item.fills = [];

      const iconBox = figma.createFrame();
      iconBox.name = 'Icon Container';
      iconBox.resize(34, 34);
      iconBox.layoutMode = 'HORIZONTAL';
      iconBox.primaryAxisSizingMode = 'FIXED';
      iconBox.counterAxisSizingMode = 'FIXED';
      iconBox.primaryAxisAlignItems = 'CENTER';
      iconBox.counterAxisAlignItems = 'CENTER';
      iconBox.cornerRadius = 12;
      iconBox.fills = active ? [paint('bg/brand-soft', 0.92)] : [];
      const icon = iconSvg(tab.path);
      tintIcon(icon, active ? 'text/brand' : 'text/secondary');
      iconBox.appendChild(icon);
      item.appendChild(iconBox);
      item.appendChild(makeLabel(tab.label, active));
      glass.appendChild(item);
    }

    const add = figma.createFrame();
    add.name = 'Add Transaction';
    add.resize(54, 54);
    add.x = 152;
    add.y = 11;
    add.cornerRadius = 18;
    add.fills = [paint('bg/brand')];
    add.effects = [{
      type: 'DROP_SHADOW',
      visible: true,
      blendMode: 'NORMAL',
      color: { r: 0.047, g: 0.718, b: 0.392, a: 0.24 },
      offset: { x: 0, y: 6 },
      radius: 12,
      spread: -4,
      showShadowBehindNode: true
    }];
    const horizontal = figma.createRectangle();
    horizontal.name = 'Plus horizontal';
    horizontal.resize(22, 3);
    horizontal.x = 16;
    horizontal.y = 25.5;
    horizontal.cornerRadius = 1.5;
    horizontal.fills = [{ type: 'SOLID', color: rgb('#0B0B0A') }];
    const vertical = figma.createRectangle();
    vertical.name = 'Plus vertical';
    vertical.resize(3, 22);
    vertical.x = 25.5;
    vertical.y = 16;
    vertical.cornerRadius = 1.5;
    vertical.fills = [{ type: 'SOLID', color: rgb('#0B0B0A') }];
    add.appendChild(horizontal);
    add.appendChild(vertical);
    glass.appendChild(add);

    component.description = `Liquid-glass bottom navigation with ${activeTab} selected and a persistent center action.`;
    component.setSharedPluginData('dsb', 'run_id', RUN_ID);
    component.setSharedPluginData('dsb', 'key', `component/bottom-navigation/${activeTab.toLowerCase()}`);
  }

  let set = page.findAllWithCriteria({ types: ['COMPONENT_SET'] })
    .find(node => node.getSharedPluginData('dsb', 'key') === 'componentset/bottom-navigation');
  let components;
  if (set) {
    components = Object.fromEntries(set.children.map(component => [component.name.replace('Active=', ''), component]));
  } else {
    const original = await figma.getNodeByIdAsync(ORIGINAL_COMPONENT_ID);
    if (!original || original.type !== 'COMPONENT') throw new Error('Original Bottom Navigation component not found');
    const origin = { x: original.x, y: original.y };
    buildVariant(original, 'Home');
    const activity = figma.createComponent();
    const invest = figma.createComponent();
    const profile = figma.createComponent();
    page.appendChild(activity);
    page.appendChild(invest);
    page.appendChild(profile);
    buildVariant(activity, 'Activity');
    buildVariant(invest, 'Invest');
    buildVariant(profile, 'Profile');
    set = figma.combineAsVariants([original, activity, invest, profile], page);
    set.x = origin.x;
    set.y = origin.y;
    components = { Home: original, Activity: activity, Invest: invest, Profile: profile };
  }

  for (const active of ['Home', 'Activity', 'Invest', 'Profile']) {
    if (!components[active]) throw new Error(`Missing Bottom Navigation variant: ${active}`);
    buildVariant(components[active], active);
  }
  set.name = 'Bottom Navigation';
  set.description = 'Liquid-glass bottom navigation variants for Home, Activity, Invest, and Profile.';
  set.setSharedPluginData('dsb', 'run_id', RUN_ID);
  set.setSharedPluginData('dsb', 'phase', 'phase3');
  set.setSharedPluginData('dsb', 'key', 'componentset/bottom-navigation');

  return {
    componentSetId: set.id,
    componentIds: Object.fromEntries(Object.entries(components).map(([key, value]) => [key, value.id])),
    mutatedNodeIds: [set.id, ...Object.values(components).map(component => component.id)]
  };
})();
