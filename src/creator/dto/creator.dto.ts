import { plainToInstance, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { IsKebabCase } from 'src/decorators/IsKebabCase';
import { CreatorStatsDto, toCreatorStatsDto } from './creator-stats.dto';
import { CreatorStats } from 'src/comic/dto/types';
import { Creator, Genre, Role } from '@prisma/client';
import { getPublicUrl } from 'src/aws/s3client';
import { IsOptionalUrl } from 'src/decorators/IsOptionalUrl';
import { UserCreatorMyStatsDto } from 'src/creator/dto/types';
import { UserCreatorStatsDto } from './user-creator.dto';
import { IsSolanaAddress } from 'src/decorators/IsSolanaAddress';
import { IsOptionalString } from 'src/decorators/IsOptionalString';
import { PartialGenreDto } from 'src/genre/dto/partial-genre.dto';
import { ifDefined } from 'src/utils/lodash';
import { ApiProperty } from '@nestjs/swagger';

export class CreatorDto {
  @IsPositive()
  id: number;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MaxLength(54)
  name: string;

  @IsEnum(Role)
  @ApiProperty({ enum: Role })
  role: Role;

  @IsNotEmpty()
  @IsKebabCase()
  slug: string;

  @IsBoolean()
  isVerified: boolean;

  @IsUrl()
  avatar: string;

  @IsUrl()
  banner: string;

  @IsUrl()
  logo: string;

  @IsString()
  @MaxLength(512)
  description: string;

  @IsString()
  @MaxLength(128)
  flavorText: string;

  @IsSolanaAddress()
  @IsOptionalString()
  tippingAddress: string;

  @IsOptionalUrl()
  website: string;

  @IsOptionalUrl()
  twitter: string;

  @IsOptionalUrl()
  instagram: string;

  @IsOptionalUrl()
  linktree: string;

  @IsOptional()
  @Type(() => CreatorStatsDto)
  stats?: CreatorStatsDto;

  @IsOptional()
  @Type(() => UserCreatorStatsDto)
  myStats?: UserCreatorStatsDto;

  @IsArray()
  @Type(() => PartialGenreDto)
  genres?: PartialGenreDto[];
}

export type CreatorInput = Creator & {
  stats?: CreatorStats;
  myStats?: UserCreatorMyStatsDto;
  genres?: Genre[];
};

export function toCreatorDto(creator: CreatorInput) {
  const plainCreatorDto: CreatorDto = {
    id: creator.id,
    email: creator.email,
    name: creator.name,
    role: creator.role,
    slug: creator.slug,
    isVerified: !!creator.verifiedAt,
    avatar: getPublicUrl(creator.avatar),
    banner: getPublicUrl(creator.banner),
    logo: getPublicUrl(creator.logo),
    description: creator.description,
    flavorText: creator.flavorText,
    tippingAddress: creator.tippingAddress,
    website: creator.website,
    twitter: creator.twitter,
    instagram: creator.instagram,
    linktree: creator.linktree,
    stats: ifDefined(creator.stats, toCreatorStatsDto),
    myStats: creator.myStats
      ? { isFollowing: creator.myStats.isFollowing }
      : undefined,
  };

  const creatorDto = plainToInstance(CreatorDto, plainCreatorDto);
  return creatorDto;
}

export const toCreatorDtoArray = (creators: CreatorInput[]) => {
  return creators.map(toCreatorDto);
};
