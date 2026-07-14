(async () => {
  const RUN_ID = 'money-manager-native-tab-bar-20260714';
  const COMPONENT_PAGE_ID = '2:149';
  const COMPONENT_SET_ID = '31:1794';
  const LIGHT_VARIANT_IDS = {
    Home: '8:65',
    Activity: '31:1719',
    Invest: '31:1720',
    Profile: '31:1721'
  };

  const page = await figma.getNodeByIdAsync(COMPONENT_PAGE_ID);
  const set = await figma.getNodeByIdAsync(COMPONENT_SET_ID);
  if (!page || page.type !== 'PAGE') throw new Error('Components page not found');
  if (!set || set.type !== 'COMPONENT_SET') throw new Error('Bottom Navigation component set not found');
  await figma.setCurrentPageAsync(page);

  await Promise.all([
    // SF Pro is used by the SwiftUI app, but every locally exposed SF Pro face
    // reports as missing in this Figma file. Helvetica Neue is the closest
    // render-safe Apple UI fallback available to the design automation.
    figma.loadFontAsync({ family: 'Helvetica Neue', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Helvetica Neue', style: 'Bold' })
  ]);

  const [collections, variables] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync()
  ]);

  const themeCollections = {
    Light: collections.find(collection => collection.name === 'MM2 Color Light'),
    Dark: collections.find(collection => collection.name === 'MM2 Color Dark')
  };
  if (!themeCollections.Light || !themeCollections.Dark) {
    throw new Error('MM2 light and dark color collections are required');
  }

  const themeVariables = Object.fromEntries(
    Object.entries(themeCollections).map(([appearance, collection]) => [
      appearance,
      Object.fromEntries(
        variables
          .filter(variable => variable.variableCollectionId === collection.id)
          .map(variable => [variable.name, variable])
      )
    ])
  );

  const requiredVariables = [
    'bg/surface',
    'bg/elevated',
    'text/brand',
    'text/secondary',
    'icon/secondary',
    'data/cash',
    'border/default',
    'border/strong'
  ];
  for (const appearance of ['Light', 'Dark']) {
    for (const name of requiredVariables) {
      if (!themeVariables[appearance][name]) {
        throw new Error(`Missing ${appearance} navigation variable: ${name}`);
      }
    }
  }

  const paint = (appearance, name, opacity = 1) =>
    figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity },
      'color',
      themeVariables[appearance][name]
    );

  const tabs = [
    {
      key: 'Home',
      label: 'Home',
      svg: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 10.7 12 3.5l8.5 7.2v8.1A2.2 2.2 0 0 1 18.3 21H14v-6H10v6H5.7a2.2 2.2 0 0 1-2.2-2.2v-8.1Z" fill="#000"/></svg>'
    },
    {
      key: 'Activity',
      label: 'Activity',
      svg: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6 2.75h12a2 2 0 0 1 2 2V21l-2-1.2L16 21l-2-1.2L12 21l-2-1.2L8 21l-2-1.2L4 21V4.75a2 2 0 0 1 2-2Z" fill="#000"/></svg>'
    },
    {
      key: 'Invest',
      label: 'Invest',
      svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 19V5M4 19h16M7 15l4-4 3 2 5-6M15.5 7H19v3.5" stroke="#000" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    },
    {
      key: 'Profile',
      label: 'Profile',
      svg: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-5.6 12.5c.6-3.2 2.6-4.9 5.6-4.9s5 1.7 5.6 4.9a8.2 8.2 0 0 1-5.6 2 8.2 8.2 0 0 1-5.6-2Z" fill="#000"/></svg>'
    }
  ];

  function tintIcon(node, appearance, active) {
    const colorVariable = active ? themeVariables[appearance]['data/cash'] : themeVariables[appearance]['icon/secondary'];
    const candidates = node.findAll(candidate => 'fills' in candidate || 'strokes' in candidate);
    for (const candidate of candidates) {
      if ('fills' in candidate && candidate.fills !== figma.mixed && candidate.fills.length > 0) {
        candidate.fills = [figma.variables.setBoundVariableForPaint(
          { type: 'SOLID', color: { r: 0, g: 0, b: 0 } },
          'color',
          colorVariable
        )];
      }
      if ('strokes' in candidate && candidate.strokes !== figma.mixed && candidate.strokes.length > 0) {
        candidate.strokes = [figma.variables.setBoundVariableForPaint(
          { type: 'SOLID', color: { r: 0, g: 0, b: 0 } },
          'color',
          colorVariable
        )];
      }
    }
  }

  function createTabIcon(tab, appearance, active) {
    const icon = figma.createNodeFromSvg(tab.svg);
    icon.name = 'Icon';
    icon.resize(24, 24);
    tintIcon(icon, appearance, active);
    return icon;
  }

  function outerEffects(appearance) {
    const dark = appearance === 'Dark';
    return [
      {
        type: 'BACKGROUND_BLUR',
        visible: true,
        radius: 24
      },
      {
        type: 'INNER_SHADOW',
        visible: true,
        blendMode: 'NORMAL',
        color: { r: 1, g: 1, b: 1, a: dark ? 0.15 : 0.32 },
        offset: { x: 0, y: 1 },
        radius: 1,
        spread: 0
      },
      {
        type: 'DROP_SHADOW',
        visible: true,
        blendMode: 'NORMAL',
        color: { r: 0.043, g: 0.043, b: 0.039, a: dark ? 0.25 : 0.15 },
        offset: { x: 0, y: 8 },
        radius: 20,
        spread: -5,
        showShadowBehindNode: true
      }
    ];
  }

  function lensEffects(appearance) {
    const dark = appearance === 'Dark';
    return [
      {
        type: 'BACKGROUND_BLUR',
        visible: true,
        radius: 14
      },
      {
        type: 'INNER_SHADOW',
        visible: true,
        blendMode: 'NORMAL',
        color: { r: 1, g: 1, b: 1, a: dark ? 0.12 : 0.28 },
        offset: { x: 0, y: 1 },
        radius: 1,
        spread: 0
      }
    ];
  }

  function buildVariant(component, appearance, activeTab) {
    for (const child of [...component.children]) child.remove();

    component.name = `Appearance=${appearance}, Active=${activeTab}`;
    component.resize(390, 94);
    component.layoutMode = 'NONE';
    component.fills = [];
    component.strokes = [];
    component.effects = [];
    component.clipsContent = false;

    const glass = figma.createFrame();
    glass.name = 'Tab Bar / Liquid Glass';
    glass.resize(358, 76);
    glass.x = 16;
    glass.y = 6;
    glass.layoutMode = 'NONE';
    glass.cornerRadius = 38;
    glass.cornerSmoothing = 0.8;
    glass.clipsContent = false;
    glass.fills = [paint(appearance, 'bg/surface', appearance === 'Dark' ? 0.62 : 0.68)];
    glass.strokes = [paint(appearance, 'border/default', appearance === 'Dark' ? 0.48 : 0.62)];
    glass.strokeWeight = 1;
    glass.strokeAlign = 'INSIDE';
    glass.effects = outerEffects(appearance);
    component.appendChild(glass);

    const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
    const slotWidth = 358 / tabs.length;
    const lensWidth = 84;

    const lens = figma.createFrame();
    lens.name = 'Selection Lens';
    lens.resize(lensWidth, 68);
    lens.x = activeIndex * slotWidth + (slotWidth - lensWidth) / 2;
    lens.y = 4;
    lens.cornerRadius = 34;
    lens.cornerSmoothing = 0.8;
    lens.fills = [paint(appearance, 'bg/elevated', appearance === 'Dark' ? 0.76 : 0.84)];
    lens.strokes = [paint(appearance, 'border/strong', appearance === 'Dark' ? 0.42 : 0.48)];
    lens.strokeWeight = 0.75;
    lens.strokeAlign = 'INSIDE';
    lens.effects = lensEffects(appearance);
    glass.appendChild(lens);

    for (let index = 0; index < tabs.length; index += 1) {
      const tab = tabs[index];
      const active = tab.key === activeTab;
      const item = figma.createFrame();
      item.name = `Tab / ${tab.key}`;
      item.resize(slotWidth, 68);
      item.x = index * slotWidth;
      item.y = 4;
      item.layoutMode = 'VERTICAL';
      item.primaryAxisSizingMode = 'FIXED';
      item.counterAxisSizingMode = 'FIXED';
      item.primaryAxisAlignItems = 'CENTER';
      item.counterAxisAlignItems = 'CENTER';
      item.itemSpacing = 2;
      item.fills = [];
      item.strokes = [];
      item.clipsContent = false;

      const icon = createTabIcon(tab, appearance, active);
      item.appendChild(icon);

      const label = figma.createText();
      label.name = 'Label';
      label.fontName = { family: 'Helvetica Neue', style: active ? 'Bold' : 'Medium' };
      label.fontSize = 10.5;
      label.lineHeight = { value: 12, unit: 'PIXELS' };
      label.letterSpacing = { value: 0, unit: 'PIXELS' };
      label.characters = tab.label;
      label.textAutoResize = 'NONE';
      label.resize(slotWidth - 14, 13);
      label.textAlignHorizontal = 'CENTER';
      label.textAlignVertical = 'CENTER';
      label.layoutSizingHorizontal = 'FIXED';
      label.layoutSizingVertical = 'FIXED';
      label.fills = [paint(appearance, active ? 'text/brand' : 'text/secondary')];
      item.appendChild(label);

      glass.appendChild(item);
    }

    component.description = `Native-style iOS tab bar with ${activeTab} selected in ${appearance.toLowerCase()} appearance. Navigation only; actions belong in screen toolbars.`;
    component.setSharedPluginData('dsb', 'run_id', RUN_ID);
    component.setSharedPluginData('dsb', 'phase', 'phase3');
    component.setSharedPluginData('dsb', 'key', `component/tab-bar/${appearance.toLowerCase()}/${activeTab.toLowerCase()}`);
  }

  const variants = {};
  const createdNodeIds = [];
  for (const activeTab of tabs.map(tab => tab.key)) {
    const lightComponent = await figma.getNodeByIdAsync(LIGHT_VARIANT_IDS[activeTab]);
    if (!lightComponent || lightComponent.type !== 'COMPONENT' || lightComponent.parent?.id !== set.id) {
      throw new Error(`Light ${activeTab} component is missing from Bottom Navigation`);
    }
    variants[`Light/${activeTab}`] = lightComponent;
  }

  for (const activeTab of tabs.map(tab => tab.key)) {
    const lightComponent = variants[`Light/${activeTab}`];
    const darkKey = `component/tab-bar/dark/${activeTab.toLowerCase()}`;
    const darkName = `Appearance=Dark, Active=${activeTab}`;
    let darkComponent = set.children.find(child =>
      child.type === 'COMPONENT' &&
      (child.name === darkName || child.getSharedPluginData('dsb', 'key') === darkKey)
    );
    if (!darkComponent) {
      darkComponent = page.findAllWithCriteria({ types: ['COMPONENT'] }).find(child =>
        child.getSharedPluginData('dsb', 'key') === darkKey
      );
    }
    if (!darkComponent) {
      darkComponent = lightComponent.clone();
      darkComponent.name = darkName;
      darkComponent.setSharedPluginData('dsb', 'run_id', RUN_ID);
      darkComponent.setSharedPluginData('dsb', 'phase', 'phase3');
      darkComponent.setSharedPluginData('dsb', 'key', darkKey);
      createdNodeIds.push(darkComponent.id);
    }
    if (darkComponent.parent?.id !== set.id) set.appendChild(darkComponent);
    variants[`Dark/${activeTab}`] = darkComponent;
  }

  for (const appearance of ['Light', 'Dark']) {
    for (const activeTab of tabs.map(tab => tab.key)) {
      buildVariant(variants[`${appearance}/${activeTab}`], appearance, activeTab);
    }
  }

  const transition = {
    type: 'SMART_ANIMATE',
    easing: { type: 'GENTLE' },
    duration: 0.35
  };
  const reactionUpdates = [];
  for (const appearance of ['Light', 'Dark']) {
    for (const activeTab of tabs.map(tab => tab.key)) {
      const component = variants[`${appearance}/${activeTab}`];
      const glass = component.children.find(child => child.name === 'Tab Bar / Liquid Glass');
      if (!glass || glass.type !== 'FRAME') throw new Error(`Glass surface missing in ${component.name}`);
      for (const tab of tabs) {
        const item = glass.children.find(child => child.name === `Tab / ${tab.key}`);
        const destination = variants[`${appearance}/${tab.key}`];
        if (!item || item.type !== 'FRAME') throw new Error(`${tab.key} item missing in ${component.name}`);
        if (tab.key === activeTab) {
          reactionUpdates.push(item.setReactionsAsync([]));
          continue;
        }
        reactionUpdates.push(item.setReactionsAsync([{
          trigger: { type: 'ON_CLICK' },
          actions: [{
            type: 'NODE',
            destinationId: destination.id,
            navigation: 'CHANGE_TO',
            transition,
            resetScrollPosition: false,
            resetVideoPosition: false
          }]
        }]));
      }
    }
  }
  await Promise.all(reactionUpdates);

  set.name = 'Tab Bar';
  set.description = 'Native iOS 26-style Liquid Glass tab bar for top-level navigation. Four equal destinations, adaptive light and dark appearances, and Smart Animate selection movement. Do not place actions in this component.';
  set.documentationLinks = [{ uri: 'https://developer.apple.com/design/human-interface-guidelines/tab-bars' }];
  set.setSharedPluginData('dsb', 'run_id', RUN_ID);
  set.setSharedPluginData('dsb', 'phase', 'phase3');
  set.setSharedPluginData('dsb', 'key', 'componentset/tab-bar');
  set.layoutMode = 'NONE';
  set.fills = [];
  set.strokes = [];

  const padding = 32;
  const horizontalGap = 32;
  const verticalGap = 24;
  for (let appearanceIndex = 0; appearanceIndex < 2; appearanceIndex += 1) {
    const appearance = appearanceIndex === 0 ? 'Light' : 'Dark';
    for (let tabIndex = 0; tabIndex < tabs.length; tabIndex += 1) {
      const component = variants[`${appearance}/${tabs[tabIndex].key}`];
      component.x = padding + tabIndex * (390 + horizontalGap);
      component.y = padding + appearanceIndex * (94 + verticalGap);
    }
  }
  const maxX = Math.max(...set.children.map(child => child.x + child.width));
  const maxY = Math.max(...set.children.map(child => child.y + child.height));
  set.resizeWithoutConstraints(maxX + padding, maxY + padding);

  figma.viewport.scrollAndZoomIntoView([set]);

  return {
    componentSetId: set.id,
    componentSetName: set.name,
    variantIds: Object.fromEntries(Object.entries(variants).map(([key, value]) => [key, value.id])),
    createdNodeIds,
    mutatedNodeIds: [set.id, ...Object.values(variants).map(component => component.id)],
    interactionCount: reactionUpdates.length,
    size: { width: set.width, height: set.height }
  };
})();
