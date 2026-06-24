const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const docCount = await prisma.knowledgeDocument.count();
    const chunkCount = await prisma.knowledgeChunk.count();
    console.log(`Documents in DB: ${docCount}`);
    console.log(`Chunks in DB: ${chunkCount}`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
