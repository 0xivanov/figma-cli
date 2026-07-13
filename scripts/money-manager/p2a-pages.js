(async () => {
const runId = "money-manager-2-20260712";
const definitions = [
  ["00 Design System", "page/design-system"],
  ["10 Components", "page/components"],
  ["20 Product Screens", "page/product-screens"]
];
const pages = [...figma.root.children];
const created = [];
for (let index = 0; index < definitions.length; index++) {
  const [name, key] = definitions[index];
  const page = pages[index];
  if (!page) throw new Error("Expected three Starter-plan pages");
  page.name = name;
  page.setSharedPluginData("dsb", "run_id", runId);
  page.setSharedPluginData("dsb", "phase", "phase2");
  page.setSharedPluginData("dsb", "key", key);
  created.push({ id: page.id, name: page.name, key });
}
const cover = figma.root.children.find(item => item.name === "00 Design System");
await figma.setCurrentPageAsync(cover);
return { createdPageIds: created.map(item => item.id), pages: created, currentPage: cover.name };
})()
