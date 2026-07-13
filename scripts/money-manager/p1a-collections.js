// figma-cli's file runner evaluates scripts as expressions, so async work is
// intentionally wrapped here instead of using the use_figma top-level form.
(async () => {
const runId = "money-manager-2-20260712";
const definitions = [
  { name: "MM2 Primitives", modes: ["Value"], key: "collection/primitives" },
  { name: "MM2 Color Light", modes: ["Light"], key: "collection/color-light" },
  { name: "MM2 Color Dark", modes: ["Dark"], key: "collection/color-dark" },
  { name: "MM2 Spacing", modes: ["Value"], key: "collection/spacing" },
  { name: "MM2 Radius & Size", modes: ["Value"], key: "collection/radius-size" },
  { name: "MM2 Typography", modes: ["Value"], key: "collection/typography" },
];

const existing = await figma.variables.getLocalVariableCollectionsAsync();
const abandonedColor = existing.find(item => item.name === "MM2 Color" && item.variableIds.length === 0);
if (abandonedColor) abandonedColor.remove();
const created = [];
for (const definition of definitions) {
  let collection = existing.find(item => item.name === definition.name);
  let status = "existing";
  if (!collection) {
    collection = figma.variables.createVariableCollection(definition.name);
    collection.renameMode(collection.modes[0].modeId, definition.modes[0]);
    for (const modeName of definition.modes.slice(1)) collection.addMode(modeName);
    collection.setSharedPluginData("dsb", "run_id", runId);
    collection.setSharedPluginData("dsb", "phase", "phase1");
    collection.setSharedPluginData("dsb", "key", definition.key);
    status = "created";
  }
  created.push({ id: collection.id, name: collection.name, modes: collection.modes, status });
}

return { createdCollectionIds: created.map(item => item.id), collections: created };
})()
