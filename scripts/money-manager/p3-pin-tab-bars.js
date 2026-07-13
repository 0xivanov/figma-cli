(async () => {
const ids = ["8:142", "8:190"];
const mutated = [];
for (const id of ids) {
  const screen = await figma.getNodeByIdAsync(id);
  if (!screen || screen.type !== "FRAME") throw new Error(`Screen not found: ${id}`);
  const tabBar = screen.children[screen.children.length - 1];
  if (!tabBar || tabBar.type !== "FRAME") throw new Error(`Tab bar not found in ${screen.name}`);
  tabBar.layoutPositioning = "ABSOLUTE";
  tabBar.x = 16;
  tabBar.y = screen.height - tabBar.height - 16;
  mutated.push({ id: tabBar.id, screen: screen.name, x: tabBar.x, y: tabBar.y });
}
return { mutatedNodeIds: mutated.map(item => item.id), tabBars: mutated };
})()
