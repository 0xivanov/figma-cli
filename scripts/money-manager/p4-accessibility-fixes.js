(async () => {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const primitives = collections.find((item) => item.name === 'MM2 Primitives');
  const light = collections.find((item) => item.name === 'MM2 Color Light');
  if (!primitives || !light) throw new Error('MM2 color collections not found');

  const variables = await figma.variables.getLocalVariablesAsync();
  const byCollectionAndName = new Map(variables.map((item) => [`${item.variableCollectionId}:${item.name}`, item]));
  const primitive = (name) => byCollectionAndName.get(`${primitives.id}:${name}`);
  const lightVariable = (name) => byCollectionAndName.get(`${light.id}:${name}`);
  const lightMode = light.modes[0].modeId;
  const aliases = {
    'bg/brand': 'mint/700',
    'data/stocks': 'cobalt/600',
    'text/tertiary': 'neutral/600',
    'text/brand': 'mint/700',
    'text/positive': 'mint/700',
    'text/negative': 'coral/600',
  };
  for (const [semanticName, primitiveName] of Object.entries(aliases)) {
    const semantic = lightVariable(semanticName);
    const source = primitive(primitiveName);
    if (semantic && source) semantic.setValueForMode(lightMode, { type: 'VARIABLE_ALIAS', id: source.id });
  }

  const screenIds = ['8:142', '8:190', '8:251', '8:308', '8:344', '8:365', '8:409', '8:460', '8:515', '8:563', '8:624', '8:681', '8:702', '8:753'];
  let resizedText = 0;
  for (const id of screenIds) {
    const screen = await figma.getNodeByIdAsync(id);
    if (!screen || !('findAll' in screen)) continue;
    for (const text of screen.findAll((node) => node.type === 'TEXT')) {
      if (typeof text.fontSize === 'number' && text.fontSize < 12) {
        text.fontSize = 12;
        resizedText += 1;
      }
    }
  }

  const solid = (hex) => {
    const value = hex.replace('#', '');
    return { type: 'SOLID', color: { r: parseInt(value.slice(0, 2), 16) / 255, g: parseInt(value.slice(2, 4), 16) / 255, b: parseInt(value.slice(4, 6), 16) / 255 } };
  };
  const explicitFills = {
    '8:150': '#C8CDC7',
    '8:152': '#0B0B0A',
    '8:154': '#C8CDC7',
    '8:157': '#046B3B',
    '8:162': '#046B3B',
    '8:169': '#046B3B',
    '8:176': '#A9362B',
    '8:182': '#046B3B',
    '8:184': '#046B3B',
    '8:201': '#046B3B',
    '8:212': '#046B3B',
    '8:223': '#046B3B',
    '8:232': '#046B3B',
    '8:240': '#046B3B',
    '8:249': '#046B3B',
    '8:267': '#046B3B',
    '8:270': '#A9362B',
    '8:281': '#A9362B',
    '8:287': '#A9362B',
    '8:295': '#046B3B',
    '8:304': '#046B3B',
    '8:314': '#C8CDC7',
    '8:322': '#0B0B0A',
    '8:340': '#0B0B0A',
    '8:343': '#0B0B0A',
    '8:360': '#046B3B',
    '8:373': '#046B3B',
    '8:385': '#046B3B',
    '8:391': '#C8CDC7',
    '8:394': '#C8CDC7',
    '8:397': '#C8CDC7',
    '8:459': '#046B3B',
    '8:470': '#5C625E',
    '8:472': '#5C625E',
    '8:523': '#5C625E',
    '8:525': '#0B0B0A',
    '8:527': '#5C625E',
    '8:639': '#0B0B0A',
    '8:642': '#0B0B0A',
    '8:643': '#FFFFFF',
    '8:645': '#0B0B0A',
    '8:701': '#C8CDC7',
    '8:713': '#5C625E',
    '8:722': '#0B0B0A',
    '8:745': '#C8CDC7',
    '8:747': '#C8CDC7',
    '8:750': '#C8CDC7',
    '8:763': '#5C625E',
    '8:765': '#5C625E',
    '8:537': '#FFFFFF',
    '8:539': '#FFFFFF',
    '8:617': '#2B2F2C',
  };
  for (const [id, hex] of Object.entries(explicitFills)) {
    const node = await figma.getNodeByIdAsync(id);
    if (node && node.type === 'TEXT') node.fills = [solid(hex)];
  }

  console.log(JSON.stringify({ resizedText, aliasesUpdated: Object.keys(aliases).length }));
})();
