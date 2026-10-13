import { ApiProperty } from '@nestjs/swagger';

export class UploadRulesDto {
  @ApiProperty({ example: 20971520 })
  maxUploadBytes: number;

  @ApiProperty({ type: [String], example: ['pdf', 'docx', 'xlsx', 'png'] })
  allowedExtensions: string[];
}
