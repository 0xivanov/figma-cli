(async () => {
  const RUN_ID = 'money-manager-native-tab-bar-20260714';
  const PRODUCT_PAGE_ID = '2:150';
  const COMPONENT_SET_ID = '31:1794';

  const linkedInstanceIds = [
    '31:1971',
    '32:2138',
    '34:3915',
    '34:4538',
    '34:4694',
    '34:4791'
  ];

  const legacyBars = [
    { id: '8:183', appearance: 'Light', active: 'Home' },
    { id: '8:245', appearance: 'Light', active: 'Invest' },
    { id: '8:302', appearance: 'Light', active: 'Activity' },
    { id: '8:450', appearance: 'Light', active: 'Profile' },
    { id: '8:556', appearance: 'Dark', active: 'Home' },
    { id: '8:618', appearance: 'Dark', active: 'Invest' },
    { id: '8:675', appearance: 'Dark', active: 'Activity' },
    { id: '8:743', appearance: 'Dark', active: 'Profile' }
  ];

  const page = await figma.getNodeByIdAsync(PRODUCT_PAGE_ID);
  const set = await figma.getNodeByIdAsync(COMPONENT_SET_ID);
  if (!page || page.type !== 'PAGE') throw new Error('Product Screens page not found');
  if (!set || set.type !== 'COMPONENT_SET') throw new Error('Tab Bar component set not found');
  await figma.setCurrentPageAsync(page);

  const variants = {};
  for (const child of set.children) {
    if (child.type !== 'COMPONENT') continue;
    const appearance = child.variantProperties?.Appearance;
    const active = child.variantProperties?.Active;
    if (appearance && active) variants[`${appearance}/${active}`] = child;
  }

  for (const appearance of ['Light', 'Dark']) {
    for (const active of ['Home', 'Activity', 'Invest', 'Profile']) {
      if (!variants[`${appearance}/${active}`]) {
        throw new Error(`Missing ${appearance}/${active} Tab Bar variant`);
      }
    }
  }

  function configureScreenInstance(instance, appearance, active) {
    instance.setProperties({ Appearance: appearance, Active: active });
    instance.name = `Tab Bar / ${appearance} / ${active}`;
    instance.resize(390, 94);
    if (instance.parent?.type === 'FRAME' && instance.parent.layoutMode !== 'NONE') {
      instance.layoutPositioning = 'ABSOLUTE';
    }
    instance.x = 0;
    instance.y = 750;
    instance.constraints = { horizontal: 'STRETCH', vertical: 'MAX' };
  }

  const linkedInstances = (await Promise.all(linkedInstanceIds.map(id => figma.getNodeByIdAsync(id))))
    .filter(node => node && node.type === 'INSTANCE');
  if (linkedInstances.length !== linkedInstanceIds.length) {
    throw new Error(`Expected ${linkedInstanceIds.length} linked instances, found ${linkedInstances.length}`);
  }

  const mutatedNodeIds = [];
  for (const instance of linkedInstances) {
    const appearance = instance.parent?.name.includes('Dark') ? 'Dark' : 'Light';
    const active = instance.componentProperties?.Active?.value;
    if (!active || !variants[`${appearance}/${active}`]) {
      throw new Error(`Cannot resolve target variant for linked instance ${instance.id}`);
    }
    configureScreenInstance(instance, appearance, active);
    instance.setSharedPluginData('dsb', 'run_id', RUN_ID);
    instance.setSharedPluginData('dsb', 'key', `screen-tab-bar/${instance.parent.id}`);
    mutatedNodeIds.push(instance.id);
  }

  const createdNodeIds = [];
  const removedNodeIds = [];
  for (const target of legacyBars) {
    const legacy = await figma.getNodeByIdAsync(target.id);
    if (!legacy) {
      const existing = page.findAllWithCriteria({ types: ['INSTANCE'] }).find(instance =>
        instance.getSharedPluginData('dsb', 'key') === `legacy-tab-replacement/${target.id}`
      );
      if (existing) {
        configureScreenInstance(existing, target.appearance, target.active);
        mutatedNodeIds.push(existing.id);
        continue;
      }
      throw new Error(`Legacy tab bar ${target.id} not found`);
    }
    const parent = legacy.parent;
    if (!parent || parent.type !== 'FRAME') throw new Error(`Legacy tab bar ${target.id} has no screen parent`);

    const replacement = variants[`${target.appearance}/${target.active}`].createInstance();
    parent.appendChild(replacement);
    configureScreenInstance(replacement, target.appearance, target.active);
    replacement.setSharedPluginData('dsb', 'run_id', RUN_ID);
    replacement.setSharedPluginData('dsb', 'key', `legacy-tab-replacement/${target.id}`);
    createdNodeIds.push(replacement.id);

    legacy.remove();
    removedNodeIds.push(target.id);
  }

  const allTabInstances = page.findAllWithCriteria({ types: ['INSTANCE'] }).filter(instance =>
    instance.mainComponent?.parent?.id === set.id
  );
  const remainingLegacyNodes = page.findAll(node =>
    node.name === 'Add Transaction / Tinted Glass' ||
    node.name === 'Bottom Navigation / Liquid Glass'
  );

  figma.viewport.scrollAndZoomIntoView(allTabInstances);

  return {
    createdNodeIds,
    mutatedNodeIds,
    removedNodeIds,
    linkedInstanceCount: allTabInstances.length,
    remainingLegacyNodeCount: remainingLegacyNodes.length,
    screenInstances: allTabInstances.map(instance => ({
      id: instance.id,
      name: instance.name,
      parent: instance.parent?.name,
      variant: instance.mainComponent?.name
    }))
  };
})();
