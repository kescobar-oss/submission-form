import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { TokenPayload } from '../auth/auth.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { RequestsService } from './requests.service.js';

// The controller is the API's reception desk: it maps a URL + method to a function,
// reads what it needs from the request, and hands the real work to the service.
// 'requests' is the URL prefix, so every route in this class starts with /requests.
// @UseGuards on the class protects every route in it: first "are you logged in?"
// (JwtAuthGuard, 401), then "is your role allowed?" (RolesGuard, 403). Order matters.
@Controller('requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  // POST /requests: any logged-in user. Nest replies 201 Created for POST by default.
  // @Body() gives us the JSON body; typing it as CreateRequestDto tells the
  // ValidationPipe which rules to check before this function runs.
  @Post()
  create(@Body() body: CreateRequestDto, @CurrentUser() user: TokenPayload) {
    return this.requestsService.create(body, { id: user.sub, name: user.name, email: user.email });
  }

  // GET /requests: everyone's requests, including their personal data, so staff only.
  @Get()
  @Roles('ADMIN', 'DEVELOPER')
  findAll() {
    return this.requestsService.findAll();
  }

  // GET /requests/mine: any logged-in user, but only ever their own requests.
  @Get('mine')
  findMine(@CurrentUser() user: TokenPayload) {
    return this.requestsService.findMine(user.sub);
  }
}
