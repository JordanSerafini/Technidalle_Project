import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('API-Gateway');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    
    this.logger.log(`🚀 [${method}] ${originalUrl} - IP: ${ip} - User-Agent: ${userAgent}`);
    
    const start = Date.now();
    
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      
      const statusEmoji = statusCode >= 400 ? '❌' : '✅';
      this.logger.log(`${statusEmoji} [${method}] ${originalUrl} - ${statusCode} - ${duration}ms`);
    });

    next();
  }
} 