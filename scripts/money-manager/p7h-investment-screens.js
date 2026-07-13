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
    figma.loadFontAsync({ family: 'Roboto Mono', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Roboto Mono', style: 'SemiBold' })
  ]);

  const [collections, variables, textStyles, chartComponent, assetComponent, navHome, primaryButton] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync(),
    figma.getLocalTextStylesAsync(),
    figma.getNodeByIdAsync('8:93'),
    figma.getNodeByIdAsync('8:33'),
    figma.getNodeByIdAsync('8:65'),
    figma.getNodeByIdAsync('2:367')
  ]);
  if (!chartComponent || chartComponent.type !== 'COMPONENT') throw new Error('Portfolio Chart Card not found');
  if (!assetComponent || assetComponent.type !== 'COMPONENT') throw new Error('Asset Row not found');
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
    'bg/warning-soft': '#FFF0CC', 'bg/info-soft': '#DDE8FF', 'text/primary': '#0B0B0A',
    'text/secondary': '#625D55', 'text/tertiary': '#938D82', 'text/inverse': '#FFFFFF',
    'text/brand': '#078B4B', 'text/negative': '#D9433B', 'data/crypto': '#F5A524',
    'data/stocks': '#326BFF', 'border/default': '#EAE6DD'
  };
  const rgb = hex => ({
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255
  });
  const paint = name => {
    if (!colors[name] || !fallbackHex[name]) throw new Error(`Missing investment color: ${name}`);
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

  function content(name, gap = 12) {
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

  function primaryAction(label) {
    const instance = primaryButton.createInstance();
    instance.name = label;
    const labelNode = instance.findOne(node => node.type === 'TEXT');
    if (labelNode) labelNode.characters = label;
    instance.resize(358, 52);
    return instance;
  }

  function chart() {
    const instance = chartComponent.createInstance();
    instance.name = 'Portfolio value chart';
    const label = instance.findOne(node => node.type === 'TEXT' && node.characters === 'PORTFOLIO');
    const value = instance.findOne(node => node.type === 'TEXT' && node.name === '€18,560.80');
    const change = instance.findOne(node => node.type === 'TEXT' && node.name === '+8.24%');
    if (label) label.characters = 'MANUAL PORTFOLIO';
    if (value) value.characters = '€12,480.54';
    if (change) change.characters = '+6.82%';
    return instance;
  }

  function asset(name, detail, valueCopy, changeCopy, badge, kind) {
    const instance = assetComponent.createInstance();
    instance.name = `${name} holding`;
    const nodes = instance.findAll(node => node.type === 'TEXT');
    if (nodes[0]) nodes[0].characters = badge;
    if (nodes[1]) nodes[1].characters = name;
    if (nodes[2]) nodes[2].characters = detail;
    if (nodes[3]) nodes[3].characters = valueCopy;
    if (nodes[4]) nodes[4].characters = changeCopy;
    const badgeFrame = instance.findOne(node => node.type === 'FRAME' && node.width === 42 && node.height === 42);
    if (kind === 'crypto' && badgeFrame) {
      badgeFrame.fills = [paint('bg/warning-soft')];
      if (nodes[0]) nodes[0].fills = [paint('text/primary')];
    }
    return instance;
  }

  const mutatedNodeIds = [];

  {
    const target = screen('screen/growth/invest-portfolio');
    const body = content('Investment portfolio content', 11);
    target.appendChild(body);
    const titleRow = stack('Title row', 'HORIZONTAL', 10);
    titleRow.counterAxisAlignItems = 'CENTER';
    fill(body, titleRow);
    const copy = stack('Title copy', 'VERTICAL', 4);
    titleRow.appendChild(copy);
    copy.layoutSizingHorizontal = 'FILL';
    copy.appendChild(text('Eyebrow', 'Caption', 'INVEST', 'text/brand'));
    copy.appendChild(text('Title', 'Display/Large', 'Portfolio', 'text/primary'));
    const record = figma.createFrame();
    record.name = 'Record trade';
    record.resize(44, 44);
    record.cornerRadius = 15;
    record.layoutMode = 'HORIZONTAL';
    record.primaryAxisAlignItems = 'CENTER';
    record.counterAxisAlignItems = 'CENTER';
    record.fills = [paint('bg/brand-soft')];
    record.appendChild(text('Record symbol', 'Heading/Large', '+', 'text/brand'));
    titleRow.appendChild(record);
    const valuation = chart();
    body.appendChild(valuation);
    body.appendChild(segmentControl(['Holdings', 'Activity'], 'Holdings'));
    const assetHeader = stack('Asset heading', 'HORIZONTAL');
    assetHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
    fill(body, assetHeader);
    assetHeader.appendChild(text('Section label', 'Caption', 'ASSETS', 'text/secondary'));
    assetHeader.appendChild(text('Price status', 'Caption', 'PRICES · 1 MIN AGO', 'text/brand'));
    body.appendChild(asset('Bitcoin', 'BTC · 0.1284', '€7,420.15', '+8.16%', '₿', 'crypto'));
    body.appendChild(asset('Apple', 'AAPL · 18.5 shares', '€3,812.40', '+4.21%', 'A', 'stock'));
    const nav = navigation('Invest');
    target.appendChild(nav);
    mutatedNodeIds.push(target.id, body.id, valuation.id, nav.id);
  }

  {
    const target = screen('screen/growth/record-trade');
    target.primaryAxisAlignItems = 'MIN';
    const body = content('Record trade content', 11);
    target.appendChild(body);
    body.appendChild(text('Eyebrow', 'Caption', 'MANUAL LEDGER', 'text/brand'));
    body.appendChild(text('Title', 'Display/Large', 'Record trade', 'text/primary'));
    body.appendChild(segmentControl(['Buy', 'Sell', 'Dividend'], 'Buy'));
    fill(body, inputRow('Asset', 'Bitcoin', 'BTC'));
    const quantityRow = stack('Quantity and price', 'HORIZONTAL', 10);
    fill(body, quantityRow);
    const quantity = inputRow('Quantity', '0.025', 'BTC');
    const price = inputRow('Price per unit', '€58,920.45');
    quantityRow.appendChild(quantity);
    quantityRow.appendChild(price);
    quantity.layoutSizingHorizontal = 'FILL';
    price.layoutSizingHorizontal = 'FILL';
    fill(body, inputRow('Fees and taxes', '€2.50', 'EDIT'));
    fill(body, inputRow('Broker', 'Revolut X', 'MANUAL'));
    const total = card('Trade total', 5, 'bg/inverted', 15);
    const totalRow = stack('Total row', 'HORIZONTAL');
    totalRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
    fill(total, totalRow);
    totalRow.appendChild(text('Total label', 'Caption', 'TOTAL COST', 'text/inverse', { opacity: 0.68 }));
    totalRow.appendChild(text('Total value', 'Data/Large', '€1,475.51', 'text/inverse'));
    fill(body, total);
    const note = card('Trade safety note', 4, 'bg/warning-soft', 12);
    wrapped(note, text('Safety title', 'Label/Large', 'Record only', 'text/primary'));
    wrapped(note, text('Safety copy', 'Caption', 'This creates a ledger entry. It never submits an order to Revolut X or Trading 212.', 'text/secondary'));
    fill(body, note);
    const action = primaryAction('Save trade');
    fill(body, action);
    mutatedNodeIds.push(target.id, body.id, total.id, action.id);
  }

  {
    const target = screen('screen/growth/investment-plan');
    target.primaryAxisAlignItems = 'MIN';
    const body = content('Investment plan content', 11);
    target.appendChild(body);
    body.appendChild(text('Eyebrow', 'Caption', 'INVESTMENT PLAN', 'text/brand'));
    body.appendChild(text('Title', 'Display/Large', 'Build the habit', 'text/primary'));
    wrapped(body, text('Subtitle', 'Body/Medium', 'Schedule a reminder to make a manual investment.', 'text/secondary'));
    fill(body, inputRow('Asset', 'Bitcoin', 'BTC'));
    fill(body, inputRow('Target amount', '€200.00', 'EUR'));
    body.appendChild(segmentControl(['Weekly', 'Monthly'], 'Monthly'));
    const planRow = stack('Plan date', 'HORIZONTAL', 10);
    fill(body, planRow);
    const day = inputRow('Day', '5th');
    const next = inputRow('Next reminder', '5 Aug');
    planRow.appendChild(day);
    planRow.appendChild(next);
    day.layoutSizingHorizontal = 'FILL';
    next.layoutSizingHorizontal = 'FILL';
    fill(body, toggleRow('Reminder', 'At 09:00 local time', true));
    const safety = card('Investment plan safety', 4, 'bg/brand-soft', 12);
    wrapped(safety, text('Safety title', 'Label/Large', 'No automatic trades', 'text/brand'));
    wrapped(safety, text('Safety copy', 'Caption', 'Plans create reminders only. You confirm the trade with your broker, then record it here.', 'text/brand'));
    fill(body, safety);
    const action = primaryAction('Save investment plan');
    fill(body, action);
    mutatedNodeIds.push(target.id, body.id, safety.id, action.id);
  }

  for (const id of mutatedNodeIds) {
    const node = await figma.getNodeByIdAsync(id);
    if (node) node.setSharedPluginData('dsb', 'run_id', RUN_ID);
  }
  return { mutatedNodeIds, screens: ['31:1360', '31:1361', '31:1362'] };
})();
