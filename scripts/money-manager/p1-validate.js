(async () => {
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const variables = await figma.variables.getLocalVariablesAsync();
const ids = new Set(variables.map(item => item.id));
const brokenAliases = [];
const allScopeVariables = [];
const missingSyntax = [];
for (const variable of variables) {
  if (variable.scopes.includes("ALL_SCOPES")) allScopeVariables.push(variable.name);
  if (!variable.codeSyntax.WEB || !variable.codeSyntax.ANDROID || !variable.codeSyntax.iOS) missingSyntax.push(variable.name);
  for (const value of Object.values(variable.valuesByMode)) {
    if (value && typeof value === "object" && value.type === "VARIABLE_ALIAS" && !ids.has(value.id)) {
      brokenAliases.push({ variable: variable.name, target: value.id });
    }
  }
}
const collectionSummary = collections.map(collection => {
  const local = variables.filter(variable => variable.variableCollectionId === collection.id);
  return {
    id: collection.id,
    name: collection.name,
    modes: collection.modes.map(mode => mode.name),
    variableCount: local.length,
    scopedCount: local.filter(variable => variable.scopes.length > 0).length,
    aliasCount: local.filter(variable => Object.values(variable.valuesByMode).some(value => value && typeof value === "object" && value.type === "VARIABLE_ALIAS")).length
  };
});
const [textStyles, effectStyles] = await Promise.all([figma.getLocalTextStylesAsync(), figma.getLocalEffectStylesAsync()]);
return {
  collectionCount: collections.length,
  variableCount: variables.length,
  collections: collectionSummary,
  brokenAliases,
  allScopeVariables,
  missingSyntax,
  textStyles: textStyles.map(style => ({ name: style.name, family: style.fontName.family, fontStyle: style.fontName.style, size: style.fontSize })),
  effectStyles: effectStyles.map(style => ({ name: style.name, effects: style.effects.length })),
  valid: brokenAliases.length === 0 && allScopeVariables.length === 0 && missingSyntax.length === 0
};
})()
