(async () => {
  const page = await figma.getNodeByIdAsync('2:149');
  if (!page || page.type !== 'PAGE') throw new Error('Components page not found');
  await figma.setCurrentPageAsync(page);

  const component = await figma.getNodeByIdAsync('8:65');
  if (!component || component.type !== 'COMPONENT') {
    throw new Error('Bottom Navigation component not found');
  }

  const variables = await figma.variables.getLocalVariablesAsync();
  const lightCollection = (await figma.variables.getLocalVariableCollectionsAsync())
    .find(collection => collection.name === 'MM2 Color Light');
  if (!lightCollection) throw new Error('MM2 Color Light collection not found');

  const surface = variables.find(variable =>
    variable.variableCollectionId === lightCollection.id && variable.name === 'bg/surface'
  );
  const border = variables.find(variable =>
    variable.variableCollectionId === lightCollection.id && variable.name === 'border/default'
  );
  if (!surface || !border) throw new Error('Liquid glass semantic color variables not found');

  component.fills = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.68 },
    'color',
    surface
  )];
  component.strokes = [figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.62 },
    'color',
    border
  )];
  component.strokeWeight = 1;
  component.strokeAlign = 'INSIDE';
  component.effects = [
    {
      type: 'GLASS',
      visible: true,
      lightIntensity: 0.62,
      lightAngle: 135,
      refraction: 0.14,
      depth: 10,
      dispersion: 0.03,
      radius: 8
    },
    {
      type: 'INNER_SHADOW',
      visible: true,
      blendMode: 'NORMAL',
      color: { r: 1, g: 1, b: 1, a: 0.30 },
      offset: { x: 0, y: 1 },
      radius: 1,
      spread: 0
    },
    {
      type: 'DROP_SHADOW',
      visible: true,
      blendMode: 'NORMAL',
      color: { r: 0.043, g: 0.043, b: 0.039, a: 0.14 },
      offset: { x: 0, y: 7 },
      radius: 18,
      spread: -4,
      showShadowBehindNode: true
    }
  ];
  component.description = 'Floating bottom navigation with an iOS liquid-glass surface, semantic color bindings, and a persistent center action.';
  component.setSharedPluginData('mm2', 'surface', 'liquid-glass');

  return {
    mutatedNodeIds: [component.id],
    componentId: component.id,
    boundVariableIds: [surface.id, border.id]
  };
})();
