(async () => {
const runId = "money-manager-2-20260712";
const textDefinitions = [
  ["Display/Balance", "Manrope", "ExtraBold", 40, 44, -1.2],
  ["Display/Large", "Manrope", "Bold", 28, 34, -0.5],
  ["Heading/Large", "Manrope", "Bold", 22, 28, -0.2],
  ["Heading/Medium", "Manrope", "SemiBold", 18, 24, 0],
  ["Title/Medium", "Manrope", "SemiBold", 16, 22, 0],
  ["Body/Large", "Manrope", "Regular", 16, 24, 0],
  ["Body/Medium", "Manrope", "Regular", 14, 20, 0],
  ["Label/Large", "Manrope", "SemiBold", 14, 18, 0.1],
  ["Label/Medium", "Manrope", "SemiBold", 12, 16, 0.2],
  ["Caption", "Manrope", "Medium", 11, 14, 0.2],
  ["Data/Large", "Roboto Mono", "SemiBold", 24, 30, -0.5],
  ["Data/Medium", "Roboto Mono", "Medium", 14, 20, -0.2]
];
const requiredFonts = [...new Map(textDefinitions.map(item => [`${item[1]}-${item[2]}`, { family: item[1], style: item[2] }])).values()];
await Promise.all(requiredFonts.map(font => figma.loadFontAsync(font)));
const existingText = await figma.getLocalTextStylesAsync();
const textStyles = [];
for (const [name, family, style, size, lineHeight, letterSpacing] of textDefinitions) {
  let textStyle = existingText.find(item => item.name === name);
  if (!textStyle) textStyle = figma.createTextStyle();
  textStyle.name = name;
  textStyle.fontName = { family, style };
  textStyle.fontSize = size;
  textStyle.lineHeight = { unit: "PIXELS", value: lineHeight };
  textStyle.letterSpacing = { unit: "PIXELS", value: letterSpacing };
  textStyle.setSharedPluginData("dsb", "run_id", runId);
  textStyle.setSharedPluginData("dsb", "phase", "phase1");
  textStyle.setSharedPluginData("dsb", "key", `text-style/${name}`);
  textStyles.push({ id: textStyle.id, name, family, style, size, lineHeight });
}

const effectDefinitions = [
  ["Elevation/Soft", [{ type: "DROP_SHADOW", color: { r: 0.043, g: 0.043, b: 0.039, a: 0.06 }, offset: { x: 0, y: 2 }, radius: 8, spread: 0, visible: true, blendMode: "NORMAL" }]],
  ["Elevation/Card", [{ type: "DROP_SHADOW", color: { r: 0.043, g: 0.043, b: 0.039, a: 0.08 }, offset: { x: 0, y: 8 }, radius: 24, spread: -4, visible: true, blendMode: "NORMAL" }]],
  ["Elevation/Floating", [{ type: "DROP_SHADOW", color: { r: 0.043, g: 0.043, b: 0.039, a: 0.16 }, offset: { x: 0, y: 16 }, radius: 40, spread: -8, visible: true, blendMode: "NORMAL" }]]
];
const existingEffects = await figma.getLocalEffectStylesAsync();
const effectStyles = [];
for (const [name, effects] of effectDefinitions) {
  let effectStyle = existingEffects.find(item => item.name === name);
  if (!effectStyle) effectStyle = figma.createEffectStyle();
  effectStyle.name = name;
  effectStyle.effects = effects;
  effectStyle.setSharedPluginData("dsb", "run_id", runId);
  effectStyle.setSharedPluginData("dsb", "phase", "phase1");
  effectStyle.setSharedPluginData("dsb", "key", `effect-style/${name}`);
  effectStyles.push({ id: effectStyle.id, name, effectCount: effects.length });
}

return {
  createdStyleIds: [...textStyles, ...effectStyles].map(item => item.id),
  textStyles,
  effectStyles
};
})()
