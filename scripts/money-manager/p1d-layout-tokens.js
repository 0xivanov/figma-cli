(async () => {
const runId = "money-manager-2-20260712";
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const spacingCollection = collections.find(item => item.name === "MM2 Spacing");
const sizeCollection = collections.find(item => item.name === "MM2 Radius & Size");
if (!spacingCollection || !sizeCollection) throw new Error("Layout token collections not found");
const all = await figma.variables.getLocalVariablesAsync();
const definitions = [
  [spacingCollection, "space/xs", 4, ["GAP"]], [spacingCollection, "space/sm", 8, ["GAP"]],
  [spacingCollection, "space/md", 12, ["GAP"]], [spacingCollection, "space/lg", 16, ["GAP"]],
  [spacingCollection, "space/xl", 20, ["GAP"]], [spacingCollection, "space/2xl", 24, ["GAP"]],
  [spacingCollection, "space/3xl", 32, ["GAP"]], [spacingCollection, "space/4xl", 40, ["GAP"]],
  [spacingCollection, "space/5xl", 48, ["GAP"]], [spacingCollection, "space/6xl", 64, ["GAP"]],
  [sizeCollection, "radius/sm", 8, ["CORNER_RADIUS"]], [sizeCollection, "radius/md", 12, ["CORNER_RADIUS"]],
  [sizeCollection, "radius/lg", 16, ["CORNER_RADIUS"]], [sizeCollection, "radius/xl", 20, ["CORNER_RADIUS"]],
  [sizeCollection, "radius/2xl", 24, ["CORNER_RADIUS"]], [sizeCollection, "radius/3xl", 32, ["CORNER_RADIUS"]],
  [sizeCollection, "radius/full", 999, ["CORNER_RADIUS"]], [sizeCollection, "size/control", 48, ["WIDTH_HEIGHT"]],
  [sizeCollection, "size/touch-min", 44, ["WIDTH_HEIGHT"]], [sizeCollection, "size/icon", 20, ["WIDTH_HEIGHT"]],
  [sizeCollection, "size/icon-lg", 24, ["WIDTH_HEIGHT"]], [sizeCollection, "stroke/default", 1, ["STROKE_FLOAT"]]
];
const camel = name => name.replace(/\/(.)/g, (_, value) => value.toUpperCase()).replace(/-(.)/g, (_, value) => value.toUpperCase());
const created = [];
for (const [collection, name, value, scopes] of definitions) {
  const modeId = collection.modes[0].modeId;
  let variable = all.find(item => item.variableCollectionId === collection.id && item.name === name);
  if (!variable) variable = figma.variables.createVariable(name, collection, "FLOAT");
  variable.setValueForMode(modeId, value);
  variable.scopes = scopes;
  variable.setVariableCodeSyntax("WEB", `var(--mm2-${name.replace(/[\/]/g, "-")})`);
  variable.setVariableCodeSyntax("ANDROID", `MM2Tokens.${camel(name)}`);
  variable.setVariableCodeSyntax("iOS", `AppMetric.${camel(name)}`);
  variable.setSharedPluginData("dsb", "run_id", runId);
  variable.setSharedPluginData("dsb", "phase", "phase1");
  variable.setSharedPluginData("dsb", "key", `layout/${name}`);
  created.push({ id: variable.id, name, value });
}
return { createdVariableIds: created.map(item => item.id), count: created.length, variables: created };
})()
