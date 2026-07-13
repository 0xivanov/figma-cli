(async () => {
  const rows = [
    { y: 0, ids: ['8:142', '8:190', '8:251', '8:308', '8:344', '8:365', '8:409', '8:460'] },
    { y: 1044, ids: ['8:515', '8:563', '8:624', '8:681', '8:702', '8:753'] },
  ];
  const moved = [];
  for (const row of rows) {
    for (let index = 0; index < row.ids.length; index += 1) {
      const node = await figma.getNodeByIdAsync(row.ids[index]);
      if (!node || !('x' in node)) continue;
      node.x = index * 490;
      node.y = row.y;
      moved.push({ id: node.id, name: node.name, x: node.x, y: node.y });
    }
  }
  console.log(JSON.stringify(moved));
})();
