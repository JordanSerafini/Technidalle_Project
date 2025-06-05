import EBPclient from '../clients/ebpClient';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncDocuments() {
  const deals = await EBPclient.query('SELECT * FROM deals');

  for (const deal of deals.recordset) {
    const documents = await EBPclient.query(
      `SELECT * FROM documents WHERE dealId = ${deal.Id}`,
    );

    const project = await prisma.projects.findFirst({
      where: { externalId: deal.Id },
    });

    if (!project) continue;

    // Iterate over each document instead of only the first one
    for (const doc of documents.recordset) {
      await prisma.documents.create({
        data: {
          title: doc.name,
          projectId: project.id,
          url: doc.url,
          documentId: doc.id,
        },
      });
    }
  }
}

syncDocuments()
  .catch((err) => {
    console.error('Sync failed', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
