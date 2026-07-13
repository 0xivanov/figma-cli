(async () => {
const runId = "money-manager-2-20260712";
const collection = (await figma.variables.getLocalVariableCollectionsAsync()).find(item => item.name === "MM2 Primitives");
if (!collection) throw new Error("MM2 Primitives collection not found");
const modeId = collection.modes[0].modeId;
const palette = [
  ["neutral/0", "#FFFFFF"], ["neutral/25", "#FBFAF7"], ["neutral/50", "#F4F1EB"],
  ["neutral/100", "#EAE6DD"], ["neutral/200", "#D6D0C4"], ["neutral/400", "#938D82"],
  ["neutral/600", "#625D55"], ["neutral/800", "#2C2A27"], ["neutral/900", "#171715"],
  ["neutral/950", "#0B0B0A"], ["mint/100", "#D8FCE8"], ["mint/300", "#78F0B1"],
  ["mint/500", "#20D87A"], ["mint/600", "#0CB764"], ["mint/700", "#078B4B"],
  ["cobalt/100", "#DDE8FF"], ["cobalt/400", "#5D87FF"], ["cobalt/500", "#326BFF"],
  ["cobalt/600", "#2355DB"], ["coral/100", "#FFE1DD"], ["coral/400", "#FF8177"],
  ["coral/500", "#F05A4F"], ["coral/600", "#D9433B"], ["amber/100", "#FFF0CC"],
  ["amber/500", "#F5A524"], ["violet/100", "#EEE5FF"], ["violet/500", "#8B5CF6"]
];
const existing = await figma.variables.getLocalVariablesAsync();
const rgb = hex => {
  const value = hex.slice(1);
  return { r: parseInt(value.slice(0, 2), 16) / 255, g: parseInt(value.slice(2, 4), 16) / 255, b: parseInt(value.slice(4, 6), 16) / 255 };
};
const camel = name => name.replace(/\/(.)/g, (_, value) => value.toUpperCase());
const created = [];
for (const [name, value] of palette) {
  let variable = existing.find(item => item.variableCollectionId === collection.id && item.name === name);
  if (!variable) variable = figma.variables.createVariable(name, collection, "COLOR");
  variable.setValueForMode(modeId, rgb(value));
  variable.scopes = [];
  variable.setVariableCodeSyntax("WEB", `var(--mm2-${name.replace("/", "-")})`);
  variable.setVariableCodeSyntax("ANDROID", `MM2Colors.${camel(name)}`);
  variable.setVariableCodeSyntax("iOS", `AppColor.${camel(name)}`);
  variable.setSharedPluginData("dsb", "run_id", runId);
  variable.setSharedPluginData("dsb", "phase", "phase1");
  variable.setSharedPluginData("dsb", "key", `primitive/${name}`);
  created.push({ id: variable.id, name, value });
}
return { createdVariableIds: created.map(item => item.id), count: created.length, variables: created };
})()
