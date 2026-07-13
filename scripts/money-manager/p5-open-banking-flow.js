(async () => {
  const PAGE_ID = '2:150';
  const SCREEN_IDS = {
    bankPicker: '15:7',
    consent: '15:8',
    connected: '15:9'
  };

  const page = await figma.getNodeByIdAsync(PAGE_ID);
  if (!page || page.type !== 'PAGE') throw new Error('Product Screens page not found');
  await figma.setCurrentPageAsync(page);

  await Promise.all([
    figma.loadFontAsync({ family: 'Manrope', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'Bold' }),
    figma.loadFontAsync({ family: 'Roboto Mono', style: 'Bold' })
  ]);

  const [collections, variables, textStyles] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync(),
    figma.getLocalTextStylesAsync()
  ]);
  const lightCollection = collections.find(collection => collection.name === 'MM2 Color Light');
  if (!lightCollection) throw new Error('MM2 Color Light variables not found');
  const colors = Object.fromEntries(
    variables
      .filter(variable => variable.variableCollectionId === lightCollection.id)
      .map(variable => [variable.name, variable])
  );
  const styles = Object.fromEntries(textStyles.map(style => [style.name, style]));

  function boundPaint(name, fallback = { r: 0, g: 0, b: 0 }) {
    const paint = { type: 'SOLID', color: fallback };
    return colors[name]
      ? figma.variables.setBoundVariableForPaint(paint, 'color', colors[name])
      : paint;
  }

  async function createText(name, styleName, characters, colorName, options = {}) {
    const node = figma.createText();
    node.name = name;
    const style = styles[styleName];
    if (!style) throw new Error(`Missing text style: ${styleName}`);
    node.textStyleId = style.id;
    node.characters = characters;
    node.fills = [boundPaint(colorName)];
    if (options.align) node.textAlignHorizontal = options.align;
    if (options.opacity !== undefined) node.opacity = options.opacity;
    return node;
  }

  function createStack(name, gap = 0) {
    const frame = figma.createFrame();
    frame.name = name;
    frame.layoutMode = 'VERTICAL';
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'AUTO';
    frame.itemSpacing = gap;
    frame.fills = [];
    return frame;
  }

  function createCard(name, fillName, radius = 20, padding = 18, gap = 8) {
    const frame = createStack(name, gap);
    frame.paddingTop = padding;
    frame.paddingRight = padding;
    frame.paddingBottom = padding;
    frame.paddingLeft = padding;
    frame.cornerRadius = radius;
    frame.fills = [boundPaint(fillName)];
    return frame;
  }

  function prepareScreen(screen) {
    for (const child of [...screen.children]) child.remove();
    screen.layoutMode = 'VERTICAL';
    screen.primaryAxisSizingMode = 'FIXED';
    screen.counterAxisSizingMode = 'FIXED';
    screen.primaryAxisAlignItems = 'MIN';
    screen.counterAxisAlignItems = 'MIN';
    screen.paddingTop = 44;
    screen.paddingRight = 24;
    screen.paddingBottom = 32;
    screen.paddingLeft = 24;
    screen.itemSpacing = 0;
    screen.fills = [boundPaint('bg/canvas', { r: 0.98, g: 0.97, b: 0.94 })];
    screen.clipsContent = true;
  }

  async function setInstanceText(instance, values) {
    const nodes = instance.findAll(node => node.type === 'TEXT');
    for (let index = 0; index < Math.min(nodes.length, values.length); index += 1) {
      const text = nodes[index];
      text.characters = values[index];
    }
  }

  async function createInstance(componentId, name, values) {
    const component = await figma.getNodeByIdAsync(componentId);
    if (!component || component.type !== 'COMPONENT') {
      throw new Error(`Component not found: ${componentId}`);
    }
    const instance = component.createInstance();
    instance.name = name;
    if (values) await setInstanceText(instance, values);
    return instance;
  }

  async function createButton(componentId, name, label) {
    const button = await createInstance(componentId, name, [label]);
    button.resize(button.width, 52);
    return button;
  }

  async function createTransaction(name, values) {
    return createInstance('8:23', name, values);
  }

  function appendFill(parent, child) {
    parent.appendChild(child);
    child.layoutSizingHorizontal = 'FILL';
    return child;
  }

  async function appendWrappedText(parent, node) {
    appendFill(parent, node);
    node.textAutoResize = 'HEIGHT';
    return node;
  }

  const screens = {};
  for (const [key, id] of Object.entries(SCREEN_IDS)) {
    const screen = await figma.getNodeByIdAsync(id);
    if (!screen || screen.type !== 'FRAME') throw new Error(`Screen not found: ${id}`);
    prepareScreen(screen);
    screens[key] = screen;
  }

  // Bank picker
  {
    const screen = screens.bankPicker;
    const content = createStack('Bank picker content', 16);
    appendFill(screen, content);
    content.appendChild(await createText('Eyebrow', 'Caption', 'CONNECT A BANK', 'text/brand'));
    await appendWrappedText(content, await createText('Title', 'Display/Large', 'Choose your bank', 'text/primary'));

    const search = figma.createFrame();
    search.name = 'Search';
    search.layoutMode = 'HORIZONTAL';
    search.primaryAxisSizingMode = 'FIXED';
    search.counterAxisSizingMode = 'FIXED';
    search.resize(342, 52);
    search.paddingLeft = 16;
    search.paddingRight = 16;
    search.counterAxisAlignItems = 'CENTER';
    search.cornerRadius = 16;
    search.fills = [boundPaint('bg/surface', { r: 1, g: 1, b: 1 })];
    search.strokes = [boundPaint('border/default', { r: 0.84, g: 0.82, b: 0.78 })];
    search.strokeWeight = 1;
    search.appendChild(await createText('Search label', 'Body/Medium', 'Search banks', 'text/tertiary'));
    appendFill(content, search);

    appendFill(content, await createInstance('8:50', 'Revolut', ['R', 'Revolut', 'Personal accounts', 'CONTINUE']));
    appendFill(content, await createInstance('8:50', 'UniCredit Bulbank', ['U', 'UniCredit Bulbank', 'Personal banking · BG', 'CONTINUE']));
    appendFill(content, await createInstance('8:50', 'DSK Bank', ['D', 'DSK Bank', 'Personal banking · BG', 'CONTINUE']));
    content.appendChild(await createText('Security note', 'Caption', 'You will finish securely in your bank.', 'text/secondary'));
  }

  // Consent handoff
  {
    const screen = screens.consent;
    screen.primaryAxisAlignItems = 'SPACE_BETWEEN';
    const content = createStack('Consent content', 16);
    appendFill(screen, content);
    content.appendChild(await createText('Eyebrow', 'Caption', 'SECURE HANDOFF', 'text/brand'));
    await appendWrappedText(content, await createText('Title', 'Display/Large', 'Review access', 'text/primary'));

    const hero = createCard('Institution summary', 'bg/inverted', 24, 20, 8);
    hero.appendChild(await createText('Institution', 'Heading/Medium', 'Revolut', 'text/inverse'));
    await appendWrappedText(hero, await createText('Institution detail', 'Body/Medium', 'Connect your personal accounts for a complete view of your money.', 'text/inverse', { opacity: 0.72 }));
    appendFill(content, hero);

    content.appendChild(await createText('Permissions label', 'Caption', 'READ-ONLY PERMISSIONS', 'text/secondary'));
    const balances = createCard('Balance permission', 'bg/surface', 18, 16, 4);
    balances.appendChild(await createText('Permission title', 'Title/Medium', 'View balances', 'text/primary'));
    await appendWrappedText(balances, await createText('Permission detail', 'Caption', 'Current and available balances', 'text/secondary'));
    appendFill(content, balances);
    const transactions = createCard('Transaction permission', 'bg/surface', 18, 16, 4);
    transactions.appendChild(await createText('Permission title', 'Title/Medium', 'Read transaction history', 'text/primary'));
    await appendWrappedText(transactions, await createText('Permission detail', 'Caption', 'Merchant, amount, date, and status', 'text/secondary'));
    appendFill(content, transactions);

    const note = createCard('Safety note', 'bg/brand-soft', 18, 16, 4);
    await appendWrappedText(note, await createText('Safety copy', 'Body/Medium', 'Money Manager cannot move money or make payments.', 'text/primary'));
    appendFill(content, note);

    const action = await createButton('2:367', 'Continue to Revolut', 'Continue to Revolut');
    appendFill(screen, action);
  }

  // Connected accounts
  {
    const screen = screens.connected;
    const content = createStack('Connected accounts content', 12);
    appendFill(screen, content);
    content.appendChild(await createText('Eyebrow', 'Caption', 'CONNECTED', 'text/brand'));
    await appendWrappedText(content, await createText('Title', 'Display/Large', 'Your accounts', 'text/primary'));
    appendFill(content, await createInstance('8:50', 'Revolut connection', ['R', 'Revolut', 'Valid until Oct 11', 'LIVE']));
    content.appendChild(await createText('Accounts label', 'Caption', 'ACCOUNTS', 'text/secondary'));
    appendFill(content, await createInstance('8:41', 'Everyday account', ['EVERYDAY', '€4,280.12', 'Updated just now']));
    appendFill(content, await createInstance('8:41', 'Savings account', ['SAVINGS', '€12,640.00', 'Updated just now']));
    const status = createCard('Connection status', 'bg/brand-soft', 18, 14, 2);
    await appendWrappedText(status, await createText('Status', 'Caption', 'READ-ONLY CONNECTION · EXPIRES IN 90 DAYS', 'text/brand'));
    appendFill(content, status);
  }

  // Account detail
  if (screens.accountDetail) {
    const screen = screens.accountDetail;
    screen.primaryAxisAlignItems = 'SPACE_BETWEEN';
    const content = createStack('Account detail content', 12);
    appendFill(screen, content);
    content.appendChild(await createText('Eyebrow', 'Caption', 'REVOLUT', 'text/brand'));
    await appendWrappedText(content, await createText('Title', 'Display/Large', 'Everyday', 'text/primary'));
    appendFill(content, await createInstance('8:41', 'Everyday balance', ['EVERYDAY', '€4,280.12', 'Updated just now']));
    content.appendChild(await createText('Activity label', 'Caption', 'RECENT ACTIVITY', 'text/secondary'));
    appendFill(content, await createTransaction('Fresh Market', ['F', 'Fresh Market', 'Food · Today', '−€42.80', 'Card']));
    appendFill(content, await createTransaction('Salary', ['S', 'Salary', 'Income · Jul 10', '+€3,200', 'Bank']));
    appendFill(content, await createTransaction('Central Pharmacy', ['C', 'Central Pharmacy', 'Health · Jul 9', '−€18.45', 'Card']));
    content.appendChild(await createText('Updated', 'Caption', 'Updated just now', 'text/secondary'));

    appendFill(screen, await createButton('2:369', 'Refresh account', 'Refresh'));
  }

  // Recovery
  if (screens.recovery) {
    const screen = screens.recovery;
    screen.primaryAxisAlignItems = 'SPACE_BETWEEN';
    const content = createStack('Recovery content', 16);
    appendFill(screen, content);
    content.appendChild(await createText('Eyebrow', 'Caption', 'CONNECTION ISSUE', 'text/negative'));
    await appendWrappedText(content, await createText('Title', 'Display/Large', 'Let’s reconnect', 'text/primary'));

    const warning = createCard('Connection warning', 'bg/danger-soft', 24, 20, 8);
    warning.appendChild(await createText('Warning title', 'Heading/Medium', 'Revolut needs attention', 'text/negative'));
    await appendWrappedText(warning, await createText('Warning detail', 'Body/Medium', 'Your bank stopped sharing new data. Reconnect to resume live balances and transactions.', 'text/primary'));
    appendFill(content, warning);

    const retained = createCard('Data retained', 'bg/surface', 18, 16, 6);
    retained.appendChild(await createText('Retained title', 'Title/Medium', 'Your history is safe', 'text/primary'));
    await appendWrappedText(retained, await createText('Retained detail', 'Body/Medium', 'Previously imported accounts and transactions remain available.', 'text/secondary'));
    appendFill(content, retained);

    const actions = createStack('Recovery actions', 8);
    appendFill(screen, actions);
    appendFill(actions, await createButton('2:367', 'Reconnect', 'Reconnect'));
    appendFill(actions, await createButton('2:371', 'Not now', 'Not now'));
  }

  const mutatedNodeIds = Object.values(screens).map(screen => screen.id);
  for (const screen of Object.values(screens)) {
    screen.setSharedPluginData('money_manager', 'feature', 'open_banking');
    screen.setSharedPluginData('money_manager', 'platform', 'ios');
  }

  return {
    mutatedNodeIds,
    screens: Object.fromEntries(Object.entries(screens).map(([key, screen]) => [key, screen.id]))
  };
})();
