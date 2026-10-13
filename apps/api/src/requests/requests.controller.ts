import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { RequestsService } from './requests.service.js';

// The controller is the API's reception desk: it maps a URL + method to a function,
// reads what it needs from the request, and hands the real work to the service.
// 'requests' is the URL prefix, so every route in this class starts with /requests.
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  // POST /requests. Nest replies 201 Created for POST by default, which is what we want.
  // @Body() gives us the JSON body; typing it as CreateRequestDto tells the
  // ValidationPipe which rules to check before this function runs.
  @Post()
  create(@Body() body: CreateRequestDto) {
    return this.requestsService.create(body);
  }

  // GET /requests. Returns everyone's personal data, so Step 5 puts AdminKeyGuard here.
  @Get()
  findAll() {
    return this.requestsService.findAll();
  }
}
