(async () => {
  await Promise.all([
    figma.loadFontAsync({ family: 'Manrope', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'Bold' })
  ]);

  const [collections, variables, textStyles] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync(),
    figma.getLocalTextStylesAsync()
  ]);
  const primitiveCollection = collections.find(collection => collection.name === 'MM2 Primitives');
  const lightCollection = collections.find(collection => collection.name === 'MM2 Color Light');
  const typeCollection = collections.find(collection => collection.name === 'MM2 Typography');
  if (!primitiveCollection || !lightCollection || !typeCollection) {
    throw new Error('Required Money Manager variable collections not found');
  }

  const primitiveMode = primitiveCollection.modes[0].modeId;
  const typeMode = typeCollection.modes[0].modeId;
  const mint700 = variables.find(variable => variable.variableCollectionId === primitiveCollection.id && variable.name === 'mint/700');
  const coral600 = variables.find(variable => variable.variableCollectionId === primitiveCollection.id && variable.name === 'coral/600');
  const captionSize = variables.find(variable => variable.variableCollectionId === typeCollection.id && variable.name === 'size/caption');
  const captionLine = variables.find(variable => variable.variableCollectionId === typeCollection.id && variable.name === 'line/caption');
  const labelLine = variables.find(variable => variable.variableCollectionId === typeCollection.id && variable.name === 'line/label');
  const bodyLine = variables.find(variable => variable.variableCollectionId === typeCollection.id && variable.name === 'line/body');
  if (!mint700 || !coral600 || !captionSize || !captionLine || !labelLine || !bodyLine) {
    throw new Error('Accessibility tokens not found');
  }

  mint700.setValueForMode(primitiveMode, { r: 0, g: 0.4196078431, b: 0.2352941176, a: 1 });
  coral600.setValueForMode(primitiveMode, { r: 0.7215686275, g: 0.1843137255, b: 0.168627451, a: 1 });
  captionSize.setValueForMode(typeMode, 12);
  captionLine.setValueForMode(typeMode, 18);
  labelLine.setValueForMode(typeMode, 18);
  bodyLine.setValueForMode(typeMode, 21);

  const captionStyle = textStyles.find(style => style.name === 'Caption');
  if (!captionStyle) throw new Error('Caption text style not found');
  captionStyle.fontSize = 12;
  captionStyle.lineHeight = { unit: 'PIXELS', value: 18 };
  const accessibleLineHeights = {
    'Label/Medium': 18,
    'Body/Medium': 21,
    'Title/Medium': 24,
    'Heading/Medium': 28
  };
  for (const [name, value] of Object.entries(accessibleLineHeights)) {
    const style = textStyles.find(candidate => candidate.name === name);
    if (!style) throw new Error(`Text style not found: ${name}`);
    style.lineHeight = { unit: 'PIXELS', value };
  }

  const textMetrics = [
    ['8:47', 12, 18],
    ['8:49', 12, 18],
    ['8:40', 12, 18],
    ['8:19', 12, 18],
    ['8:22', 12, 18]
  ];
  const mutatedNodeIds = [];
  for (const [id, size, line] of textMetrics) {
    const node = await figma.getNodeByIdAsync(id);
    if (!node || node.type !== 'TEXT') throw new Error(`Text node not found: ${id}`);
    node.fontSize = size;
    node.lineHeight = { unit: 'PIXELS', value: line };
    mutatedNodeIds.push(node.id);
  }

  const inverse = variables.find(variable => variable.variableCollectionId === lightCollection.id && variable.name === 'text/inverse');
  if (!inverse) throw new Error('Light text/inverse variable not found');
  for (const id of ['8:40', '17:7']) {
    const node = await figma.getNodeByIdAsync(id);
    if (!node || node.type !== 'TEXT') throw new Error(`Inverse text node not found: ${id}`);
    const basePaint = { type: 'SOLID', color: { r: 1, g: 1, b: 1 } };
    node.fills = [figma.variables.setBoundVariableForPaint(basePaint, 'color', inverse)];
    node.opacity = 0.76;
    mutatedNodeIds.push(node.id);
  }

  const mint300 = variables.find(variable => variable.variableCollectionId === primitiveCollection.id && variable.name === 'mint/300');
  const accountLabel = await figma.getNodeByIdAsync('8:36');
  if (!mint300 || !accountLabel || accountLabel.type !== 'TEXT') {
    throw new Error('Accessible account label color target not found');
  }
  accountLabel.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.45, g: 0.89, b: 0.66 } },
    'color',
    mint300
  )];
  mutatedNodeIds.push(accountLabel.id);

  return {
    mutatedNodeIds,
    updatedVariables: [mint700.id, coral600.id, captionSize.id, captionLine.id, labelLine.id, bodyLine.id],
    updatedStyles: [
      captionStyle.id,
      ...Object.keys(accessibleLineHeights).map(name => textStyles.find(style => style.name === name).id)
    ]
  };
})();
