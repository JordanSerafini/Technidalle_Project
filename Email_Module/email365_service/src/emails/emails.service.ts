import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  constructor(private readonly httpService: HttpService) {}
}
