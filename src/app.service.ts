import { Injectable } from '@nestjs/common';

@Injectable() // Can be passed as dependence to another classes
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
