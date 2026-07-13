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

  const [collections, variables, textStyles, scheduleSet, navComponent, primaryButton, secondaryButton] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync(),
    figma.getLocalTextStylesAsync(),
    figma.getNodeByIdAsync('31:1283'),
    figma.getNodeByIdAsync('8:65'),
    figma.getNodeByIdAsync('2:367'),
    figma.getNodeByIdAsync('2:369')
  ]);
  if (!scheduleSet || scheduleSet.type !== 'COMPONENT_SET') throw new Error('Schedule Row component set not found');
  if (!navComponent || navComponent.type !== 'COMPONENT') throw new Error('Bottom Navigation component not found');
  if (!primaryButton || primaryButton.type !== 'COMPONENT') throw new Error('Primary button component not found');
  if (!secondaryButton || secondaryButton.type !== 'COMPONENT') throw new Error('Secondary button component not found');

  const light = collections.find(collection => collection.name === 'MM2 Color Light');
  if (!light) throw new Error('MM2 Color Light variables not found');
  const colors = Object.fromEntries(
    variables.filter(variable => variable.variableCollectionId === light.id)
      .map(variable => [variable.name, variable])
  );
  const styles = Object.fromEntries(textStyles.map(style => [style.name, style]));
  const fallbackHex = {
    'bg/canvas': '#FBFAF7',
    'bg/surface': '#FFFFFF',
    'bg/subtle': '#F4F1EB',
    'bg/inverted': '#0B0B0A',
    'bg/brand': '#0CB764',
    'bg/brand-soft': '#D8FCE8',
    'text/primary': '#0B0B0A',
    'text/secondary': '#625D55',
    'text/inverse': '#FFFFFF',
    'text/brand': '#078B4B',
    'text/negative': '#D9433B',
    'border/default': '#EAE6DD'
  };
  const rgb = hex => ({
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255
  });
  const paint = name => {
    if (!colors[name]) throw new Error(`Missing color variable: ${name}`);
    if (!fallbackHex[name]) throw new Error(`Missing fallback color: ${name}`);
    return figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: rgb(fallbackHex[name]) },
      'color',
      colors[name]
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
    frame.cornerRadius = 18;
    frame.fills = [paint(background)];
    frame.strokes = [paint('border/default')];
    frame.strokeWeight = 1;
    return frame;
  }

  function wrapped(parent, node, width = 326) {
    node.textAutoResize = 'HEIGHT';
    node.resize(width, node.height);
    parent.appendChild(node);
    return node;
  }

  function screen(key) {
    const node = page.findAllWithCriteria({
      sharedPluginData: { namespace: 'dsb', keys: ['key'] }
    }).find(candidate => candidate.getSharedPluginData('dsb', 'key') === key);
    if (!node || node.type !== 'FRAME') throw new Error(`Screen not found: ${key}`);
    for (const child of [...node.children]) child.remove();
    node.layoutMode = 'VERTICAL';
    node.primaryAxisSizingMode = 'FIXED';
    node.counterAxisSizingMode = 'FIXED';
    node.primaryAxisAlignItems = 'SPACE_BETWEEN';
    node.paddingTop = 0;
    node.paddingRight = 0;
    node.paddingBottom = 0;
    node.paddingLeft = 0;
    node.itemSpacing = 0;
    node.fills = [paint('bg/canvas')];
    return node;
  }

  function content(name, gap = 14) {
    const frame = stack(name, 'VERTICAL', gap);
    frame.resize(390, 100);
    frame.counterAxisSizingMode = 'FIXED';
    frame.paddingTop = 44;
    frame.paddingRight = 16;
    frame.paddingBottom = 16;
    frame.paddingLeft = 16;
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
    knob.name = 'Switch knob';
    knob.resize(22, 22);
    knob.x = enabled ? 23 : 3;
    knob.y = 3;
    knob.fills = [paint('bg/surface')];
    toggle.appendChild(knob);
    frame.appendChild(toggle);
    return frame;
  }

  const scheduleDefinitions = scheduleSet.componentPropertyDefinitions;
  const scheduleKeys = {
    title: Object.keys(scheduleDefinitions).find(key => key.startsWith('Title#')),
    detail: Object.keys(scheduleDefinitions).find(key => key.startsWith('Detail#')),
    amount: Object.keys(scheduleDefinitions).find(key => key.startsWith('Amount#')),
    badge: Object.keys(scheduleDefinitions).find(key => key.startsWith('Badge#'))
  };
  function scheduleRow(direction, state, titleCopy, detailCopy, amountCopy, badgeCopy) {
    const instance = scheduleSet.defaultVariant.createInstance();
    instance.name = `${titleCopy} schedule`;
    instance.setProperties({
      Direction: direction,
      State: state,
      [scheduleKeys.title]: titleCopy,
      [scheduleKeys.detail]: detailCopy,
      [scheduleKeys.amount]: amountCopy,
      [scheduleKeys.badge]: badgeCopy
    });
    return instance;
  }

  function button(component, name, label) {
    const instance = component.createInstance();
    instance.name = name;
    const labelNode = instance.findOne(node => node.type === 'TEXT');
    if (labelNode) labelNode.characters = label;
    instance.resize(358, 52);
    return instance;
  }

  function navigation(active) {
    const set = navComponent.parent?.type === 'COMPONENT_SET' ? navComponent.parent : null;
    const variant = set?.children.find(child => child.type === 'COMPONENT' && child.name === `Active=${active}`)
      || navComponent;
    const instance = variant.createInstance();
    instance.name = `Bottom Navigation · ${active}`;
    return instance;
  }

  const mutatedNodeIds = [];

  // Scheduled Activity
  {
    const target = screen('screen/growth/scheduled-activity');
    const body = content('Scheduled activity content', 13);
    target.appendChild(body);
    body.appendChild(text('Eyebrow', 'Caption', 'ACTIVITY', 'text/brand'));
    body.appendChild(text('Title', 'Display/Large', 'Scheduled money', 'text/primary'));
    wrapped(body, text('Subtitle', 'Body/Medium', 'Forecast recurring money and keep it separate from booked activity.', 'text/secondary'));
    body.appendChild(segmentControl(['Actual', 'Scheduled'], 'Scheduled'));
    body.appendChild(text('Section label', 'Caption', 'NEXT 30 DAYS', 'text/secondary'));
    body.appendChild(scheduleRow('Expense', 'Due', 'Rent', 'Monthly · tomorrow', '−€850', 'R'));
    body.appendChild(scheduleRow('Income', 'Active', 'Salary', 'Monthly · Jul 25', '+€3,200', 'S'));
    body.appendChild(scheduleRow('Expense', 'Paused', 'Gym membership', 'Monthly · paused', '−€34.99', 'G'));
    const forecast = card('Forecast summary', 4, 'bg/inverted', 15);
    forecast.appendChild(text('Forecast label', 'Caption', '30-DAY FORECAST', 'text/inverse', { opacity: 0.68 }));
    forecast.appendChild(text('Forecast value', 'Data/Large', '+€2,315.01', 'text/inverse'));
    fill(body, forecast);
    const nav = navigation('Activity');
    target.appendChild(nav);
    mutatedNodeIds.push(target.id, body.id, nav.id);
  }

  // New Schedule
  {
    const target = screen('screen/growth/new-schedule');
    const body = content('New schedule content', 11);
    target.appendChild(body);
    body.appendChild(text('Eyebrow', 'Caption', 'NEW SCHEDULE', 'text/brand'));
    body.appendChild(text('Title', 'Display/Large', 'Plan recurring money', 'text/primary'));
    body.appendChild(segmentControl(['Expense', 'Income'], 'Expense'));
    fill(body, inputRow('Name', 'Rent'));
    fill(body, inputRow('Amount', '€850.00', 'EUR'));
    fill(body, inputRow('Category', 'Housing', 'CHANGE'));
    body.appendChild(segmentControl(['Daily', 'Weekly', 'Monthly'], 'Monthly'));
    const dateRow = stack('Schedule dates', 'HORIZONTAL', 10);
    fill(body, dateRow);
    const day = inputRow('Day', '1st');
    const start = inputRow('Starts', '1 Aug');
    dateRow.appendChild(day);
    dateRow.appendChild(start);
    day.layoutSizingHorizontal = 'FILL';
    start.layoutSizingHorizontal = 'FILL';
    fill(body, toggleRow('Add automatically', 'Post on the due date', true));
    const note = card('Schedule rule', 3, 'bg/brand-soft', 12);
    wrapped(note, text('Rule copy', 'Caption', 'Monthly dates clamp to the final valid day in shorter months.', 'text/brand'), 326);
    fill(body, note);
    const action = button(primaryButton, 'Create schedule', 'Create schedule');
    fill(body, action);
    mutatedNodeIds.push(target.id, body.id, action.id);
  }

  // Schedule Detail
  {
    const target = screen('screen/growth/schedule-detail');
    const body = content('Schedule detail content', 13);
    target.appendChild(body);
    body.appendChild(text('Eyebrow', 'Caption', 'SCHEDULE', 'text/brand'));
    body.appendChild(text('Title', 'Display/Large', 'Rent', 'text/primary'));
    body.appendChild(scheduleRow('Expense', 'Active', 'Rent', 'Monthly · 1st', '−€850', 'R'));
    const summary = card('Schedule summary', 9, 'bg/surface', 15);
    const rows = [
      ['Next occurrence', '1 Aug 2026'],
      ['Posting', 'Automatic'],
      ['Category', 'Housing'],
      ['Timezone', 'Europe/Sofia']
    ];
    for (const [label, value] of rows) {
      const row = stack(`Summary · ${label}`, 'HORIZONTAL');
      row.primaryAxisAlignItems = 'SPACE_BETWEEN';
      fill(summary, row);
      row.appendChild(text('Summary label', 'Body/Medium', label, 'text/secondary'));
      row.appendChild(text('Summary value', 'Label/Large', value, 'text/primary'));
    }
    fill(body, summary);
    body.appendChild(text('Upcoming label', 'Caption', 'UPCOMING', 'text/secondary'));
    for (const date of ['1 Aug · Planned', '1 Sep · Planned', '1 Oct · Planned']) {
      const occurrence = card(`Occurrence · ${date}`, 0, 'bg/surface', 13);
      occurrence.layoutMode = 'HORIZONTAL';
      occurrence.primaryAxisAlignItems = 'SPACE_BETWEEN';
      occurrence.counterAxisAlignItems = 'CENTER';
      occurrence.appendChild(text('Occurrence date', 'Body/Medium', date, 'text/primary'));
      occurrence.appendChild(text('Occurrence amount', 'Data/Medium', '−€850', 'text/negative'));
      fill(body, occurrence);
    }
    const actions = stack('Schedule actions', 'HORIZONTAL', 10);
    fill(body, actions);
    const pause = button(secondaryButton, 'Pause schedule', 'Pause');
    const edit = button(primaryButton, 'Edit schedule', 'Edit');
    actions.appendChild(pause);
    actions.appendChild(edit);
    pause.layoutSizingHorizontal = 'FILL';
    edit.layoutSizingHorizontal = 'FILL';
    mutatedNodeIds.push(target.id, body.id, summary.id, actions.id);
  }

  for (const id of mutatedNodeIds) {
    const node = await figma.getNodeByIdAsync(id);
    if (node) node.setSharedPluginData('dsb', 'run_id', RUN_ID);
  }
  return { mutatedNodeIds, screens: ['31:1355', '31:1356', '31:1357'] };
})();
