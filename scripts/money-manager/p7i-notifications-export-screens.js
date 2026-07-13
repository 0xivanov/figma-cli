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

  const [collections, variables, textStyles, primaryButton] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync(),
    figma.getLocalTextStylesAsync(),
    figma.getNodeByIdAsync('2:367')
  ]);
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
    'bg/info-soft': '#DDE8FF', 'text/primary': '#0B0B0A', 'text/secondary': '#625D55',
    'text/tertiary': '#938D82', 'text/inverse': '#FFFFFF', 'text/brand': '#078B4B',
    'data/stocks': '#326BFF', 'border/default': '#EAE6DD'
  };
  const rgb = hex => ({
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255
  });
  const paint = name => {
    if (!colors[name] || !fallbackHex[name]) throw new Error(`Missing notification color: ${name}`);
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
    node.primaryAxisAlignItems = 'MIN';
    node.fills = [paint('bg/canvas')];
    return node;
  }

  function content(name, gap = 12) {
    const frame = stack(name, 'VERTICAL', gap);
    frame.resize(390, 100);
    frame.counterAxisSizingMode = 'FIXED';
    frame.paddingTop = 44;
    frame.paddingRight = 16;
    frame.paddingBottom = 16;
    frame.paddingLeft = 16;
    return frame;
  }

  function wrapped(parent, node, width = 326) {
    node.textAutoResize = 'HEIGHT';
    node.resize(width, node.height);
    parent.appendChild(node);
    return node;
  }

  function switchControl(enabled) {
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
    return toggle;
  }

  function preferenceRow(titleCopy, detailCopy, enabled) {
    const row = card(`Preference · ${titleCopy}`, 0, 'bg/surface', 14);
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisAlignItems = 'SPACE_BETWEEN';
    row.counterAxisAlignItems = 'CENTER';
    const copy = stack('Preference copy', 'VERTICAL', 3);
    row.appendChild(copy);
    copy.appendChild(text('Preference title', 'Title/Medium', titleCopy, 'text/primary'));
    const detail = text('Preference detail', 'Caption', detailCopy, 'text/secondary');
    detail.textAutoResize = 'HEIGHT';
    detail.resize(250, detail.height);
    copy.appendChild(detail);
    row.appendChild(switchControl(enabled));
    return row;
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
    const target = screen('screen/growth/notification-settings');
    const body = content('Notification settings content', 11);
    target.appendChild(body);
    body.appendChild(text('Eyebrow', 'Caption', 'SETTINGS', 'text/brand'));
    body.appendChild(text('Title', 'Display/Large', 'Notifications', 'text/primary'));
    const status = card('Push status', 4, 'bg/brand-soft', 14);
    const statusRow = stack('Push status row', 'HORIZONTAL');
    statusRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
    statusRow.counterAxisAlignItems = 'CENTER';
    fill(status, statusRow);
    const statusCopy = stack('Status copy', 'VERTICAL', 3);
    statusRow.appendChild(statusCopy);
    statusCopy.appendChild(text('Status title', 'Title/Medium', 'Push notifications active', 'text/brand'));
    statusCopy.appendChild(text('Status detail', 'Caption', 'This iPhone is registered', 'text/brand'));
    statusRow.appendChild(text('Status badge', 'Caption', 'ALLOWED', 'text/brand'));
    fill(body, status);
    body.appendChild(text('Money section', 'Caption', 'MONEY', 'text/secondary'));
    fill(body, preferenceRow('Bank spending', 'New booked card and account activity', true));
    fill(body, preferenceRow('Budget alerts', 'Approaching and exceeded limits', true));
    fill(body, preferenceRow('Scheduled money', 'Due today and automatic posting', true));
    fill(body, preferenceRow('Investment reminders', 'Manual plan reminders only', true));
    const refreshNote = card('Bank refresh note', 4, 'bg/info-soft', 12);
    wrapped(refreshNote, text('Refresh title', 'Label/Large', 'Bank alert timing', 'data/stocks'));
    wrapped(refreshNote, text('Refresh detail', 'Caption', 'Alerts arrive after your connected bank refreshes new booked activity.', 'text/secondary'));
    fill(body, refreshNote);
    const quiet = inputRow('Quiet hours', '22:00 to 08:00', 'EDIT');
    fill(body, quiet);
    mutatedNodeIds.push(target.id, body.id, status.id, refreshNote.id);
  }

  {
    const target = screen('screen/growth/audit-export');
    const body = content('Audit export content', 11);
    target.appendChild(body);
    body.appendChild(text('Eyebrow', 'Caption', 'DATA & AUDIT', 'text/brand'));
    body.appendChild(text('Title', 'Display/Large', 'Export your data', 'text/primary'));
    wrapped(body, text('Subtitle', 'Body/Medium', 'Create a portable record you can verify and keep.', 'text/secondary'));
    const scope = card('Export scope', 9, 'bg/surface', 15);
    scope.appendChild(text('Scope heading', 'Caption', 'INCLUDED', 'text/secondary'));
    const items = [
      'Transactions and categories',
      'Schedules and occurrences',
      'Budgets and thresholds',
      'Investment ledger and fees',
      'Price snapshots and valuations'
    ];
    for (const item of items) {
      const row = stack(`Included · ${item}`, 'HORIZONTAL', 9);
      row.counterAxisAlignItems = 'CENTER';
      const check = figma.createFrame();
      check.name = 'Included check';
      check.resize(20, 20);
      check.cornerRadius = 7;
      check.layoutMode = 'HORIZONTAL';
      check.primaryAxisAlignItems = 'CENTER';
      check.counterAxisAlignItems = 'CENTER';
      check.fills = [paint('bg/brand-soft')];
      check.appendChild(text('Check', 'Caption', '✓', 'text/brand'));
      row.appendChild(check);
      row.appendChild(text('Included item', 'Body/Medium', item, 'text/primary'));
      fill(scope, row);
    }
    fill(body, scope);
    const dates = stack('Export dates', 'HORIZONTAL', 10);
    fill(body, dates);
    const from = inputRow('From', '1 Jan 2026');
    const to = inputRow('To', 'Today');
    dates.appendChild(from);
    dates.appendChild(to);
    from.layoutSizingHorizontal = 'FILL';
    to.layoutSizingHorizontal = 'FILL';
    const format = card('Export format', 4, 'bg/inverted', 14);
    const formatRow = stack('Format row', 'HORIZONTAL');
    formatRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
    formatRow.counterAxisAlignItems = 'CENTER';
    fill(format, formatRow);
    const formatCopy = stack('Format copy', 'VERTICAL', 3);
    formatRow.appendChild(formatCopy);
    formatCopy.appendChild(text('Format title', 'Title/Medium', 'ZIP audit bundle', 'text/inverse'));
    formatCopy.appendChild(text('Format detail', 'Caption', 'CSV + JSON + checksums', 'text/inverse', { opacity: 0.68 }));
    formatRow.appendChild(text('Format size', 'Data/Medium', '2.4 MB', 'text/inverse'));
    fill(body, format);
    const privacy = card('Export privacy', 4, 'bg/brand-soft', 12);
    wrapped(privacy, text('Privacy title', 'Label/Large', 'Secrets are never exported', 'text/brand'));
    wrapped(privacy, text('Privacy detail', 'Caption', 'Bank tokens, private keys, and device push tokens stay on the server.', 'text/brand'));
    fill(body, privacy);
    const action = primaryAction('Create audit export');
    fill(body, action);
    mutatedNodeIds.push(target.id, body.id, scope.id, format.id, action.id);
  }

  for (const id of mutatedNodeIds) {
    const node = await figma.getNodeByIdAsync(id);
    if (node) node.setSharedPluginData('dsb', 'run_id', RUN_ID);
  }
  return { mutatedNodeIds, screens: ['31:1363', '31:1364'] };
})();
