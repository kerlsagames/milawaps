const MAX_EDGE = 720;
const MAX_BYTES = 12_000_000;

export async function compressPrizeImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a picture file.");
  if (file.size > MAX_BYTES) throw new Error("That picture is too big. Try one under 12 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("This browser could not read that picture.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const data = canvas.toDataURL("image/jpeg", 0.82);
  if (!data.startsWith("data:image/")) throw new Error("This browser could not read that picture.");
  return data;
}
