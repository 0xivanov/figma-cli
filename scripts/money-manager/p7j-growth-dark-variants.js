(async () => {
  const RUN_ID = 'money-manager-growth-20260713';
  const PAGE_ID = '2:150';
  const GRID_ID = '31:1354';
  const page = await figma.getNodeByIdAsync(PAGE_ID);
  const grid = await figma.getNodeByIdAsync(GRID_ID);
  if (!page || page.type !== 'PAGE') throw new Error('Product Screens page not found');
  if (!grid || grid.type !== 'FRAME') throw new Error('Growth feature grid not found');
  await figma.setCurrentPageAsync(page);

  const [collections, variables] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync()
  ]);
  const light = collections.find(collection => collection.name === 'MM2 Color Light');
  const dark = collections.find(collection => collection.name === 'MM2 Color Dark');
  if (!light || !dark) throw new Error('Money Manager light and dark color collections are required');
  const lightVariables = variables.filter(variable => variable.variableCollectionId === light.id);
  const darkVariables = variables.filter(variable => variable.variableCollectionId === dark.id);
  const lightById = Object.fromEntries(lightVariables.map(variable => [variable.id, variable]));
  const darkByName = Object.fromEntries(darkVariables.map(variable => [variable.name, variable]));
  const darkFallbackHex = {
    'bg/canvas': '#0B0B0A', 'bg/surface': '#171715', 'bg/elevated': '#2C2A27',
    'bg/subtle': '#2C2A27', 'bg/inverted': '#FFFFFF', 'bg/brand': '#20D87A',
    'bg/brand-soft': '#078B4B', 'bg/info-soft': '#2355DB', 'bg/danger-soft': '#D9433B',
    'bg/warning-soft': '#F5A524', 'text/primary': '#FFFFFF', 'text/secondary': '#D6D0C4',
    'text/tertiary': '#938D82', 'text/inverse': '#0B0B0A', 'text/brand': '#78F0B1',
    'text/positive': '#78F0B1', 'text/negative': '#FF8177', 'border/default': '#2C2A27',
    'border/strong': '#625D55', 'border/brand': '#20D87A', 'icon/primary': '#FFFFFF',
    'icon/secondary': '#D6D0C4', 'icon/inverse': '#0B0B0A', 'data/cash': '#78F0B1',
    'data/stocks': '#5D87FF', 'data/crypto': '#F5A524', 'data/alternative': '#8B5CF6'
  };
  const rgb = hex => ({
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255
  });
  const darkPaint = (name, opacity = 1) => {
    const variable = darkByName[name];
    const fallback = darkFallbackHex[name];
    if (!variable || !fallback) throw new Error(`Missing dark paint: ${name}`);
    return figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: rgb(fallback), opacity },
      'color',
      variable
    );
  };

  function remapPaints(paints) {
    if (paints === figma.mixed) return paints;
    return paints.map(paint => {
      const aliasId = paint.boundVariables?.color?.id;
      const lightVariable = aliasId ? lightById[aliasId] : null;
      if (!lightVariable) return paint;
      const darkVariable = darkByName[lightVariable.name];
      const fallback = darkFallbackHex[lightVariable.name];
      if (!darkVariable || !fallback) throw new Error(`Missing dark semantic mapping: ${lightVariable.name}`);
      const base = {
        type: 'SOLID',
        color: rgb(fallback),
        opacity: paint.opacity ?? 1,
        visible: paint.visible ?? true,
        blendMode: paint.blendMode || 'NORMAL'
      };
      return figma.variables.setBoundVariableForPaint(base, 'color', darkVariable);
    });
  }

  function rebindTree(node, errors) {
    if ('fills' in node && node.fills !== figma.mixed) {
      try {
        node.fills = remapPaints(node.fills);
      } catch (error) {
        errors.push({ id: node.id, name: node.name, property: 'fills', message: String(error) });
      }
    }
    if ('strokes' in node && node.strokes !== figma.mixed) {
      try {
        node.strokes = remapPaints(node.strokes);
      } catch (error) {
        errors.push({ id: node.id, name: node.name, property: 'strokes', message: String(error) });
      }
    }
    if ('children' in node) {
      for (const child of node.children) rebindTree(child, errors);
    }
  }

  function copyFrameContents(source, target) {
    for (const child of [...target.children]) child.remove();
    target.resize(source.width, source.height);
    target.layoutMode = source.layoutMode;
    target.primaryAxisSizingMode = source.primaryAxisSizingMode;
    target.counterAxisSizingMode = source.counterAxisSizingMode;
    target.primaryAxisAlignItems = source.primaryAxisAlignItems;
    target.counterAxisAlignItems = source.counterAxisAlignItems;
    target.itemSpacing = source.itemSpacing;
    target.paddingTop = source.paddingTop;
    target.paddingRight = source.paddingRight;
    target.paddingBottom = source.paddingBottom;
    target.paddingLeft = source.paddingLeft;
    target.clipsContent = source.clipsContent;
    target.cornerRadius = source.cornerRadius;
    target.fills = source.fills === figma.mixed ? [] : source.fills;
    target.strokes = source.strokes === figma.mixed ? [] : source.strokes;
    target.effects = source.effects;
    for (const child of source.children) target.appendChild(child.clone());
  }

  const featureKeys = [
    'scheduled-activity', 'new-schedule', 'schedule-detail', 'budgets', 'budget-editor',
    'invest-portfolio', 'record-trade', 'investment-plan', 'notification-settings', 'audit-export'
  ];
  const created = [];
  const updated = [];
  const errors = [];
  for (const featureKey of featureKeys) {
    const lightKey = `screen/growth/${featureKey}`;
    const darkKey = `screen/growth-dark/${featureKey}`;
    const source = page.findAllWithCriteria({ sharedPluginData: { namespace: 'dsb', keys: ['key'] } })
      .find(node => node.getSharedPluginData('dsb', 'key') === lightKey);
    if (!source || source.type !== 'FRAME') throw new Error(`Light screen not found: ${lightKey}`);
    let target = page.findAllWithCriteria({ sharedPluginData: { namespace: 'dsb', keys: ['key'] } })
      .find(node => node.getSharedPluginData('dsb', 'key') === darkKey);
    if (target && target.type !== 'FRAME') throw new Error(`Dark screen key is not a frame: ${darkKey}`);
    if (!target) {
      target = source.clone();
      grid.appendChild(target);
      created.push(target.id);
    } else {
      copyFrameContents(source, target);
      updated.push(target.id);
    }
    target.name = source.name.replace('· Light', '· Dark');
    target.setSharedPluginData('dsb', 'run_id', RUN_ID);
    target.setSharedPluginData('dsb', 'phase', 'phase3');
    target.setSharedPluginData('dsb', 'key', darkKey);
    rebindTree(target, errors);
    if (featureKey === 'scheduled-activity' || featureKey === 'schedule-detail') {
      const scheduleRows = target.findAll(node => node.type === 'INSTANCE' && node.name.endsWith('schedule'));
      for (const scheduleRow of scheduleRows) {
        const badge = scheduleRow.findOne(node => node.type === 'FRAME' && node.name === 'badge');
        if (badge) badge.fills = [darkPaint('bg/elevated')];
      }
      const dueSchedule = target.findOne(node => node.name === 'Rent schedule');
      if (dueSchedule && 'fills' in dueSchedule && 'strokes' in dueSchedule) {
        dueSchedule.fills = [darkPaint('bg/surface')];
        dueSchedule.strokes = [darkPaint('data/crypto')];
        dueSchedule.strokeWeight = 1;
      }
    }
    if (featureKey === 'notification-settings') {
      const refreshNote = target.findOne(node => node.name === 'Bank refresh note');
      if (refreshNote && 'fills' in refreshNote && 'strokes' in refreshNote) {
        refreshNote.fills = [darkPaint('bg/elevated')];
        refreshNote.strokes = [darkPaint('data/stocks')];
        refreshNote.strokeWeight = 1;
      }
      const refreshTitle = target.findOne(node => node.name === 'Refresh title');
      if (refreshTitle && 'fills' in refreshTitle) refreshTitle.fills = [darkPaint('text/primary')];
    }
    if (featureKey === 'record-trade') {
      const safetyNote = target.findOne(node => node.name === 'Trade safety note');
      if (safetyNote && 'fills' in safetyNote && 'strokes' in safetyNote) {
        safetyNote.fills = [darkPaint('bg/elevated')];
        safetyNote.strokes = [darkPaint('data/crypto')];
        safetyNote.strokeWeight = 1;
      }
    }
    if (featureKey === 'invest-portfolio') {
      for (const holdingName of ['Bitcoin holding', 'Apple holding']) {
        const holding = target.findOne(node => node.name === holdingName);
        const badge = holding?.findOne(node => node.type === 'FRAME' && node.width === 42 && node.height === 42);
        if (badge) badge.fills = [darkPaint('bg/elevated')];
        if (holdingName === 'Bitcoin holding') {
          const badgeLabel = holding?.findOne(node => node.type === 'TEXT');
          if (badgeLabel) badgeLabel.fills = [darkPaint('data/crypto')];
        } else {
          const badgeLabel = holding?.findOne(node => node.type === 'TEXT');
          if (badgeLabel) badgeLabel.fills = [darkPaint('text/primary')];
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Dark variant rebinding failed: ${JSON.stringify(errors.slice(0, 10))}`);
  }
  return {
    createdNodeIds: created,
    updatedNodeIds: updated,
    darkScreens: featureKeys.map(featureKey => `screen/growth-dark/${featureKey}`)
  };
})();
