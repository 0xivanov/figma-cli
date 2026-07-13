(async () => {
  const RUN_ID = 'money-manager-growth-20260713';
  const PAGE_ID = '2:150';
  const page = await figma.getNodeByIdAsync(PAGE_ID);
  if (!page || page.type !== 'PAGE') throw new Error('Product Screens page not found');
  await figma.setCurrentPageAsync(page);
  await Promise.all([
    figma.loadFontAsync({ family: 'Manrope', style: 'Regular' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'SemiBold' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'Bold' }),
    figma.loadFontAsync({ family: 'Roboto Mono', style: 'SemiBold' })
  ]);

  const [collections, variables, textStyles, budgetSet, navHome, primaryButton] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync(),
    figma.getLocalTextStylesAsync(),
    figma.getNodeByIdAsync('31:1317'),
    figma.getNodeByIdAsync('8:65'),
    figma.getNodeByIdAsync('2:367')
  ]);
  if (!budgetSet || budgetSet.type !== 'COMPONENT_SET') throw new Error('Budget Progress Card set not found');
  if (!navHome || navHome.type !== 'COMPONENT') throw new Error('Bottom Navigation component not found');
  if (!primaryButton || primaryButton.type !== 'COMPONENT') throw new Error('Primary button component not found');
  const light = collections.find(collection => collection.name === 'MM2 Color Light');
  if (!light) throw new Error('MM2 Color Light collection not found');
  const colors = Object.fromEntries(
    variables.filter(variable => variable.variableCollectionId === light.id)
      .map(variable => [variable.name, variable])
  );
  const styles = Object.fromEntries(textStyles.map(style => [style.name, style]));
  const fallbackHex = {
    'bg/canvas': '#FBFAF7', 'bg/surface': '#FFFFFF', 'bg/subtle': '#F4F1EB',
    'bg/inverted': '#0B0B0A', 'bg/brand': '#0CB764', 'bg/brand-soft': '#D8FCE8',
    'bg/warning-soft': '#FFF0CC', 'text/primary': '#0B0B0A', 'text/secondary': '#625D55',
    'text/tertiary': '#938D82', 'text/inverse': '#FFFFFF', 'text/brand': '#078B4B',
    'data/crypto': '#F5A524', 'border/default': '#EAE6DD'
  };
  const rgb = hex => ({
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255
  });
  const paint = name => {
    if (!colors[name] || !fallbackHex[name]) throw new Error(`Missing budget color: ${name}`);
    return figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: rgb(fallbackHex[name]) }, 'color', colors[name]
    );
  };

  function text(name, styleName, characters, colorName, options = {}) {
    const node = figma.createText();
    node.name = name;
    node.textStyleId = styles[styleName].id;
    node.characters = characters;
    node.fills = [paint(colorName)];
    if (options.opacity !== undefined) node.opacity = options.opacity;
    if (options.align) node.textAlignHorizontal = options.align;
    return node;
  }

  function stack(name, direction = 'VERTICAL', gap = 0) {
    const frame = figma.createFrame();
    frame.name = name;
    frame.layoutMode = direction;
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'AUTO';
    frame.itemSpacing = gap;
    frame.fills = [];
    return frame;
  }

  function fill(parent, child) {
    parent.appendChild(child);
    child.layoutSizingHorizontal = 'FILL';
    return child;
  }

  function card(name, gap = 8, background = 'bg/surface', padding = 16) {
    const frame = stack(name, 'VERTICAL', gap);
    frame.paddingTop = padding;
    frame.paddingRight = padding;
    frame.paddingBottom = padding;
    frame.paddingLeft = padding;
    frame.cornerRadius = 20;
    frame.fills = [paint(background)];
    frame.strokes = [paint('border/default')];
    frame.strokeWeight = 1;
    return frame;
  }

  function screen(key) {
    const node = page.findAllWithCriteria({ sharedPluginData: { namespace: 'dsb', keys: ['key'] } })
      .find(candidate => candidate.getSharedPluginData('dsb', 'key') === key);
    if (!node || node.type !== 'FRAME') throw new Error(`Screen not found: ${key}`);
    for (const child of [...node.children]) child.remove();
    node.layoutMode = 'VERTICAL';
    node.primaryAxisSizingMode = 'FIXED';
    node.counterAxisSizingMode = 'FIXED';
    node.primaryAxisAlignItems = 'SPACE_BETWEEN';
    node.fills = [paint('bg/canvas')];
    return node;
  }

  function content(name, gap = 13) {
    const frame = stack(name, 'VERTICAL', gap);
    frame.resize(390, 100);
    frame.counterAxisSizingMode = 'FIXED';
    frame.paddingTop = 44;
    frame.paddingRight = 16;
    frame.paddingBottom = 14;
    frame.paddingLeft = 16;
    return frame;
  }

  function wrapped(parent, node, width = 326) {
    node.textAutoResize = 'HEIGHT';
    node.resize(width, node.height);
    parent.appendChild(node);
    return node;
  }

  function navigation(active) {
    const set = navHome.parent?.type === 'COMPONENT_SET' ? navHome.parent : null;
    const variant = set?.children.find(child => child.type === 'COMPONENT' && child.name === `Active=${active}`) || navHome;
    const instance = variant.createInstance();
    instance.name = `Bottom Navigation · ${active}`;
    return instance;
  }

  function inputRow(label, value, detail) {
    const frame = card(`Field · ${label}`, 4, 'bg/surface', 13);
    const header = stack('Field header', 'HORIZONTAL');
    header.primaryAxisAlignItems = 'SPACE_BETWEEN';
    fill(frame, header);
    header.appendChild(text('Field label', 'Caption', label.toUpperCase(), 'text/secondary'));
    if (detail) header.appendChild(text('Field detail', 'Caption', detail, 'text/brand'));
    frame.appendChild(text('Field value', 'Title/Medium', value, 'text/primary'));
    return frame;
  }

  function segmentControl(items, selected) {
    const frame = stack('Segmented control', 'HORIZONTAL', 6);
    frame.resize(358, 44);
    frame.primaryAxisSizingMode = 'FIXED';
    frame.counterAxisSizingMode = 'FIXED';
    frame.paddingTop = 4;
    frame.paddingRight = 4;
    frame.paddingBottom = 4;
    frame.paddingLeft = 4;
    frame.cornerRadius = 15;
    frame.fills = [paint('bg/subtle')];
    for (const item of items) {
      const selectedItem = item === selected;
      const pill = stack(`Segment · ${item}`, 'HORIZONTAL');
      pill.primaryAxisAlignItems = 'CENTER';
      pill.counterAxisAlignItems = 'CENTER';
      pill.cornerRadius = 11;
      pill.fills = [paint(selectedItem ? 'bg/surface' : 'bg/subtle')];
      frame.appendChild(pill);
      pill.layoutSizingHorizontal = 'FILL';
      pill.layoutSizingVertical = 'FILL';
      pill.appendChild(text('Segment label', 'Label/Large', item, selectedItem ? 'text/brand' : 'text/secondary'));
    }
    return frame;
  }

  function toggleRow(titleCopy, detailCopy, enabled) {
    const frame = card(`Toggle · ${titleCopy}`, 0, 'bg/surface', 14);
    frame.layoutMode = 'HORIZONTAL';
    frame.primaryAxisAlignItems = 'SPACE_BETWEEN';
    frame.counterAxisAlignItems = 'CENTER';
    const copy = stack('Toggle copy', 'VERTICAL', 3);
    frame.appendChild(copy);
    copy.appendChild(text('Toggle title', 'Title/Medium', titleCopy, 'text/primary'));
    copy.appendChild(text('Toggle detail', 'Caption', detailCopy, 'text/secondary'));
    const toggle = figma.createFrame();
    toggle.name = 'Switch';
    toggle.resize(48, 28);
    toggle.cornerRadius = 14;
    toggle.fills = [paint(enabled ? 'bg/brand' : 'bg/subtle')];
    const knob = figma.createEllipse();
    knob.resize(22, 22);
    knob.x = enabled ? 23 : 3;
    knob.y = 3;
    knob.fills = [paint('bg/surface')];
    toggle.appendChild(knob);
    frame.appendChild(toggle);
    return frame;
  }

  const definitions = budgetSet.componentPropertyDefinitions;
  const propertyKeys = {
    category: Object.keys(definitions).find(key => key.startsWith('Category#')),
    usage: Object.keys(definitions).find(key => key.startsWith('Usage#')),
    remaining: Object.keys(definitions).find(key => key.startsWith('Remaining#'))
  };
  function budgetCard(state, category, usage, remaining) {
    const instance = budgetSet.defaultVariant.createInstance();
    instance.name = `${category} budget`;
    instance.setProperties({
      State: state,
      [propertyKeys.category]: category,
      [propertyKeys.usage]: usage,
      [propertyKeys.remaining]: remaining
    });
    return instance;
  }

  function primaryAction(label) {
    const instance = primaryButton.createInstance();
    instance.name = label;
    const labelNode = instance.findOne(node => node.type === 'TEXT');
    if (labelNode) labelNode.characters = label;
    instance.resize(358, 52);
    return instance;
  }

  const mutatedNodeIds = [];

  {
    const target = screen('screen/growth/budgets');
    const body = content('Budgets content', 12);
    target.appendChild(body);
    const titleRow = stack('Title row', 'HORIZONTAL', 10);
    titleRow.counterAxisAlignItems = 'CENTER';
    fill(body, titleRow);
    const copy = stack('Title copy', 'VERTICAL', 4);
    titleRow.appendChild(copy);
    copy.layoutSizingHorizontal = 'FILL';
    copy.appendChild(text('Eyebrow', 'Caption', 'BUDGETS', 'text/brand'));
    copy.appendChild(text('Title', 'Display/Large', 'Stay ahead of spending', 'text/primary'));
    const add = figma.createFrame();
    add.name = 'Add budget';
    add.resize(44, 44);
    add.cornerRadius = 15;
    add.layoutMode = 'HORIZONTAL';
    add.primaryAxisAlignItems = 'CENTER';
    add.counterAxisAlignItems = 'CENTER';
    add.fills = [paint('bg/brand-soft')];
    add.appendChild(text('Add symbol', 'Heading/Large', '+', 'text/brand'));
    titleRow.appendChild(add);
    wrapped(body, text('Subtitle', 'Body/Medium', 'Monthly limits based on booked expenses, not planned transactions.', 'text/secondary'));
    const overview = card('Monthly budget overview', 5, 'bg/inverted', 16);
    overview.strokes = [];
    overview.appendChild(text('Overview label', 'Caption', 'JULY SPENDING', 'text/inverse', { opacity: 0.66 }));
    overview.appendChild(text('Overview value', 'Data/Large', '€1,610 of €2,350', 'text/inverse'));
    const overviewMeta = stack('Overview meta', 'HORIZONTAL');
    overviewMeta.primaryAxisAlignItems = 'SPACE_BETWEEN';
    fill(overview, overviewMeta);
    overviewMeta.appendChild(text('Remaining', 'Caption', '€740 remaining', 'text/inverse', { opacity: 0.72 }));
    overviewMeta.appendChild(text('Percentage', 'Caption', '69%', 'text/inverse'));
    fill(body, overview);
    const sectionRow = stack('Category heading', 'HORIZONTAL');
    sectionRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
    fill(body, sectionRow);
    sectionRow.appendChild(text('Section label', 'Caption', 'CATEGORIES', 'text/secondary'));
    sectionRow.appendChild(text('See all', 'Caption', 'SEE ALL 4', 'text/brand'));
    body.appendChild(budgetCard('Approaching', 'Dining', '€420 of €500', '€80 remaining'));
    body.appendChild(budgetCard('Healthy', 'Transport', '€155 of €300', '€145 remaining'));
    const nav = navigation('Home');
    target.appendChild(nav);
    mutatedNodeIds.push(target.id, body.id, overview.id, nav.id);
  }

  {
    const target = screen('screen/growth/budget-editor');
    target.primaryAxisAlignItems = 'MIN';
    const body = content('Budget editor content', 12);
    target.appendChild(body);
    body.appendChild(text('Eyebrow', 'Caption', 'BUDGET', 'text/brand'));
    body.appendChild(text('Title', 'Display/Large', 'Dining budget', 'text/primary'));
    fill(body, inputRow('Limit', '€500.00', 'EUR'));
    fill(body, inputRow('Category', 'Dining', 'CHANGE'));
    body.appendChild(segmentControl(['Weekly', 'Monthly'], 'Monthly'));
    const threshold = card('Alert threshold', 10, 'bg/surface', 15);
    const thresholdHeader = stack('Threshold header', 'HORIZONTAL');
    thresholdHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
    fill(threshold, thresholdHeader);
    thresholdHeader.appendChild(text('Threshold label', 'Title/Medium', 'Approaching limit', 'text/primary'));
    thresholdHeader.appendChild(text('Threshold value', 'Data/Medium', '80%', 'text/brand'));
    const track = figma.createFrame();
    track.name = 'Threshold track';
    track.resize(326, 8);
    track.cornerRadius = 4;
    track.fills = [paint('bg/subtle')];
    const progress = figma.createRectangle();
    progress.name = 'Threshold progress';
    progress.resize(261, 8);
    progress.cornerRadius = 4;
    progress.fills = [paint('data/crypto')];
    track.appendChild(progress);
    threshold.appendChild(track);
    threshold.appendChild(text('Threshold detail', 'Caption', 'Notify when €400 has been spent.', 'text/secondary'));
    fill(body, threshold);
    fill(body, toggleRow('Push notifications', 'Approaching and exceeded alerts', true));
    const note = card('Budget counting rule', 4, 'bg/brand-soft', 12);
    wrapped(note, text('Rule title', 'Label/Large', 'What counts', 'text/brand'));
    wrapped(note, text('Rule copy', 'Caption', 'Booked expenses count. Transfers, investments, and planned items do not.', 'text/brand'));
    fill(body, note);
    const action = primaryAction('Save budget');
    fill(body, action);
    mutatedNodeIds.push(target.id, body.id, threshold.id, action.id);
  }

  for (const id of mutatedNodeIds) {
    const node = await figma.getNodeByIdAsync(id);
    if (node) node.setSharedPluginData('dsb', 'run_id', RUN_ID);
  }
  return { mutatedNodeIds, screens: ['31:1358', '31:1359'] };
})();
