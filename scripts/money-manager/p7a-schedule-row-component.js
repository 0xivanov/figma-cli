(async () => {
  const RUN_ID = 'money-manager-growth-20260713';
  const PAGE_ID = '2:149';
  const page = await figma.getNodeByIdAsync(PAGE_ID);
  if (!page || page.type !== 'PAGE') throw new Error('Components page not found');
  await figma.setCurrentPageAsync(page);

  const existing = page.findAllWithCriteria({
    sharedPluginData: { namespace: 'dsb', keys: ['key'] }
  }).find(node => node.getSharedPluginData('dsb', 'key') === 'componentset/schedule-row');
  if (existing) return { componentSetId: existing.id, reused: true };

  await Promise.all([
    figma.loadFontAsync({ family: 'Manrope', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'SemiBold' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'Bold' }),
    figma.loadFontAsync({ family: 'Roboto Mono', style: 'SemiBold' })
  ]);

  const [collections, variables, textStyles] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync(),
    figma.getLocalTextStylesAsync()
  ]);
  const light = collections.find(collection => collection.name === 'MM2 Color Light');
  const spacing = collections.find(collection => collection.name === 'MM2 Spacing');
  const radius = collections.find(collection => collection.name === 'MM2 Radius & Size');
  if (!light || !spacing || !radius) throw new Error('Money Manager variables not found');

  const byCollection = collection => Object.fromEntries(
    variables.filter(variable => variable.variableCollectionId === collection.id)
      .map(variable => [variable.name, variable])
  );
  const colors = byCollection(light);
  const spaces = byCollection(spacing);
  const radii = byCollection(radius);
  const styles = Object.fromEntries(textStyles.map(style => [style.name, style]));

  const requiredColors = [
    'bg/surface', 'bg/subtle', 'bg/warning-soft', 'bg/brand-soft',
    'text/primary', 'text/secondary', 'text/brand', 'text/positive',
    'text/negative', 'border/default'
  ];
  for (const name of requiredColors) {
    if (!colors[name]) throw new Error(`Missing color variable: ${name}`);
  }

  function paint(name) {
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

  function autoFrame(name, direction, gap = 0) {
    const frame = figma.createFrame();
    frame.name = name;
    frame.layoutMode = direction;
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'AUTO';
    frame.itemSpacing = gap;
    frame.fills = [];
    return frame;
  }

  const states = ['Active', 'Paused', 'Due'];
  const directions = ['Income', 'Expense'];
  const variants = [];
  const createdNodeIds = [];

  for (const direction of directions) {
    for (const state of states) {
      const component = figma.createComponent();
      component.name = `Direction=${direction}, State=${state}`;
      component.resize(358, 88);
      component.layoutMode = 'HORIZONTAL';
      component.primaryAxisSizingMode = 'FIXED';
      component.counterAxisSizingMode = 'FIXED';
      component.counterAxisAlignItems = 'CENTER';
      component.itemSpacing = 12;
      component.setBoundVariable('paddingTop', spaces['space/md']);
      component.setBoundVariable('paddingRight', spaces['space/lg']);
      component.setBoundVariable('paddingBottom', spaces['space/md']);
      component.setBoundVariable('paddingLeft', spaces['space/md']);
      component.setBoundVariable('topLeftRadius', radii['radius/xl']);
      component.setBoundVariable('topRightRadius', radii['radius/xl']);
      component.setBoundVariable('bottomLeftRadius', radii['radius/xl']);
      component.setBoundVariable('bottomRightRadius', radii['radius/xl']);
      const background = state === 'Paused'
        ? 'bg/subtle'
        : state === 'Due' ? 'bg/warning-soft' : 'bg/surface';
      component.fills = [paint(background)];
      component.strokes = [paint('border/default')];
      component.strokeWeight = 1;

      const badge = figma.createFrame();
      badge.name = 'badge';
      badge.resize(48, 48);
      badge.layoutMode = 'HORIZONTAL';
      badge.primaryAxisSizingMode = 'FIXED';
      badge.counterAxisSizingMode = 'FIXED';
      badge.primaryAxisAlignItems = 'CENTER';
      badge.counterAxisAlignItems = 'CENTER';
      badge.cornerRadius = 16;
      badge.fills = [paint(state === 'Due' ? 'bg/warning-soft' : 'bg/brand-soft')];
      const badgeLabel = text('badge-label', 'Title/Medium', direction === 'Income' ? 'I' : 'E', direction === 'Income' ? 'text/positive' : 'text/negative');
      badge.appendChild(badgeLabel);
      component.appendChild(badge);

      const copy = autoFrame('copy', 'VERTICAL', 3);
      component.appendChild(copy);
      copy.layoutSizingHorizontal = 'FILL';
      const title = text('title', 'Title/Medium', direction === 'Income' ? 'Salary' : 'Rent', 'text/primary');
      const detail = text('detail', 'Caption', direction === 'Income' ? 'Monthly · 25th' : 'Monthly · 1st', 'text/secondary');
      copy.appendChild(title);
      copy.appendChild(detail);

      const value = autoFrame('value', 'VERTICAL', 3);
      value.counterAxisAlignItems = 'MAX';
      component.appendChild(value);
      const amount = text('amount', 'Data/Medium', direction === 'Income' ? '+€3,200' : '−€850', direction === 'Income' ? 'text/positive' : 'text/negative');
      const statusCopy = state === 'Due' ? 'DUE TODAY' : state.toUpperCase();
      const status = text('status', 'Label/Medium', statusCopy, state === 'Paused' ? 'text/secondary' : 'text/brand');
      value.appendChild(amount);
      value.appendChild(status);

      component.setSharedPluginData('dsb', 'run_id', RUN_ID);
      component.setSharedPluginData('dsb', 'phase', 'phase3');
      component.setSharedPluginData('dsb', 'key', `component/schedule-row/${direction}/${state}`);
      variants.push(component);
      createdNodeIds.push(component.id, badge.id, badgeLabel.id, copy.id, title.id, detail.id, value.id, amount.id, status.id);
    }
  }

  const set = figma.combineAsVariants(variants, page);
  set.name = 'Schedule Row';
  set.description = 'Recurring income and expense row. Direction controls amount color; State communicates active, paused, or due status.';
  set.fills = [paint('bg/subtle')];
  set.setBoundVariable('topLeftRadius', radii['radius/lg']);
  set.setBoundVariable('topRightRadius', radii['radius/lg']);
  set.setBoundVariable('bottomLeftRadius', radii['radius/lg']);
  set.setBoundVariable('bottomRightRadius', radii['radius/lg']);

  const gap = 24;
  const padding = 28;
  for (const child of set.children) {
    const props = child.variantProperties;
    const column = states.indexOf(props.State);
    const row = directions.indexOf(props.Direction);
    child.x = padding + column * (358 + gap);
    child.y = padding + row * (88 + gap);
  }
  set.resizeWithoutConstraints(padding * 2 + 3 * 358 + 2 * gap, padding * 2 + 2 * 88 + gap);

  const titleKey = set.addComponentProperty('Title', 'TEXT', 'Salary');
  const detailKey = set.addComponentProperty('Detail', 'TEXT', 'Monthly · 25th');
  const amountKey = set.addComponentProperty('Amount', 'TEXT', '+€3,200');
  const badgeKey = set.addComponentProperty('Badge', 'TEXT', 'I');
  for (const child of set.children) {
    child.findOne(node => node.name === 'title').componentPropertyReferences = { characters: titleKey };
    child.findOne(node => node.name === 'detail').componentPropertyReferences = { characters: detailKey };
    child.findOne(node => node.name === 'amount').componentPropertyReferences = { characters: amountKey };
    child.findOne(node => node.name === 'badge-label').componentPropertyReferences = { characters: badgeKey };
  }

  const currentRight = Math.max(...page.children.filter(node => node.id !== set.id).map(node => node.x + node.width));
  set.x = currentRight + 420;
  set.y = 40;
  set.setSharedPluginData('dsb', 'run_id', RUN_ID);
  set.setSharedPluginData('dsb', 'phase', 'phase3');
  set.setSharedPluginData('dsb', 'key', 'componentset/schedule-row');

  const docs = autoFrame('Schedule Row / Documentation', 'VERTICAL', 12);
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
  const docsTitle = text('Documentation title', 'Heading/Large', 'Schedule Row', 'text/primary');
  const docsBody = text('Documentation body', 'Body/Medium', 'Use for recurring money. Direction changes semantic amount color. State communicates whether the next occurrence is active, paused, or due.', 'text/secondary');
  docsBody.textAutoResize = 'HEIGHT';
  docsBody.resize(272, docsBody.height);
  docs.appendChild(docsTitle);
  docs.appendChild(docsBody);
  docs.setSharedPluginData('dsb', 'run_id', RUN_ID);
  docs.setSharedPluginData('dsb', 'phase', 'phase3');
  docs.setSharedPluginData('dsb', 'key', 'doc/schedule-row');

  createdNodeIds.push(set.id, docs.id, docsTitle.id, docsBody.id);
  return {
    createdNodeIds,
    componentSetId: set.id,
    documentationId: docs.id,
    variants: set.children.map(child => child.name)
  };
})();
