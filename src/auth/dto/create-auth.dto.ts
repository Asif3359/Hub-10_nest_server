import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateAuthDto {
    @IsEmail()
    @ApiProperty({
        description: 'The email of the user',
        example: 'test@example.com',
    })
    email: string;
    @IsString()
    @MinLength(8)
    @MaxLength(32)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    })
    @ApiProperty({
        description: 'The password of the user',
        example: 'Password123!',
    })
    password: string;
}
