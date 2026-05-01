import { Controller, Get } from '@nestjs/common';
import * as appService_1 from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: appService_1.AppService) { }

  @Get()
  getHello(): ApiResponse {
    return this.appService.getCheck();
  }
}



export type ApiResponse = {
  status_code: number;
  data: {
    status: string;
    message: string;
  };
};