import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { AnalyzeAgentService } from './analyze_agent.service';

class AnalyzeQuestionDto {
  question: string;
}

@Controller('analyze')
export class AnalyzeAgentController {
  constructor(private readonly analyzeAgentService: AnalyzeAgentService) {}

  @Post('question')
  async analyzeQuestion(@Body() analyzeQuestionDto: AnalyzeQuestionDto) {
    try {
      if (
        !analyzeQuestionDto.question ||
        analyzeQuestionDto.question.trim() === ''
      ) {
        throw new HttpException(
          'La question ne peut pas être vide',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.analyzeAgentService.analyzeQuestion(
        analyzeQuestionDto.question,
      );
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Une erreur est survenue lors de l'analyse de la question",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
