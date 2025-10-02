// chunkFile - split a File into chunks of given size and return array of {chunk, partNumber, start, end}
export function chunkFile(file, partSize) {
  const chunks = [];
  let offset = 0;
  let part = 1;
  while (offset < file.size) {
    const end = Math.min(offset + partSize, file.size);
    chunks.push({
      partNumber: part,
      chunk: file.slice(offset, end),
      start: offset,
      end,
      size: end - offset,
    });
    offset = end;
    part += 1;
  }
  return chunks;
}
