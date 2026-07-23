(async () => {
  const RUN_ID = 'money-manager-monthly-balance-20260715';
  const PAGE_ID = '2:150';
  const targets = [
    {
      screenId: '8:515',
      cardId: '8:521',
      labelId: '8:523',
      periodId: '8:525',
      valueId: '8:526',
      formulaId: '8:527',
      key: 'dark',
    },
    {
      screenId: '8:142',
      cardId: '8:148',
      labelId: '8:150',
      periodId: '8:152',
      valueId: '8:153',
      formulaId: '8:154',
      key: 'light',
    },
  ];

  const page = await figma.getNodeByIdAsync(PAGE_ID);
  if (!page || page.type !== 'PAGE') throw new Error('Product Screens page not found');
  await figma.setCurrentPageAsync(page);

  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const variables = await figma.variables.getLocalVariablesAsync('COLOR');

  function semanticColor(appearance, name) {
    const collectionName = appearance === 'light' ? 'MM2 Color Light' : 'MM2 Color Dark';
    const collection = collections.find(item => item.name === collectionName);
    const variable = variables.find(item =>
      item.variableCollectionId === collection?.id && item.name === name
    );
    if (!variable) throw new Error(`Missing ${collectionName}/${name}`);
    return variable;
  }

  function boundFill(variable, color) {
    const paint = { type: 'SOLID', color, opacity: 1 };
    return [figma.variables.setBoundVariableForPaint(paint, 'color', variable)];
  }

  async function loadCurrentFonts(text) {
    const segments = text.getStyledTextSegments(['fontName']);
    const fonts = new Map();
    for (const segment of segments) {
      const font = segment.fontName;
      fonts.set(`${font.family}/${font.style}`, font);
    }
    for (const font of fonts.values()) await figma.loadFontAsync(font);
  }

  async function setCharacters(text, characters) {
    if (text.characters === characters) return;
    await loadCurrentFonts(text);
    text.characters = characters;
  }

  const createdNodeIds = [];
  const removedNodeIds = [];
  const mutatedNodeIds = [];
  const screens = [];

  for (const target of targets) {
    const [screen, card, label, period, value, formula] = await Promise.all([
      figma.getNodeByIdAsync(target.screenId),
      figma.getNodeByIdAsync(target.cardId),
      figma.getNodeByIdAsync(target.labelId),
      figma.getNodeByIdAsync(target.periodId),
      figma.getNodeByIdAsync(target.valueId),
      figma.getNodeByIdAsync(target.formulaId),
    ]);

    if (!screen || screen.type !== 'FRAME') throw new Error(`Home screen not found: ${target.screenId}`);
    if (!card || card.type !== 'FRAME') throw new Error(`Balance card not found: ${target.cardId}`);
    for (const node of [label, period, value, formula]) {
      if (!node || node.type !== 'TEXT') throw new Error(`Expected balance text in ${target.screenId}`);
    }

    await setCharacters(label, 'MONTHLY BALANCE');
    label.name = 'Monthly balance label';
    await setCharacters(period, 'JULY');
    period.name = 'Selected month';
    await setCharacters(value, '−€392.66');
    value.name = 'Income minus expenses';
    await setCharacters(formula, 'Income − expenses');
    formula.name = 'Balance formula';

    card.name = 'Monthly Balance Card';
    card.paddingTop = 16;
    card.paddingRight = 16;
    card.paddingBottom = 16;
    card.paddingLeft = 16;
    card.itemSpacing = 8;

    let divider = card.findOne(node =>
      node.getSharedPluginData('dsb', 'key') === `home-balance/divider-${target.key}`
    );
    const secondaryMatches = card.findAll(node =>
      node.getSharedPluginData('dsb', 'key') === `home-balance/secondary-${target.key}`
    );
    let secondary = secondaryMatches[0] || null;
    for (const duplicate of secondaryMatches.slice(1)) {
      removedNodeIds.push(duplicate.id);
      duplicate.remove();
    }

    if (!divider) {
      divider = figma.createRectangle();
      divider.name = 'Secondary balance divider';
      divider.resize(326, 1);
      divider.layoutAlign = 'STRETCH';
      divider.fills = formula.fills;
      divider.opacity = 0.18;
      divider.setSharedPluginData('dsb', 'key', `home-balance/divider-${target.key}`);
      divider.setSharedPluginData('dsb', 'run_id', RUN_ID);
      card.appendChild(divider);
      createdNodeIds.push(divider.id);
    }

    if (!secondary) {
      secondary = figma.createFrame();
      secondary.name = 'After Investments';
      secondary.layoutMode = 'HORIZONTAL';
      secondary.primaryAxisSizingMode = 'FIXED';
      secondary.counterAxisSizingMode = 'AUTO';
      secondary.primaryAxisAlignItems = 'SPACE_BETWEEN';
      secondary.counterAxisAlignItems = 'CENTER';
      secondary.itemSpacing = 12;
      secondary.fills = [];
      secondary.layoutAlign = 'STRETCH';
      secondary.resize(326, 38);
      secondary.setSharedPluginData('dsb', 'key', `home-balance/secondary-${target.key}`);
      secondary.setSharedPluginData('dsb', 'run_id', RUN_ID);

      const detail = figma.createFrame();
      detail.name = 'After investments detail';
      detail.layoutMode = 'VERTICAL';
      detail.primaryAxisSizingMode = 'AUTO';
      detail.counterAxisSizingMode = 'AUTO';
      detail.itemSpacing = 1;
      detail.fills = [];
      detail.layoutGrow = 1;

      const secondaryLabel = formula.clone();
      secondaryLabel.name = 'After investments label';
      await setCharacters(secondaryLabel, 'AFTER INVESTMENTS');
      await figma.loadFontAsync({ family: 'Manrope', style: 'Bold' });
      secondaryLabel.fontName = { family: 'Manrope', style: 'Bold' };
      secondaryLabel.fontSize = 12;
      secondaryLabel.textAutoResize = 'WIDTH_AND_HEIGHT';

      const secondaryCaption = formula.clone();
      secondaryCaption.name = 'Investment cash flow detail';
      await setCharacters(secondaryCaption, '€50.04 invested this month');
      secondaryCaption.fontSize = 12;
      secondaryCaption.opacity = 0.72;
      secondaryCaption.textAutoResize = 'WIDTH_AND_HEIGHT';

      const secondaryValue = value.clone();
      secondaryValue.name = 'After investments value';
      await setCharacters(secondaryValue, '−€442.70');
      secondaryValue.fontSize = 14;
      secondaryValue.textAutoResize = 'WIDTH_AND_HEIGHT';
      secondaryValue.opacity = 0.78;

      detail.appendChild(secondaryLabel);
      detail.appendChild(secondaryCaption);
      secondary.appendChild(detail);
      secondary.appendChild(secondaryValue);
      card.appendChild(secondary);
      createdNodeIds.push(
        secondary.id,
        detail.id,
        secondaryLabel.id,
        secondaryCaption.id,
        secondaryValue.id
      );
    } else if (secondary.type === 'FRAME') {
      const secondaryLabel = secondary.findOne(node => node.name === 'After investments label');
      const secondaryCaption = secondary.findOne(node => node.name === 'Investment cash flow detail');
      const secondaryValue = secondary.findOne(node => node.name === 'After investments value');
      if (secondaryLabel?.type === 'TEXT') await setCharacters(secondaryLabel, 'AFTER INVESTMENTS');
      if (secondaryCaption?.type === 'TEXT') await setCharacters(secondaryCaption, '€50.04 invested this month');
      if (secondaryValue?.type === 'TEXT') await setCharacters(secondaryValue, '−€442.70');
    }

    if (divider.type === 'RECTANGLE') {
      const inverseColor = target.key === 'light'
        ? { r: 1, g: 1, b: 1 }
        : { r: 0.043, g: 0.043, b: 0.039 };
      divider.resize(326, 1);
      divider.fills = boundFill(semanticColor(target.key, 'text/inverse'), inverseColor);
    }
    if (secondary.type === 'FRAME') {
      secondary.resize(326, 38);
      const secondaryLabel = secondary.findOne(node => node.name === 'After investments label');
      const secondaryCaption = secondary.findOne(node => node.name === 'Investment cash flow detail');
      const secondaryValue = secondary.findOne(node => node.name === 'After investments value');
      const textColor = semanticColor(target.key, 'text/inverse');
      const inverseColor = target.key === 'light'
        ? { r: 1, g: 1, b: 1 }
        : { r: 0.043, g: 0.043, b: 0.039 };
      for (const text of [secondaryLabel, secondaryCaption, secondaryValue]) {
        if (text?.type === 'TEXT') text.fills = boundFill(textColor, inverseColor);
      }
      if (secondaryLabel?.type === 'TEXT') secondaryLabel.fontSize = 12;
      if (secondaryCaption?.type === 'TEXT') secondaryCaption.fontSize = 12;
    }

    const oldHeight = card.height;
    const newHeight = 200;
    const delta = newHeight - oldHeight;
    if (delta !== 0) {
      card.resize(card.width, newHeight);
      for (const child of screen.children) {
        if (child.id === card.id || child.type === 'INSTANCE') continue;
        if (child.y > card.y) child.y += delta;
      }
    }

    card.setSharedPluginData('dsb', 'key', `screen/home/monthly-balance-${target.key}`);
    card.setSharedPluginData('dsb', 'run_id', RUN_ID);
    for (const node of [card, label, period, value, formula, divider, secondary]) {
      if (node) mutatedNodeIds.push(node.id);
    }
    screens.push({ id: screen.id, name: screen.name, cardId: card.id });
  }

  figma.viewport.scrollAndZoomIntoView(
    (await Promise.all(targets.map(target => figma.getNodeByIdAsync(target.screenId)))).filter(Boolean)
  );

  return {
    createdNodeIds,
    removedNodeIds,
    mutatedNodeIds: [...new Set(mutatedNodeIds)],
    screens,
    values: {
      monthlyBalance: '−€392.66',
      investedThisMonth: '€50.04',
      afterInvestments: '−€442.70',
    },
  };
})();
