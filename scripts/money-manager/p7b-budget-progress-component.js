(async () => {
  const RUN_ID = 'money-manager-growth-20260713';
  const PAGE_ID = '2:149';
  const page = await figma.getNodeByIdAsync(PAGE_ID);
  if (!page || page.type !== 'PAGE') throw new Error('Components page not found');
  await figma.setCurrentPageAsync(page);

  const existing = page.findAllWithCriteria({
    sharedPluginData: { namespace: 'dsb', keys: ['key'] }
  }).find(node => node.getSharedPluginData('dsb', 'key') === 'componentset/budget-progress-card');
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
  const collection = name => collections.find(item => item.name === name);
  const light = collection('MM2 Color Light');
  const spacing = collection('MM2 Spacing');
  const radius = collection('MM2 Radius & Size');
  if (!light || !spacing || !radius) throw new Error('Money Manager variables not found');
  const variableMap = target => Object.fromEntries(
    variables.filter(variable => variable.variableCollectionId === target.id)
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

  const states = [
    { name: 'Healthy', status: 'ON TRACK', accent: 'text/brand', bar: 'data/cash', width: 186 },
    { name: 'Approaching', status: 'NEAR LIMIT', accent: 'data/crypto', bar: 'data/crypto', width: 264 },
    { name: 'Exceeded', status: 'OVER BUDGET', accent: 'text/negative', bar: 'text/negative', width: 310 }
  ];
  const variants = [];
  const createdNodeIds = [];

  for (const state of states) {
    const card = figma.createComponent();
    card.name = `State=${state.name}`;
    card.resize(358, 164);
    card.layoutMode = 'VERTICAL';
    card.primaryAxisSizingMode = 'FIXED';
    card.counterAxisSizingMode = 'FIXED';
    card.itemSpacing = 13;
    card.setBoundVariable('paddingTop', spaces['space/lg']);
    card.setBoundVariable('paddingRight', spaces['space-lg'] || spaces['space/lg']);
    card.setBoundVariable('paddingBottom', spaces['space/lg']);
    card.setBoundVariable('paddingLeft', spaces['space/lg']);
    card.setBoundVariable('topLeftRadius', radii['radius/xl']);
    card.setBoundVariable('topRightRadius', radii['radius/xl']);
    card.setBoundVariable('bottomLeftRadius', radii['radius/xl']);
    card.setBoundVariable('bottomRightRadius', radii['radius/xl']);
    card.fills = [paint(state.name === 'Exceeded' ? 'bg/danger-soft' : 'bg/surface')];
    card.strokes = [paint('border/default')];
    card.strokeWeight = 1;

    const header = stack('header', 'HORIZONTAL');
    header.primaryAxisAlignItems = 'SPACE_BETWEEN';
    card.appendChild(header);
    header.layoutSizingHorizontal = 'FILL';
    const category = text('category', 'Heading/Medium', 'Monthly spending', 'text/primary');
    const status = text('status', 'Label/Medium', state.status, state.accent);
    header.appendChild(category);
    header.appendChild(status);

    const values = stack('values', 'HORIZONTAL');
    values.primaryAxisAlignItems = 'SPACE_BETWEEN';
    values.counterAxisAlignItems = 'MAX';
    card.appendChild(values);
    values.layoutSizingHorizontal = 'FILL';
    const usage = text('usage', 'Data/Medium', '€0 of €0', 'text/primary');
    const remaining = text('remaining', 'Caption', '€0 remaining', state.accent);
    values.appendChild(usage);
    values.appendChild(remaining);

    const track = figma.createFrame();
    track.name = 'progress-track';
    track.resize(310, 8);
    track.cornerRadius = 4;
    track.fills = [paint('bg/subtle')];
    track.clipsContent = true;
    const progress = figma.createRectangle();
    progress.name = 'progress-value';
    progress.resize(state.width, 8);
    progress.cornerRadius = 4;
    progress.fills = [paint(state.bar)];
    track.appendChild(progress);
    card.appendChild(track);

    const guidance = text(
      'guidance',
      'Caption',
      state.name === 'Healthy' ? '60% used · 18 days left' : state.name === 'Approaching' ? '85% used · slow down' : '104% used · review activity',
      'text/secondary'
    );
    card.appendChild(guidance);

    card.setSharedPluginData('dsb', 'run_id', RUN_ID);
    card.setSharedPluginData('dsb', 'phase', 'phase3');
    card.setSharedPluginData('dsb', 'key', `component/budget-progress/${state.name}`);
    variants.push(card);
    createdNodeIds.push(card.id, header.id, category.id, status.id, values.id, usage.id, remaining.id, track.id, progress.id, guidance.id);
  }

  const set = figma.combineAsVariants(variants, page);
  set.name = 'Budget Progress Card';
  set.description = 'Monthly spending budget card with healthy, approaching, and exceeded threshold states.';
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
  set.resizeWithoutConstraints(padding * 2 + 3 * 358 + 2 * gap, padding * 2 + 164);

  const categoryKey = set.addComponentProperty('Category', 'TEXT', 'Monthly spending');
  const usageKey = set.addComponentProperty('Usage', 'TEXT', '€0 of €0');
  const remainingKey = set.addComponentProperty('Remaining', 'TEXT', '€0 remaining');
  for (const child of set.children) {
    child.findOne(node => node.name === 'category').componentPropertyReferences = { characters: categoryKey };
    child.findOne(node => node.name === 'usage').componentPropertyReferences = { characters: usageKey };
    child.findOne(node => node.name === 'remaining').componentPropertyReferences = { characters: remainingKey };
  }

  const currentRight = Math.max(...page.children.filter(node => node.id !== set.id).map(node => node.x + node.width));
  set.x = currentRight + 420;
  set.y = 40;
  set.setSharedPluginData('dsb', 'run_id', RUN_ID);
  set.setSharedPluginData('dsb', 'phase', 'phase3');
  set.setSharedPluginData('dsb', 'key', 'componentset/budget-progress-card');

  const docs = stack('Budget Progress Card / Documentation', 'VERTICAL', 12);
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
  const docsTitle = text('Documentation title', 'Heading/Large', 'Budget Progress Card', 'text/primary');
  const docsBody = text('Documentation body', 'Body/Medium', 'Use on Home and Budgets. State changes only when the server crosses a configured notification threshold.', 'text/secondary');
  docsBody.textAutoResize = 'HEIGHT';
  docsBody.resize(272, docsBody.height);
  docs.appendChild(docsTitle);
  docs.appendChild(docsBody);
  docs.setSharedPluginData('dsb', 'run_id', RUN_ID);
  docs.setSharedPluginData('dsb', 'phase', 'phase3');
  docs.setSharedPluginData('dsb', 'key', 'doc/budget-progress-card');

  createdNodeIds.push(set.id, docs.id, docsTitle.id, docsBody.id);
  return {
    createdNodeIds,
    componentSetId: set.id,
    documentationId: docs.id,
    variants: set.children.map(child => child.name)
  };
})();
