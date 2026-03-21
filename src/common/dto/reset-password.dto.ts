import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(10)
  token: string;

  /** Accept `newPassword` or `password` from the client (requires ValidationPipe transform: true). */
  @Transform(({ obj }: { obj: Record<string, unknown> }) => obj.newPassword ?? obj.password)
  @IsString({ message: 'password / newPassword must be a string' })
  @MinLength(8, { message: 'password / newPassword must be at least 8 characters' })
  newPassword: string;
}

