import { Injectable } from '@nestjs/common';
import { ApiResponse } from './app.controller';

@Injectable()
export class AppService {
  getCheck(): ApiResponse {
    return {
      status_code: 200,
      data: {
        status: 'success',
        message: 'API is working fine',
      },
    };
  }
}

