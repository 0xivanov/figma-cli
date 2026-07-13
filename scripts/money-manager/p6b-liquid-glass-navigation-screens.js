(async () => {
  const page = await figma.getNodeByIdAsync('2:150');
  if (!page || page.type !== 'PAGE') throw new Error('Product Screens page not found');
  await figma.setCurrentPageAsync(page);

  const ids = ['8:183', '8:245', '8:302', '8:450', '8:556', '8:618', '8:675', '8:743'];
  const bars = await Promise.all(ids.map(id => figma.getNodeByIdAsync(id)));
  if (bars.some(node => !node || node.type !== 'FRAME')) {
    throw new Error('One or more bottom navigation frames were not found');
  }

  const [collections, variables] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync()
  ]);
  const lightCollection = collections.find(collection => collection.name === 'MM2 Color Light');
  const darkCollection = collections.find(collection => collection.name === 'MM2 Color Dark');
  if (!lightCollection || !darkCollection) throw new Error('MM2 color collections not found');

  const semantic = (collection, name) => variables.find(variable =>
    variable.variableCollectionId === collection.id && variable.name === name
  );
  const lightSurface = semantic(lightCollection, 'bg/surface');
  const lightBorder = semantic(lightCollection, 'border/default');
  const darkSurface = semantic(darkCollection, 'bg/surface');
  const darkBorder = semantic(darkCollection, 'border/default');
  if (!lightSurface || !lightBorder || !darkSurface || !darkBorder) {
    throw new Error('Liquid glass semantic variables not found');
  }

  const mutatedNodeIds = [];
  const centerActionIds = [];

  for (const bar of bars) {
    const isDark = bar.parent && /Dark/.test(bar.parent.name);
    const surface = isDark ? darkSurface : lightSurface;
    const border = isDark ? darkBorder : lightBorder;

    bar.name = 'Bottom Navigation / Liquid Glass';
    bar.fills = [figma.variables.setBoundVariableForPaint(
      {
        type: 'SOLID',
        color: isDark ? { r: 0.09, g: 0.09, b: 0.082 } : { r: 1, g: 1, b: 1 },
        opacity: isDark ? 0.62 : 0.68
      },
      'color',
      surface
    )];
    bar.strokes = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: isDark ? 0.48 : 0.62 },
      'color',
      border
    )];
    bar.strokeWeight = 1;
    bar.strokeAlign = 'INSIDE';
    bar.effects = [
      {
        type: 'GLASS',
        visible: true,
        lightIntensity: isDark ? 0.54 : 0.62,
        lightAngle: 135,
        refraction: isDark ? 0.12 : 0.14,
        depth: 10,
        dispersion: 0.03,
        radius: 8
      },
      {
        type: 'INNER_SHADOW',
        visible: true,
        blendMode: 'NORMAL',
        color: { r: 1, g: 1, b: 1, a: isDark ? 0.16 : 0.30 },
        offset: { x: 0, y: 1 },
        radius: 1,
        spread: 0
      },
      {
        type: 'DROP_SHADOW',
        visible: true,
        blendMode: 'NORMAL',
        color: { r: 0.043, g: 0.043, b: 0.039, a: isDark ? 0.24 : 0.14 },
        offset: { x: 0, y: 7 },
        radius: 18,
        spread: -4,
        showShadowBehindNode: true
      }
    ];
    bar.setSharedPluginData('mm2', 'surface', 'liquid-glass');
    mutatedNodeIds.push(bar.id);

    const centerAction = bar.children[2];
    if (centerAction && centerAction.type === 'FRAME') {
      centerAction.name = 'Add Transaction / Tinted Glass';
      centerAction.fills = centerAction.fills.map(paint =>
        paint.type === 'SOLID' ? { ...paint, opacity: 0.90 } : paint
      );
      centerAction.strokes = [{
        type: 'SOLID',
        color: { r: 1, g: 1, b: 1 },
        opacity: isDark ? 0.24 : 0.34
      }];
      centerAction.strokeWeight = 1;
      centerAction.strokeAlign = 'INSIDE';
      centerAction.effects = [
        {
          type: 'GLASS',
          visible: true,
          lightIntensity: isDark ? 0.58 : 0.68,
          lightAngle: 135,
          refraction: 0.12,
          depth: 8,
          dispersion: 0.02,
          radius: 6
        },
        {
          type: 'INNER_SHADOW',
          visible: true,
          blendMode: 'NORMAL',
          color: { r: 1, g: 1, b: 1, a: isDark ? 0.18 : 0.30 },
          offset: { x: 0, y: 1 },
          radius: 1,
          spread: 0
        },
        {
          type: 'DROP_SHADOW',
          visible: true,
          blendMode: 'NORMAL',
          color: { r: 0, g: 0.22, b: 0.12, a: 0.20 },
          offset: { x: 0, y: 5 },
          radius: 12,
          spread: -3,
          showShadowBehindNode: true
        }
      ];
      centerAction.setSharedPluginData('mm2', 'surface', 'tinted-liquid-glass');
      mutatedNodeIds.push(centerAction.id);
      centerActionIds.push(centerAction.id);
    }
  }

  return {
    mutatedNodeIds,
    navigationIds: bars.map(bar => bar.id),
    centerActionIds,
    boundVariableIds: [lightSurface.id, lightBorder.id, darkSurface.id, darkBorder.id]
  };
})();
