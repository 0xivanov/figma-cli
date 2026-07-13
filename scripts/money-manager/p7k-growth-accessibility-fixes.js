(async () => {
  const RUN_ID = 'money-manager-growth-20260713';
  const PAGE_ID = '2:149';
  const page = await figma.getNodeByIdAsync(PAGE_ID);
  if (!page || page.type !== 'PAGE') throw new Error('Components page not found');
  await figma.setCurrentPageAsync(page);
  await Promise.all([
    figma.loadFontAsync({ family: 'Manrope', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'SemiBold' }),
    figma.loadFontAsync({ family: 'Roboto Mono', style: 'Medium' })
  ]);

  const [collections, variables, budgetSet, chartComponent, assetComponent] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync(),
    figma.getNodeByIdAsync('31:1317'),
    figma.getNodeByIdAsync('8:93'),
    figma.getNodeByIdAsync('8:33')
  ]);
  if (!budgetSet || budgetSet.type !== 'COMPONENT_SET') throw new Error('Budget Progress Card set not found');
  if (!chartComponent || chartComponent.type !== 'COMPONENT') throw new Error('Portfolio Chart Card not found');
  if (!assetComponent || assetComponent.type !== 'COMPONENT') throw new Error('Asset Row not found');
  const light = collections.find(collection => collection.name === 'MM2 Color Light');
  if (!light) throw new Error('MM2 Color Light collection not found');
  const colors = Object.fromEntries(
    variables.filter(variable => variable.variableCollectionId === light.id)
      .map(variable => [variable.name, variable])
  );
  const paint = (name, fallback) => figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: fallback }, 'color', colors[name]
  );

  const approaching = budgetSet.children.find(child => child.type === 'COMPONENT' && child.name === 'State=Approaching');
  if (!approaching) throw new Error('Approaching budget variant not found');
  for (const nodeName of ['status', 'remaining']) {
    const node = approaching.findOne(candidate => candidate.type === 'TEXT' && candidate.name === nodeName);
    if (node) node.fills = [paint('text/primary', { r: 0.043, g: 0.043, b: 0.039 })];
  }

  for (const label of ['1M', '6M', '1Y', 'ALL']) {
    const node = chartComponent.findOne(candidate => candidate.type === 'TEXT' && candidate.characters === label);
    if (node) {
      node.fontSize = 12;
      node.lineHeight = { value: 18, unit: 'PIXELS' };
    }
  }

  const assetTexts = assetComponent.findAll(candidate => candidate.type === 'TEXT');
  for (const node of assetTexts) {
    if (node.characters.includes('shares') || node.characters.startsWith('+')) {
      node.fontSize = 12;
      node.lineHeight = { value: 18, unit: 'PIXELS' };
    }
  }

  for (const node of [approaching, chartComponent, assetComponent]) {
    node.setSharedPluginData('dsb', 'run_id', RUN_ID);
  }
  return {
    mutatedNodeIds: [approaching.id, chartComponent.id, assetComponent.id],
    fixes: ['budget warning contrast', 'chart range labels', 'asset metadata labels']
  };
})();
