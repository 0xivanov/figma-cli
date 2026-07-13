(async () => {
const runId = "money-manager-2-20260712";
const collection = (await figma.variables.getLocalVariableCollectionsAsync()).find(item => item.name === "MM2 Typography");
if (!collection) throw new Error("MM2 Typography collection not found");
const modeId = collection.modes[0].modeId;
const all = await figma.variables.getLocalVariablesAsync();
const definitions = [
  ["family/brand", "STRING", "Manrope", ["FONT_FAMILY"]],
  ["family/data", "STRING", "Roboto Mono", ["FONT_FAMILY"]],
  ["style/regular", "STRING", "Regular", ["FONT_STYLE"]],
  ["style/medium", "STRING", "Medium", ["FONT_STYLE"]],
  ["style/semibold", "STRING", "SemiBold", ["FONT_STYLE"]],
  ["style/bold", "STRING", "Bold", ["FONT_STYLE"]],
  ["size/caption", "FLOAT", 11, ["FONT_SIZE"]], ["size/label", "FLOAT", 12, ["FONT_SIZE"]],
  ["size/body", "FLOAT", 14, ["FONT_SIZE"]], ["size/body-lg", "FLOAT", 16, ["FONT_SIZE"]],
  ["size/title", "FLOAT", 18, ["FONT_SIZE"]], ["size/heading", "FLOAT", 22, ["FONT_SIZE"]],
  ["size/display", "FLOAT", 28, ["FONT_SIZE"]], ["size/balance", "FLOAT", 40, ["FONT_SIZE"]],
  ["line/caption", "FLOAT", 14, ["LINE_HEIGHT"]], ["line/label", "FLOAT", 16, ["LINE_HEIGHT"]],
  ["line/body", "FLOAT", 20, ["LINE_HEIGHT"]], ["line/body-lg", "FLOAT", 24, ["LINE_HEIGHT"]],
  ["line/title", "FLOAT", 24, ["LINE_HEIGHT"]], ["line/heading", "FLOAT", 28, ["LINE_HEIGHT"]],
  ["line/display", "FLOAT", 34, ["LINE_HEIGHT"]], ["line/balance", "FLOAT", 44, ["LINE_HEIGHT"]]
];
const camel = name => name.replace(/\/(.)/g, (_, value) => value.toUpperCase()).replace(/-(.)/g, (_, value) => value.toUpperCase());
const created = [];
for (const [name, type, value, scopes] of definitions) {
  let variable = all.find(item => item.variableCollectionId === collection.id && item.name === name);
  if (!variable) variable = figma.variables.createVariable(name, collection, type);
  variable.setValueForMode(modeId, value);
  variable.scopes = scopes;
  variable.setVariableCodeSyntax("WEB", `var(--mm2-${name.replace(/[\/]/g, "-")})`);
  variable.setVariableCodeSyntax("ANDROID", `MM2Type.${camel(name)}`);
  variable.setVariableCodeSyntax("iOS", `AppType.${camel(name)}`);
  variable.setSharedPluginData("dsb", "run_id", runId);
  variable.setSharedPluginData("dsb", "phase", "phase1");
  variable.setSharedPluginData("dsb", "key", `typography/${name}`);
  created.push({ id: variable.id, name, value });
}
return { createdVariableIds: created.map(item => item.id), count: created.length, variables: created };
})()
