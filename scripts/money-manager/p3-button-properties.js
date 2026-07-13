(async () => {
const runId = "money-manager-2-20260712";
const componentSet = await figma.getNodeByIdAsync("2:372");
if (!componentSet || componentSet.type !== "COMPONENT_SET") throw new Error("Button component set not found");
await figma.loadFontAsync({ family: "Manrope", style: "Bold" });
const existingKey = Object.keys(componentSet.componentPropertyDefinitions).find(key => key.startsWith("Label"));
const labelKey = existingKey || componentSet.addComponentProperty("Label", "TEXT", "Button");
const mutated = [componentSet.id];
componentSet.description = "Primary mobile action component. Minimum height 52px with semantic color bindings.";
componentSet.setSharedPluginData("dsb", "run_id", runId);
componentSet.setSharedPluginData("dsb", "phase", "phase3");
componentSet.setSharedPluginData("dsb", "key", "componentset/button");
for (const variant of componentSet.children) {
  const label = variant.findOne(node => node.type === "TEXT");
  if (!label) continue;
  label.fontName = { family: "Manrope", style: "Bold" };
  label.characters = "Button";
  label.name = "Label";
  label.componentPropertyReferences = { characters: labelKey };
  variant.setSharedPluginData("dsb", "run_id", runId);
  variant.setSharedPluginData("dsb", "phase", "phase3");
  variant.setSharedPluginData("dsb", "key", `component/button/${variant.name}`);
  mutated.push(variant.id, label.id);
}
return { mutatedNodeIds: mutated, componentSetId: componentSet.id, labelKey, variants: componentSet.children.map(item => item.name) };
})()
