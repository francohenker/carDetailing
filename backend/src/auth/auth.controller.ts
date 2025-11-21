import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // This will redirect to Google OAuth
    return this.authService.googleLogin();
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.googleLoginCallback(req);
    // Redirect to frontend with token in URL
    return res.redirect(result.url);
  }
}
