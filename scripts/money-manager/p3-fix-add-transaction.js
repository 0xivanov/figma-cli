(async () => {
  const header = await figma.getNodeByIdAsync('8:461');
  const titleRow = await figma.getNodeByIdAsync('8:462');
  if (!header || !titleRow) throw new Error('Add transaction nodes not found');
  header.resize(390, 144);
  header.primaryAxisSizingMode = 'FIXED';
  titleRow.resize(350, 44);
  titleRow.primaryAxisSizingMode = 'FIXED';
  console.log(JSON.stringify({ header: [header.width, header.height], titleRow: [titleRow.width, titleRow.height] }));
})();
