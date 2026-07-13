(async () => {
  const names = new Set(['bg/brand', 'data/stocks', 'text/tertiary', 'text/brand', 'text/positive', 'text/negative', 'text/inverse']);
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const output = [];
  for (const collection of collections.filter((item) => item.name.startsWith('MM2 Color'))) {
    for (const variableId of collection.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      if (!variable || !names.has(variable.name)) continue;
      const modeId = collection.modes[0].modeId;
      output.push({ collection: collection.name, name: variable.name, value: variable.valuesByMode[modeId] });
    }
  }
  console.log(JSON.stringify(output));
})();
