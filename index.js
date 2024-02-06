import 'dotenv/config.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import Lens from 'chrome-lens-ocr';
import PQueue from 'p-queue';
import pino from 'pino';
import fg from 'fast-glob';

const IMAGE_DIRECTORY = process.env.IMAGE_DIRECTORY;
const OUTPUT_DIRECTORY = process.env.OUTPUT_DIRECTORY;
const NUM_CONCURRENCY = parseInt(process.env.NUM_CONCURRENCY);

if (typeof IMAGE_DIRECTORY !== 'string') {
  throw new Error("IMAGE_DIRECTORY required");
}

if (typeof OUTPUT_DIRECTORY !== 'string') {
  throw new Error("OUTPUT_DIRECTORY required");
}

if (typeof NUM_CONCURRENCY !== 'number') {
  throw new Error("NUM_CONCURRENCY required");
}

await fs.mkdir(OUTPUT_DIRECTORY, {
  recursive: true
});

const logger = pino();

const lens = new Lens();
const queue = new PQueue({
  concurrency: NUM_CONCURRENCY
});

for await (const file of fg.stream(IMAGE_DIRECTORY)) {

  const p = path.parse(file);
  const jsonFile = path.join(OUTPUT_DIRECTORY, p.name + ".json");

  if (await fileExists(jsonFile)) {
    continue;
  }

  queue.add(async () => {
    try {
      const result = await lens.scanByFile(file);
      if (!result || !Array.isArray(result.text_segments)) {
        return;
      }
      await fs.writeFile(jsonFile, JSON.stringify(result, null, 2), 'utf8');
      logger.info(`[${p.base}] segments=[${result.text_segments.length}] file=[${jsonFile}]`);
    } catch (e) {
      logger.error(e);
    }
  });

  await queue.onSizeLessThan(queue.concurrency);
}

async function fileExists(file) {
  try {
    await fs.stat(file);
    return true
  } catch (ignored) { }
  return false
}