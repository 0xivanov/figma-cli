(async () => {
  const RUN_ID = 'money-manager-growth-20260713';
  const PAGE_ID = '2:149';
  const page = await figma.getNodeByIdAsync(PAGE_ID);
  if (!page || page.type !== 'PAGE') throw new Error('Components page not found');
  await figma.setCurrentPageAsync(page);

  const existing = page.findAllWithCriteria({
    sharedPluginData: { namespace: 'dsb', keys: ['key'] }
  }).find(node => node.getSharedPluginData('dsb', 'key') === 'componentset/investment-activity-row');
  if (existing) return { componentSetId: existing.id, reused: true };

  await Promise.all([
    figma.loadFontAsync({ family: 'Manrope', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'SemiBold' }),
    figma.loadFontAsync({ family: 'Roboto Mono', style: 'SemiBold' })
  ]);

  const [collections, variables, textStyles] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync(),
    figma.getLocalTextStylesAsync()
  ]);
  const getCollection = name => collections.find(item => item.name === name);
  const light = getCollection('MM2 Color Light');
  const spacing = getCollection('MM2 Spacing');
  const radius = getCollection('MM2 Radius & Size');
  if (!light || !spacing || !radius) throw new Error('Money Manager variables not found');
  const variableMap = collection => Object.fromEntries(
    variables.filter(variable => variable.variableCollectionId === collection.id)
      .map(variable => [variable.name, variable])
  );
  const colors = variableMap(light);
  const spaces = variableMap(spacing);
  const radii = variableMap(radius);
  const styles = Object.fromEntries(textStyles.map(style => [style.name, style]));

  function paint(name) {
    if (!colors[name]) throw new Error(`Missing color variable: ${name}`);
    return figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 } },
      'color',
      colors[name]
    );
  }

  function text(name, styleName, characters, colorName) {
    const node = figma.createText();
    node.name = name;
    node.textStyleId = styles[styleName].id;
    node.characters = characters;
    node.fills = [paint(colorName)];
    return node;
  }

  function stack(name, direction, gap = 0) {
    const frame = figma.createFrame();
    frame.name = name;
    frame.layoutMode = direction;
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'AUTO';
    frame.itemSpacing = gap;
    frame.fills = [];
    return frame;
  }

  const types = [
    { name: 'Buy', label: 'BUY', accent: 'data/stocks', badge: 'bg/info-soft' },
    { name: 'Sell', label: 'SELL', accent: 'text/brand', badge: 'bg/brand-soft' },
    { name: 'Dividend', label: 'DIVIDEND', accent: 'text/positive', badge: 'bg/brand-soft' }
  ];
  const variants = [];
  const createdNodeIds = [];

  for (const type of types) {
    const row = figma.createComponent();
    row.name = `Type=${type.name}`;
    row.resize(358, 78);
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'FIXED';
    row.counterAxisSizingMode = 'FIXED';
    row.counterAxisAlignItems = 'CENTER';
    row.itemSpacing = 12;
    row.setBoundVariable('paddingTop', spaces['space/md']);
    row.setBoundVariable('paddingRight', spaces['space/lg']);
    row.setBoundVariable('paddingBottom', spaces['space/md']);
    row.setBoundVariable('paddingLeft', spaces['space/md']);
    row.setBoundVariable('topLeftRadius', radii['radius/xl']);
    row.setBoundVariable('topRightRadius', radii['radius/xl']);
    row.setBoundVariable('bottomLeftRadius', radii['radius/xl']);
    row.setBoundVariable('bottomRightRadius', radii['radius/xl']);
    row.fills = [paint('bg/surface')];
    row.strokes = [paint('border/default')];
    row.strokeWeight = 1;

    const badge = figma.createFrame();
    badge.name = 'asset-badge';
    badge.resize(46, 46);
    badge.layoutMode = 'HORIZONTAL';
    badge.primaryAxisSizingMode = 'FIXED';
    badge.counterAxisSizingMode = 'FIXED';
    badge.primaryAxisAlignItems = 'CENTER';
    badge.counterAxisAlignItems = 'CENTER';
    badge.cornerRadius = 15;
    badge.fills = [paint(type.badge)];
    const symbol = text('symbol', 'Title/Medium', 'A', type.accent);
    badge.appendChild(symbol);
    row.appendChild(badge);

    const copy = stack('copy', 'VERTICAL', 2);
    row.appendChild(copy);
    copy.layoutSizingHorizontal = 'FILL';
    const name = text('asset-name', 'Title/Medium', 'Asset', 'text/primary');
    const detail = text('detail', 'Caption', '0 units · Today', 'text/secondary');
    copy.appendChild(name);
    copy.appendChild(detail);

    const value = stack('value', 'VERTICAL', 2);
    value.counterAxisAlignItems = 'MAX';
    row.appendChild(value);
    const amount = text('amount', 'Data/Medium', '€0.00', 'text/primary');
    const action = text('action', 'Label/Medium', type.label, type.accent);
    value.appendChild(amount);
    value.appendChild(action);

    row.setSharedPluginData('dsb', 'run_id', RUN_ID);
    row.setSharedPluginData('dsb', 'phase', 'phase3');
    row.setSharedPluginData('dsb', 'key', `component/investment-activity/${type.name}`);
    variants.push(row);
    createdNodeIds.push(row.id, badge.id, symbol.id, copy.id, name.id, detail.id, value.id, amount.id, action.id);
  }

  const set = figma.combineAsVariants(variants, page);
  set.name = 'Investment Activity Row';
  set.description = 'Manual investment ledger activity row for buys, sells, and dividends. Does not initiate broker actions.';
  set.fills = [paint('bg/subtle')];
  set.setBoundVariable('topLeftRadius', radii['radius/lg']);
  set.setBoundVariable('topRightRadius', radii['radius/lg']);
  set.setBoundVariable('bottomLeftRadius', radii['radius/lg']);
  set.setBoundVariable('bottomRightRadius', radii['radius/lg']);
  const gap = 24;
  const padding = 28;
  set.children.forEach((child, index) => {
    child.x = padding + index * (358 + gap);
    child.y = padding;
  });
  set.resizeWithoutConstraints(padding * 2 + 3 * 358 + 2 * gap, padding * 2 + 78);

  const symbolKey = set.addComponentProperty('Symbol', 'TEXT', 'A');
  const nameKey = set.addComponentProperty('Asset name', 'TEXT', 'Asset');
  const detailKey = set.addComponentProperty('Detail', 'TEXT', '0 units · Today');
  const amountKey = set.addComponentProperty('Amount', 'TEXT', '€0.00');
  for (const child of set.children) {
    child.findOne(node => node.name === 'symbol').componentPropertyReferences = { characters: symbolKey };
    child.findOne(node => node.name === 'asset-name').componentPropertyReferences = { characters: nameKey };
    child.findOne(node => node.name === 'detail').componentPropertyReferences = { characters: detailKey };
    child.findOne(node => node.name === 'amount').componentPropertyReferences = { characters: amountKey };
  }

  const currentRight = Math.max(...page.children.filter(node => node.id !== set.id).map(node => node.x + node.width));
  set.x = currentRight + 420;
  set.y = 40;
  set.setSharedPluginData('dsb', 'run_id', RUN_ID);
  set.setSharedPluginData('dsb', 'phase', 'phase3');
  set.setSharedPluginData('dsb', 'key', 'componentset/investment-activity-row');

  const docs = stack('Investment Activity Row / Documentation', 'VERTICAL', 12);
  docs.resize(320, 100);
  docs.counterAxisSizingMode = 'FIXED';
  docs.paddingTop = 24;
  docs.paddingRight = 24;
  docs.paddingBottom = 24;
  docs.paddingLeft = 24;
  docs.cornerRadius = 20;
  docs.fills = [paint('bg/surface')];
  docs.strokes = [paint('border/default')];
  docs.strokeWeight = 1;
  docs.x = set.x - 360;
  docs.y = set.y;
  const docsTitle = text('Documentation title', 'Heading/Large', 'Investment Activity Row', 'text/primary');
  const docsBody = text('Documentation body', 'Body/Medium', 'Use for ledger activity only. Actions are recorded manually and never place broker or exchange orders.', 'text/secondary');
  docsBody.textAutoResize = 'HEIGHT';
  docsBody.resize(272, docsBody.height);
  docs.appendChild(docsTitle);
  docs.appendChild(docsBody);
  docs.setSharedPluginData('dsb', 'run_id', RUN_ID);
  docs.setSharedPluginData('dsb', 'phase', 'phase3');
  docs.setSharedPluginData('dsb', 'key', 'doc/investment-activity-row');

  createdNodeIds.push(set.id, docs.id, docsTitle.id, docsBody.id);
  return {
    createdNodeIds,
    componentSetId: set.id,
    documentationId: docs.id,
    variants: set.children.map(child => child.name)
  };
})();
