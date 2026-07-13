(async () => {
const runId = "money-manager-2-20260712";
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const primitiveCollection = collections.find(item => item.name === "MM2 Primitives");
const collection = collections.find(item => item.name === "MM2 Color Light");
if (!primitiveCollection || !collection) throw new Error("Required color collections not found");
const modeId = collection.modes[0].modeId;
const all = await figma.variables.getLocalVariablesAsync();
const primitive = name => {
  const variable = all.find(item => item.variableCollectionId === primitiveCollection.id && item.name === name);
  if (!variable) throw new Error(`Missing primitive ${name}`);
  return variable;
};
const definitions = [
  ["bg/canvas", "neutral/25", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/surface", "neutral/0", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/elevated", "neutral/0", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/subtle", "neutral/50", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/inverted", "neutral/950", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/brand", "mint/600", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/brand-soft", "mint/100", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/info-soft", "cobalt/100", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/danger-soft", "coral/100", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/warning-soft", "amber/100", ["FRAME_FILL", "SHAPE_FILL"]],
  ["text/primary", "neutral/950", ["TEXT_FILL"]],
  ["text/secondary", "neutral/600", ["TEXT_FILL"]],
  ["text/tertiary", "neutral/400", ["TEXT_FILL"]],
  ["text/inverse", "neutral/0", ["TEXT_FILL"]],
  ["text/brand", "mint/700", ["TEXT_FILL"]],
  ["text/positive", "mint/700", ["TEXT_FILL"]],
  ["text/negative", "coral/600", ["TEXT_FILL"]],
  ["border/default", "neutral/100", ["STROKE_COLOR"]],
  ["border/strong", "neutral/200", ["STROKE_COLOR"]],
  ["border/brand", "mint/600", ["STROKE_COLOR"]],
  ["icon/primary", "neutral/950", ["SHAPE_FILL", "STROKE_COLOR"]],
  ["icon/secondary", "neutral/600", ["SHAPE_FILL", "STROKE_COLOR"]],
  ["icon/inverse", "neutral/0", ["SHAPE_FILL", "STROKE_COLOR"]],
  ["data/cash", "mint/600", ["SHAPE_FILL", "STROKE_COLOR"]],
  ["data/stocks", "cobalt/500", ["SHAPE_FILL", "STROKE_COLOR"]],
  ["data/crypto", "amber/500", ["SHAPE_FILL", "STROKE_COLOR"]],
  ["data/alternative", "violet/500", ["SHAPE_FILL", "STROKE_COLOR"]]
];
const camel = name => name.replace(/\/(.)/g, (_, value) => value.toUpperCase());
const created = [];
for (const [name, target, scopes] of definitions) {
  let variable = all.find(item => item.variableCollectionId === collection.id && item.name === name);
  if (!variable) variable = figma.variables.createVariable(name, collection, "COLOR");
  variable.setValueForMode(modeId, figma.variables.createVariableAlias(primitive(target)));
  variable.scopes = scopes;
  variable.setVariableCodeSyntax("WEB", `var(--mm2-${name.replace("/", "-")})`);
  variable.setVariableCodeSyntax("ANDROID", `MM2LightColors.${camel(name)}`);
  variable.setVariableCodeSyntax("iOS", `AppColor.Light.${camel(name)}`);
  variable.setSharedPluginData("dsb", "run_id", runId);
  variable.setSharedPluginData("dsb", "phase", "phase1");
  variable.setSharedPluginData("dsb", "key", `semantic/light/${name}`);
  created.push({ id: variable.id, name, target });
}
return { createdVariableIds: created.map(item => item.id), count: created.length, variables: created };
})()
