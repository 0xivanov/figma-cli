(async () => {
  const RUN_ID = 'money-manager-growth-20260713';
  const PAGE_ID = '2:150';
  const page = await figma.getNodeByIdAsync(PAGE_ID);
  if (!page || page.type !== 'PAGE') throw new Error('Product Screens page not found');
  await figma.setCurrentPageAsync(page);
  await Promise.all([
    figma.loadFontAsync({ family: 'Manrope', style: 'Bold' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'Medium' })
  ]);

  const existing = page.findAllWithCriteria({
    sharedPluginData: { namespace: 'dsb', keys: ['key'] }
  }).find(node => node.getSharedPluginData('dsb', 'key') === 'flow/growth-features');
  if (existing) {
    return {
      flowId: existing.id,
      reused: true,
      screens: existing.findAllWithCriteria({ types: ['FRAME'] })
        .filter(node => node.getSharedPluginData('dsb', 'key').startsWith('screen/growth/'))
        .map(node => ({ id: node.id, name: node.name }))
    };
  }

  const [collections, variables, styles] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync(),
    figma.getLocalTextStylesAsync()
  ]);
  const light = collections.find(collection => collection.name === 'MM2 Color Light');
  if (!light) throw new Error('MM2 Color Light variables not found');
  const colors = Object.fromEntries(
    variables.filter(variable => variable.variableCollectionId === light.id)
      .map(variable => [variable.name, variable])
  );
  const textStyles = Object.fromEntries(styles.map(style => [style.name, style]));
  const paint = name => figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0, g: 0, b: 0 } },
    'color',
    colors[name]
  );

  const flow = figma.createFrame();
  flow.name = 'MM2 · Growth Features';
  flow.layoutMode = 'VERTICAL';
  flow.primaryAxisSizingMode = 'AUTO';
  flow.counterAxisSizingMode = 'FIXED';
  flow.resize(1760, 100);
  flow.paddingTop = 40;
  flow.paddingRight = 40;
  flow.paddingBottom = 40;
  flow.paddingLeft = 40;
  flow.itemSpacing = 24;
  flow.cornerRadius = 28;
  flow.fills = [paint('bg/subtle')];
  flow.x = 0;
  flow.y = Math.max(...page.children.map(node => node.y + node.height)) + 180;
  flow.setSharedPluginData('dsb', 'run_id', RUN_ID);
  flow.setSharedPluginData('dsb', 'phase', 'phase3');
  flow.setSharedPluginData('dsb', 'key', 'flow/growth-features');

  const heading = figma.createText();
  heading.name = 'Flow title';
  heading.textStyleId = textStyles['Display/Large'].id;
  heading.characters = 'Growth features · scheduling, budgets, investing, notifications';
  heading.fills = [paint('text/primary')];
  flow.appendChild(heading);

  const grid = figma.createFrame();
  grid.name = 'Feature screen grid';
  grid.layoutMode = 'HORIZONTAL';
  grid.layoutWrap = 'WRAP';
  grid.primaryAxisSizingMode = 'FIXED';
  grid.counterAxisSizingMode = 'AUTO';
  grid.resize(1680, 100);
  grid.itemSpacing = 40;
  grid.counterAxisSpacing = 40;
  grid.fills = [];
  flow.appendChild(grid);
  grid.layoutSizingHorizontal = 'FILL';

  const names = [
    'Scheduled Activity · Light',
    'New Schedule · Light',
    'Schedule Detail · Light',
    'Budgets · Light',
    'Budget Editor · Light',
    'Invest Portfolio · Light',
    'Record Trade · Light',
    'Investment Plan · Light',
    'Notification Settings · Light',
    'Audit Export · Light'
  ];
  const screens = [];
  for (const name of names) {
    const screen = figma.createFrame();
    screen.name = name;
    screen.resize(390, 844);
    screen.layoutMode = 'VERTICAL';
    screen.primaryAxisSizingMode = 'FIXED';
    screen.counterAxisSizingMode = 'FIXED';
    screen.fills = [paint('bg/canvas')];
    screen.clipsContent = true;
    screen.setSharedPluginData('dsb', 'run_id', RUN_ID);
    screen.setSharedPluginData('dsb', 'phase', 'phase3');
    screen.setSharedPluginData('dsb', 'key', `screen/growth/${name.toLowerCase().replaceAll(' · light', '').replaceAll(' ', '-')}`);
    grid.appendChild(screen);
    screens.push({ id: screen.id, name: screen.name, key: screen.getSharedPluginData('dsb', 'key') });
  }

  return {
    createdNodeIds: [flow.id, heading.id, grid.id, ...screens.map(screen => screen.id)],
    flowId: flow.id,
    gridId: grid.id,
    screens
  };
})();
