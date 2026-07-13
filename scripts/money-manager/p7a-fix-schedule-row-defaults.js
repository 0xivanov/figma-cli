(async () => {
  const PAGE_ID = '2:149';
  const page = await figma.getNodeByIdAsync(PAGE_ID);
  if (!page || page.type !== 'PAGE') throw new Error('Components page not found');
  await figma.setCurrentPageAsync(page);
  await Promise.all([
    figma.loadFontAsync({ family: 'Manrope', style: 'SemiBold' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Roboto Mono', style: 'SemiBold' })
  ]);

  const set = page.findOne(node => node.type === 'COMPONENT_SET' && node.name === 'Schedule Row');
  if (!set || set.type !== 'COMPONENT_SET') throw new Error('Schedule Row component set not found');
  const definitions = set.componentPropertyDefinitions;
  const keys = {
    title: Object.keys(definitions).find(key => key.startsWith('Title#')),
    detail: Object.keys(definitions).find(key => key.startsWith('Detail#')),
    amount: Object.keys(definitions).find(key => key.startsWith('Amount#')),
    badge: Object.keys(definitions).find(key => key.startsWith('Badge#'))
  };
  if (Object.values(keys).some(key => !key)) throw new Error('Schedule Row text properties are incomplete');

  set.editComponentProperty(keys.title, { defaultValue: 'Scheduled item' });
  set.editComponentProperty(keys.detail, { defaultValue: 'Monthly schedule' });
  set.editComponentProperty(keys.amount, { defaultValue: '€0.00' });
  set.editComponentProperty(keys.badge, { defaultValue: 'S' });

  const mutatedNodeIds = [set.id];
  for (const variant of set.children) {
    const title = variant.findOne(node => node.name === 'title');
    const detail = variant.findOne(node => node.name === 'detail');
    const amount = variant.findOne(node => node.name === 'amount');
    const badge = variant.findOne(node => node.name === 'badge-label');
    title.characters = 'Scheduled item';
    detail.characters = 'Monthly schedule';
    amount.characters = '€0.00';
    badge.characters = 'S';
    mutatedNodeIds.push(title.id, detail.id, amount.id, badge.id);
  }
  return { mutatedNodeIds, componentSetId: set.id };
})();
