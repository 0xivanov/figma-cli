(async () => {
const page = figma.root.children.find(item => item.name === "00 Design System");
if (!page) throw new Error("Design System page not found");
await figma.setCurrentPageAsync(page);
await Promise.all([
  figma.loadFontAsync({ family: "Manrope", style: "SemiBold" }),
  figma.loadFontAsync({ family: "Roboto Mono", style: "SemiBold" })
]);
const mutated = [];
for (const text of page.findAll(node => node.type === "TEXT")) {
  const segments = text.getStyledTextSegments(["fontName"]);
  if (!segments.some(segment => segment.fontName.family === "Inter" && segment.fontName.style === "Semi Bold")) continue;
  text.fontName = text.characters === "+12.84%"
    ? { family: "Roboto Mono", style: "SemiBold" }
    : { family: "Manrope", style: "SemiBold" };
  mutated.push({ id: text.id, name: text.name, font: text.fontName });
}
return { mutatedNodeIds: mutated.map(item => item.id), count: mutated.length, nodes: mutated };
})()
