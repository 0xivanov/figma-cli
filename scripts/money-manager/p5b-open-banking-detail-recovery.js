(async () => {
  const page = await figma.getNodeByIdAsync('2:150');
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

  async function createText(name, styleName, characters, colorName) {
    const node = figma.createText();
    node.name = name;
    const style = styles[styleName];
    if (!style) throw new Error(`Missing text style: ${styleName}`);
    node.textStyleId = style.id;
    node.characters = characters;
    node.fills = [boundPaint(colorName)];
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

  function prepareScreen(screen, horizontalPadding = 24) {
    for (const child of [...screen.children]) child.remove();
    screen.layoutMode = 'VERTICAL';
    screen.primaryAxisSizingMode = 'FIXED';
    screen.counterAxisSizingMode = 'FIXED';
    screen.primaryAxisAlignItems = 'SPACE_BETWEEN';
    screen.counterAxisAlignItems = 'MIN';
    screen.paddingTop = 44;
    screen.paddingRight = horizontalPadding;
    screen.paddingBottom = 32;
    screen.paddingLeft = horizontalPadding;
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
    if (!component || component.type !== 'COMPONENT') throw new Error(`Component not found: ${componentId}`);
    const instance = component.createInstance();
    instance.name = name;
    if (values) await setInstanceText(instance, values);
    return instance;
  }

  async function createTransaction(name, values) {
    return createInstance('8:23', name, values);
  }

  async function createButton(componentId, name, label) {
    const button = await createInstance(componentId, name, [label]);
    button.resize(button.width, 52);
    return button;
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

  const accountDetail = await figma.getNodeByIdAsync('15:10');
  if (!accountDetail || accountDetail.type !== 'FRAME') throw new Error('Account detail screen not found');
  prepareScreen(accountDetail, 16);
  {
    const content = createStack('Account detail content', 12);
    appendFill(accountDetail, content);
    content.appendChild(await createText('Eyebrow', 'Caption', 'REVOLUT', 'text/brand'));
    await appendWrappedText(content, await createText('Title', 'Display/Large', 'Everyday', 'text/primary'));
    appendFill(content, await createInstance('8:41', 'Everyday balance', ['EVERYDAY', '€4,280.12', 'Updated just now']));
    content.appendChild(await createText('Activity label', 'Caption', 'RECENT ACTIVITY', 'text/secondary'));
    appendFill(content, await createTransaction('Fresh Market', ['F', 'Fresh Market', 'Food · Today', '−€42.80', 'Card']));
    appendFill(content, await createTransaction('Salary', ['S', 'Salary', 'Income · Jul 10', '+€3,200', 'Bank']));
    appendFill(content, await createTransaction('Central Pharmacy', ['C', 'Central Pharmacy', 'Health · Jul 9', '−€18.45', 'Card']));
    content.appendChild(await createText('Updated', 'Caption', 'Updated just now', 'text/secondary'));
    appendFill(accountDetail, await createButton('2:369', 'Refresh account', 'Refresh'));
  }

  const recovery = await figma.getNodeByIdAsync('15:11');
  if (!recovery || recovery.type !== 'FRAME') throw new Error('Recovery screen not found');
  prepareScreen(recovery, 24);
  {
    const content = createStack('Recovery content', 16);
    appendFill(recovery, content);
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
    appendFill(recovery, actions);
    appendFill(actions, await createButton('2:367', 'Reconnect', 'Reconnect'));
    appendFill(actions, await createButton('2:371', 'Not now', 'Not now'));
  }

  for (const screen of [accountDetail, recovery]) {
    screen.setSharedPluginData('money_manager', 'feature', 'open_banking');
    screen.setSharedPluginData('money_manager', 'platform', 'ios');
  }
  return { mutatedNodeIds: [accountDetail.id, recovery.id] };
})();
