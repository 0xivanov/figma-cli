(async () => {
const runId = "money-manager-2-20260712";
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const primitiveCollection = collections.find(item => item.name === "MM2 Primitives");
const collection = collections.find(item => item.name === "MM2 Color Dark");
if (!primitiveCollection || !collection) throw new Error("Required color collections not found");
const modeId = collection.modes[0].modeId;
const all = await figma.variables.getLocalVariablesAsync();
const primitive = name => {
  const variable = all.find(item => item.variableCollectionId === primitiveCollection.id && item.name === name);
  if (!variable) throw new Error(`Missing primitive ${name}`);
  return variable;
};
const definitions = [
  ["bg/canvas", "neutral/950", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/surface", "neutral/900", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/elevated", "neutral/800", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/subtle", "neutral/800", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/inverted", "neutral/0", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/brand", "mint/500", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/brand-soft", "mint/700", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/info-soft", "cobalt/600", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/danger-soft", "coral/600", ["FRAME_FILL", "SHAPE_FILL"]],
  ["bg/warning-soft", "amber/500", ["FRAME_FILL", "SHAPE_FILL"]],
  ["text/primary", "neutral/0", ["TEXT_FILL"]],
  ["text/secondary", "neutral/200", ["TEXT_FILL"]],
  ["text/tertiary", "neutral/400", ["TEXT_FILL"]],
  ["text/inverse", "neutral/950", ["TEXT_FILL"]],
  ["text/brand", "mint/300", ["TEXT_FILL"]],
  ["text/positive", "mint/300", ["TEXT_FILL"]],
  ["text/negative", "coral/400", ["TEXT_FILL"]],
  ["border/default", "neutral/800", ["STROKE_COLOR"]],
  ["border/strong", "neutral/600", ["STROKE_COLOR"]],
  ["border/brand", "mint/500", ["STROKE_COLOR"]],
  ["icon/primary", "neutral/0", ["SHAPE_FILL", "STROKE_COLOR"]],
  ["icon/secondary", "neutral/200", ["SHAPE_FILL", "STROKE_COLOR"]],
  ["icon/inverse", "neutral/950", ["SHAPE_FILL", "STROKE_COLOR"]],
  ["data/cash", "mint/300", ["SHAPE_FILL", "STROKE_COLOR"]],
  ["data/stocks", "cobalt/400", ["SHAPE_FILL", "STROKE_COLOR"]],
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
  variable.setVariableCodeSyntax("ANDROID", `MM2DarkColors.${camel(name)}`);
  variable.setVariableCodeSyntax("iOS", `AppColor.Dark.${camel(name)}`);
  variable.setSharedPluginData("dsb", "run_id", runId);
  variable.setSharedPluginData("dsb", "phase", "phase1");
  variable.setSharedPluginData("dsb", "key", `semantic/dark/${name}`);
  created.push({ id: variable.id, name, target });
}
return { createdVariableIds: created.map(item => item.id), count: created.length, variables: created };
})()
