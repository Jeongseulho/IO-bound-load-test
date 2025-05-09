import * as dotenv from 'dotenv';
dotenv.config();

import { Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';

@Controller()
export class AppController {
  @Post('proxy')
  async proxy(@Res() res: Response) {
    try {
      const payload = {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant. This is a test environment. answer in korean or english or mixed.',
          },
          {
            role: 'user',
            content:
              '이 메시지는 테스트 중입니다. 5자 내의 무작위 텍스트를 생성해주세요.',
          },
        ],
        max_tokens: 5,
      };

      const start = Date.now();
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const elapsed = Date.now() - start;
      res.setHeader('External-Api-Time', elapsed.toString());
      res.json(response.data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
