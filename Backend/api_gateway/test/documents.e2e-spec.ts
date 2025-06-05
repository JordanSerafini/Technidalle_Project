import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { of, throwError } from 'rxjs';
import { DocumentsModule } from '../src/documents/documents.module';

describe('DocumentsController (e2e)', () => {
  let app: INestApplication;
  const documentsService = { send: jest.fn() };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [DocumentsModule],
    })
      .overrideProvider('DOCUMENTS_SERVICE')
      .useValue(documentsService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('GET /documents returns documents', async () => {
    documentsService.send.mockReturnValue(of([{ id: 1 }]));
    await request(app.getHttpServer())
      .get('/documents')
      .query({ projectId: 1 })
      .expect(HttpStatus.OK)
      .expect([{ id: 1 }]);
  });

  it('POST /documents creates a document', async () => {
    const dto = {
      project_id: 1,
      type: 'devis',
      reference: 'REF',
      issue_date: new Date().toISOString(),
    };
    documentsService.send.mockReturnValue(of({ id: 1, ...dto }));
    await request(app.getHttpServer())
      .post('/documents')
      .send(dto)
      .expect(HttpStatus.CREATED)
      .expect({ id: 1, ...dto });
  });

  it('DELETE /documents/:id returns 200 when found', async () => {
    documentsService.send.mockReturnValue(of(true));
    await request(app.getHttpServer())
      .delete('/documents/1')
      .expect(HttpStatus.OK)
      .expect('true');
  });

  it('DELETE /documents/:id returns 404 when not found', async () => {
    documentsService.send.mockReturnValue(of(false));
    await request(app.getHttpServer()).delete('/documents/1').expect(HttpStatus.NOT_FOUND);
  });

  it('handles service errors', async () => {
    documentsService.send.mockReturnValue(throwError(() => new Error('fail')));
    await request(app.getHttpServer()).get('/documents').expect(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
