(async () => {
  const RUN_ID = 'money-manager-privacy-theme-20260715';
  const PAGE_ID = '2:150';
  const targets = {
    home: [
      {
        appearance: 'light',
        screenId: '8:142',
        investmentValueId: '8:165',
        investmentReturnId: '8:166',
        afterInvestmentsValueId: '54:3887',
        investmentCashFlowId: '54:3886',
      },
      {
        appearance: 'dark',
        screenId: '8:515',
        investmentValueId: '8:538',
        investmentReturnId: '8:539',
        afterInvestmentsValueId: '54:3907',
        investmentCashFlowId: '54:3906',
      },
    ],
    invest: [
      {
        appearance: 'light',
        screenId: '31:1360',
        contentId: '34:3863',
        chartId: '34:3870',
        chartPlotId: 'I34:3870;8:80',
        portfolioValueId: 'I34:3870;8:78',
        portfolioReturnId: 'I34:3870;8:79',
        priceStatusId: '34:3896',
        holdingDetailIds: ['I34:3897;8:29', 'I34:3906;8:29'],
        holdingValueIds: ['I34:3897;8:31', 'I34:3906;8:31'],
        holdingReturnIds: ['I34:3897;8:32', 'I34:3906;8:32'],
      },
      {
        appearance: 'dark',
        screenId: '33:2871',
        contentId: '34:4773',
        chartId: '34:4780',
        chartPlotId: 'I34:4780;8:80',
        portfolioValueId: 'I34:4780;8:78',
        portfolioReturnId: 'I34:4780;8:79',
        priceStatusId: '34:4788',
        holdingDetailIds: ['I34:4789;8:29', 'I34:4790;8:29'],
        holdingValueIds: ['I34:4789;8:31', 'I34:4790;8:31'],
        holdingReturnIds: ['I34:4789;8:32', 'I34:4790;8:32'],
      },
    ],
    profile: [
      {
        appearance: 'light',
        screenId: '8:409',
        appearanceRowId: '8:440',
        appearanceLabelId: '8:441',
        appearanceValueId: '8:442',
        privacyRowId: '8:447',
        privacyLabelId: '8:448',
      },
      {
        appearance: 'dark',
        screenId: '8:702',
        appearanceRowId: '8:733',
        appearanceLabelId: '8:734',
        appearanceValueId: '8:735',
        privacyRowId: '8:740',
        privacyLabelId: '8:741',
      },
    ],
  };

  const page = await figma.getNodeByIdAsync(PAGE_ID);
  if (!page || page.type !== 'PAGE') throw new Error('Product Screens page not found');
  await figma.setCurrentPageAsync(page);
  await Promise.all([
    figma.loadFontAsync({ family: 'Manrope', style: 'Regular' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'SemiBold' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'Bold' }),
    figma.loadFontAsync({ family: 'Roboto Mono', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Roboto Mono', style: 'SemiBold' }),
  ]);

  const [collections, variables] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync('COLOR'),
  ]);

  function semanticColor(appearance, name) {
    const collectionName = appearance === 'light' ? 'MM2 Color Light' : 'MM2 Color Dark';
    const collection = collections.find(item => item.name === collectionName);
    const variable = variables.find(item =>
      item.variableCollectionId === collection?.id && item.name === name
    );
    if (!variable) throw new Error(`Missing ${collectionName}/${name}`);
    return variable;
  }

  function paint(appearance, name, fallback) {
    return figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: fallback, opacity: 1 },
      'color',
      semanticColor(appearance, name)
    );
  }

  async function setCharacters(text, characters) {
    text.characters = characters;
  }

  const createdNodeIds = [];
  const mutatedNodeIds = [];
  const screens = [];
  for (const orphan of page.children.filter(node => node.name === 'Portfolio privacy placeholder')) {
    orphan.remove();
  }

  for (const target of targets.home) {
    const nodes = await Promise.all([
      figma.getNodeByIdAsync(target.screenId),
      figma.getNodeByIdAsync(target.investmentValueId),
      figma.getNodeByIdAsync(target.investmentReturnId),
      figma.getNodeByIdAsync(target.afterInvestmentsValueId),
      figma.getNodeByIdAsync(target.investmentCashFlowId),
    ]);
    const [screen, investmentValue, investmentReturn, afterInvestmentsValue, investmentCashFlow] = nodes;
    if (!screen || screen.type !== 'FRAME') throw new Error(`Home screen not found: ${target.screenId}`);
    for (const node of [investmentValue, investmentReturn, afterInvestmentsValue, investmentCashFlow]) {
      if (!node || node.type !== 'TEXT') throw new Error(`Expected Home privacy text in ${target.screenId}`);
    }

    await setCharacters(investmentValue, '••••••');
    await setCharacters(investmentReturn, 'Balance hidden');
    await setCharacters(afterInvestmentsValue, '••••••');
    await setCharacters(investmentCashFlow, 'Investment impact hidden');
    investmentValue.name = 'Hidden investment balance';
    investmentReturn.name = 'Investment privacy status';
    afterInvestmentsValue.name = 'Hidden after-investments balance';
    investmentCashFlow.name = 'Hidden investment cash flow';
    mutatedNodeIds.push(...nodes.filter(Boolean).map(node => node.id));
    screens.push({ id: screen.id, name: screen.name });
  }

  for (const target of targets.invest) {
    const fixedNodes = await Promise.all([
      figma.getNodeByIdAsync(target.screenId),
      figma.getNodeByIdAsync(target.contentId),
      figma.getNodeByIdAsync(target.chartId),
      figma.getNodeByIdAsync(target.chartPlotId),
      figma.getNodeByIdAsync(target.portfolioValueId),
      figma.getNodeByIdAsync(target.portfolioReturnId),
      figma.getNodeByIdAsync(target.priceStatusId),
    ]);
    const [screen, content, chart, chartPlot, portfolioValue, portfolioReturn, priceStatus] = fixedNodes;
    if (!screen || screen.type !== 'FRAME') throw new Error(`Invest screen not found: ${target.screenId}`);
    if (!content || content.type !== 'FRAME') throw new Error(`Invest content not found: ${target.contentId}`);
    if (!chart || chart.type !== 'INSTANCE') throw new Error(`Portfolio chart not found: ${target.chartId}`);
    for (const node of [portfolioValue, portfolioReturn, priceStatus]) {
      if (!node || node.type !== 'TEXT') throw new Error(`Expected Invest text in ${target.screenId}`);
    }

    await setCharacters(portfolioValue, '••••••');
    await setCharacters(portfolioReturn, 'BALANCE HIDDEN');
    await setCharacters(priceStatus, 'PRICES · UPDATED 1 MIN AGO');
    portfolioValue.name = 'Hidden portfolio balance';
    portfolioReturn.name = 'Portfolio privacy status';
    priceStatus.name = 'Relative price status';
    priceStatus.textAutoResize = 'WIDTH_AND_HEIGHT';
    if (chartPlot && 'opacity' in chartPlot) chartPlot.opacity = 0.08;

    const holdingDetails = await Promise.all(target.holdingDetailIds.map(id => figma.getNodeByIdAsync(id)));
    const holdingValues = await Promise.all(target.holdingValueIds.map(id => figma.getNodeByIdAsync(id)));
    const holdingReturns = await Promise.all(target.holdingReturnIds.map(id => figma.getNodeByIdAsync(id)));
    for (const node of [...holdingDetails, ...holdingValues, ...holdingReturns]) {
      if (!node || node.type !== 'TEXT') throw new Error(`Expected holding privacy text in ${target.screenId}`);
    }
    for (const detail of holdingDetails) await setCharacters(detail, 'Quantity hidden');
    for (const value of holdingValues) await setCharacters(value, '••••••');
    for (const itemReturn of holdingReturns) await setCharacters(itemReturn, 'Hidden');

    const privacyKey = `invest/privacy-hint-${target.appearance}`;
    let privacyHint = content.findOne(node => node.getSharedPluginData('dsb', 'key') === privacyKey);
    if (!privacyHint) {
      privacyHint = figma.createFrame();
      privacyHint.name = 'Portfolio privacy placeholder';
      privacyHint.layoutMode = 'HORIZONTAL';
      privacyHint.primaryAxisSizingMode = 'FIXED';
      privacyHint.counterAxisSizingMode = 'FIXED';
      privacyHint.primaryAxisAlignItems = 'CENTER';
      privacyHint.counterAxisAlignItems = 'CENTER';
      privacyHint.resize(178, 36);
      privacyHint.cornerRadius = 18;
      privacyHint.fills = [paint(target.appearance, 'bg/subtle', { r: 0.957, g: 0.945, b: 0.922 })];
      content.appendChild(privacyHint);
      privacyHint.layoutPositioning = 'ABSOLUTE';
      privacyHint.x = 106;
      privacyHint.y = 231;
      privacyHint.setSharedPluginData('dsb', 'key', privacyKey);
      privacyHint.setSharedPluginData('dsb', 'run_id', RUN_ID);

      const hintText = priceStatus.clone();
      hintText.name = 'Privacy placeholder label';
      await setCharacters(hintText, 'PORTFOLIO HIDDEN');
      hintText.fills = [paint(target.appearance, 'text/secondary', { r: 0.384, g: 0.365, b: 0.333 })];
      hintText.opacity = 1;
      privacyHint.appendChild(hintText);
      createdNodeIds.push(privacyHint.id, hintText.id);
    }

    mutatedNodeIds.push(
      ...fixedNodes.filter(Boolean).map(node => node.id),
      ...holdingDetails.map(node => node.id),
      ...holdingValues.map(node => node.id),
      ...holdingReturns.map(node => node.id),
      privacyHint.id
    );
    screens.push({ id: screen.id, name: screen.name });
  }

  for (const target of targets.profile) {
    const nodes = await Promise.all([
      figma.getNodeByIdAsync(target.screenId),
      figma.getNodeByIdAsync(target.appearanceRowId),
      figma.getNodeByIdAsync(target.appearanceLabelId),
      figma.getNodeByIdAsync(target.appearanceValueId),
      figma.getNodeByIdAsync(target.privacyRowId),
      figma.getNodeByIdAsync(target.privacyLabelId),
    ]);
    const [screen, appearanceRow, appearanceLabel, appearanceValue, privacyRow, privacyLabel] = nodes;
    if (!screen || screen.type !== 'FRAME') throw new Error(`Profile screen not found: ${target.screenId}`);
    if (!appearanceRow || appearanceRow.type !== 'FRAME') throw new Error('Appearance row not found');
    if (!privacyRow || privacyRow.type !== 'FRAME') throw new Error('Privacy row not found');
    for (const node of [appearanceLabel, appearanceValue, privacyLabel]) {
      if (!node || node.type !== 'TEXT') throw new Error(`Expected Profile text in ${target.screenId}`);
    }

    appearanceRow.name = 'Appearance preference';
    appearanceRow.primaryAxisAlignItems = 'MIN';
    appearanceRow.itemSpacing = 10;
    appearanceLabel.layoutGrow = 1;
    privacyRow.name = 'Portfolio privacy preference';
    privacyRow.primaryAxisAlignItems = 'MIN';
    privacyRow.itemSpacing = 10;
    privacyLabel.layoutGrow = 1;
    await setCharacters(privacyLabel, 'Hide portfolio balances');
    privacyLabel.name = 'Hide portfolio balances';

    const segmentKey = `profile/appearance-control-${target.appearance}`;
    let segmentControl = appearanceRow.findOne(node => node.getSharedPluginData('dsb', 'key') === segmentKey);
    if (!segmentControl) {
      appearanceValue.visible = false;
      segmentControl = figma.createFrame();
      segmentControl.name = 'Theme · System selected';
      segmentControl.layoutMode = 'HORIZONTAL';
      segmentControl.primaryAxisSizingMode = 'FIXED';
      segmentControl.counterAxisSizingMode = 'FIXED';
      segmentControl.resize(190, 34);
      segmentControl.paddingTop = 3;
      segmentControl.paddingRight = 3;
      segmentControl.paddingBottom = 3;
      segmentControl.paddingLeft = 3;
      segmentControl.itemSpacing = 2;
      segmentControl.cornerRadius = 11;
      segmentControl.fills = [paint(target.appearance, 'bg/subtle', { r: 0.957, g: 0.945, b: 0.922 })];
      segmentControl.setSharedPluginData('dsb', 'key', segmentKey);
      segmentControl.setSharedPluginData('dsb', 'run_id', RUN_ID);

      for (const title of ['System', 'Light', 'Dark']) {
        const selected = title === 'System';
        const segment = figma.createFrame();
        segment.name = `Theme option · ${title}`;
        segment.layoutMode = 'HORIZONTAL';
        segment.primaryAxisSizingMode = 'AUTO';
        segment.counterAxisSizingMode = 'FIXED';
        segment.primaryAxisAlignItems = 'CENTER';
        segment.counterAxisAlignItems = 'CENTER';
        segment.cornerRadius = 8;
        segment.fills = [paint(
          target.appearance,
          selected ? 'bg/surface' : 'bg/subtle',
          selected ? { r: 1, g: 1, b: 1 } : { r: 0.957, g: 0.945, b: 0.922 }
        )];
        segmentControl.appendChild(segment);
        segment.layoutSizingHorizontal = 'FILL';
        segment.layoutSizingVertical = 'FILL';

        const optionLabel = appearanceValue.clone();
        optionLabel.visible = true;
        optionLabel.name = `Theme option label · ${title}`;
        await setCharacters(optionLabel, title);
        optionLabel.fills = [paint(
          target.appearance,
          selected ? 'text/brand' : 'text/secondary',
          selected ? { r: 0.027, g: 0.545, b: 0.294 } : { r: 0.384, g: 0.365, b: 0.333 }
        )];
        segment.appendChild(optionLabel);
        createdNodeIds.push(segment.id, optionLabel.id);
      }
      appearanceRow.appendChild(segmentControl);
      createdNodeIds.push(segmentControl.id);
    }

    const toggleKey = `profile/hide-balances-toggle-${target.appearance}`;
    let toggle = privacyRow.findOne(node => node.getSharedPluginData('dsb', 'key') === toggleKey);
    if (!toggle) {
      toggle = figma.createFrame();
      toggle.name = 'Hide balances switch · On';
      toggle.layoutMode = 'HORIZONTAL';
      toggle.primaryAxisSizingMode = 'FIXED';
      toggle.counterAxisSizingMode = 'FIXED';
      toggle.primaryAxisAlignItems = 'MAX';
      toggle.counterAxisAlignItems = 'CENTER';
      toggle.resize(50, 30);
      toggle.paddingTop = 2;
      toggle.paddingRight = 2;
      toggle.paddingBottom = 2;
      toggle.paddingLeft = 2;
      toggle.cornerRadius = 15;
      toggle.fills = [paint(target.appearance, 'bg/brand', { r: 0.047, g: 0.718, b: 0.392 })];
      toggle.setSharedPluginData('dsb', 'key', toggleKey);
      toggle.setSharedPluginData('dsb', 'run_id', RUN_ID);

      const knob = figma.createEllipse();
      knob.name = 'Switch thumb';
      knob.resize(26, 26);
      knob.fills = [paint(target.appearance, 'text/inverse', { r: 1, g: 1, b: 1 })];
      toggle.appendChild(knob);
      privacyRow.appendChild(toggle);
      createdNodeIds.push(toggle.id, knob.id);
    }

    mutatedNodeIds.push(...nodes.filter(Boolean).map(node => node.id), segmentControl.id, toggle.id);
    screens.push({ id: screen.id, name: screen.name });
  }

  const uniqueScreens = [...new Map(screens.map(screen => [screen.id, screen])).values()];
  const screenNodes = await Promise.all(uniqueScreens.map(screen => figma.getNodeByIdAsync(screen.id)));
  figma.viewport.scrollAndZoomIntoView(screenNodes.filter(Boolean));

  return {
    createdNodeIds: [...new Set(createdNodeIds)],
    mutatedNodeIds: [...new Set(mutatedNodeIds)],
    screens: uniqueScreens,
  };
})()
