(async () => {
  await Promise.all([
    figma.loadFontAsync({ family: 'Manrope', style: 'Regular' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'SemiBold' }),
    figma.loadFontAsync({ family: 'Manrope', style: 'Bold' }),
    figma.loadFontAsync({ family: 'Roboto Mono', style: 'Regular' }),
    figma.loadFontAsync({ family: 'Roboto Mono', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Roboto Mono', style: 'SemiBold' }),
    figma.loadFontAsync({ family: 'Roboto Mono', style: 'Bold' }),
  ]);
  const changed = [];
  const counts = {};
  for (const page of figma.root.children) {
    for (const text of page.findAll((node) => node.type === 'TEXT')) {
      const segments = text.getStyledTextSegments(['fontName']);
      for (const segment of segments) {
        const key = `${segment.fontName.family} / ${segment.fontName.style}`;
        counts[key] = (counts[key] || 0) + 1;
      }
      if (!segments.some((segment) => segment.fontName.family === 'Inter')) continue;
      const style = segments[0]?.fontName.style === 'Semi Bold' ? 'SemiBold' : segments[0]?.fontName.style || 'Regular';
      text.fontName = { family: 'Manrope', style };
      changed.push(text.id);
    }
  }
  console.log(JSON.stringify({ changed, counts }));
})();
