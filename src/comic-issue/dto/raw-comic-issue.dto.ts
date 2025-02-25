import { plainToInstance, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
} from 'class-validator';
import { getPublicUrl } from 'src/aws/s3client';
import { IsKebabCase } from 'src/decorators/IsKebabCase';
import { ApiProperty } from '@nestjs/swagger';
import {
  ComicIssue,
  ComicIssueCollaborator,
  StatelessCover,
  StatefulCover,
  Genre,
  RoyaltyWallet,
  Comic,
  Creator,
  CollectibleComicCollection,
} from '@prisma/client';
import {
  ComicIssueCollaboratorDto,
  toComicIssueCollaboratorDtoArray,
} from './comic-issue-collaborator.dto';
import {
  StatelessCoverDto,
  toStatelessCoverDtoArray,
} from './covers/stateless-cover.dto';
import {
  StatefulCoverDto,
  toStatefulCoverDtoArray,
} from './covers/stateful-cover.dto';
import { findDefaultCover } from 'src/utils/comic-issue';
import {
  RoyaltyWalletDto,
  toRoyaltyWalletDtoArray,
} from './royalty-wallet.dto';
import { RawComicIssueStats } from 'src/comic/dto/types';
import { RawComicIssueStatsDto } from './raw-comic-issue-stats.dto';
import {
  PartialGenreDto,
  toPartialGenreDtoArray,
} from 'src/genre/dto/partial-genre.dto';
import { With } from 'src/types/shared';
import { toComicIssueStatsDto } from './comic-issue-stats.dto';
import { ifDefined } from 'src/utils/lodash';

export class RawComicIssueDto {
  @IsPositive()
  id: number;

  @IsPositive()
  number: number;

  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  @IsKebabCase()
  slug: string;

  @IsString()
  description: string;

  @IsString()
  flavorText: string;

  @IsUrl()
  cover: string;

  @IsUrl()
  pdf: string;

  @IsDateString()
  releaseDate: string;

  @IsBoolean()
  isFreeToRead: boolean;

  @IsBoolean()
  isCollectible: boolean;

  @IsBoolean()
  isFullyUploaded: boolean;

  @IsDate()
  publishedAt: Date;

  @IsDate()
  popularizedAt: Date;

  @IsDate()
  verifiedAt: Date;

  @IsNotEmpty()
  @IsKebabCase()
  comicSlug: string;

  @IsOptional()
  @IsArray()
  @Type(() => PartialGenreDto)
  genres: PartialGenreDto[];

  @IsOptional()
  @Type(() => RawComicIssueStatsDto)
  stats: RawComicIssueStatsDto;

  @IsOptional()
  @IsString()
  creatorSlug?: string;

  @IsOptional()
  @IsArray()
  @Type(() => ComicIssueCollaboratorDto)
  @ApiProperty({ type: [ComicIssueCollaboratorDto] })
  collaborators?: ComicIssueCollaboratorDto[];

  @IsOptional()
  @IsArray()
  @Type(() => StatefulCoverDto)
  @ApiProperty({ type: [StatefulCoverDto] })
  statefulCovers?: StatefulCoverDto[];

  @IsArray()
  @Type(() => StatelessCoverDto)
  @ApiProperty({ type: [StatelessCoverDto] })
  statelessCovers: StatelessCoverDto[];

  @IsOptional()
  @IsArray()
  @Type(() => RoyaltyWalletDto)
  @ApiProperty({ type: [RoyaltyWalletDto] })
  royaltyWallets?: RoyaltyWalletDto[];
}

type WithCreator = { creator?: Creator };
type WithComic = { comic?: Comic & WithCreator & { genres?: Genre[] } };
type WithGenres = { genres?: Genre[] };
type WithStats = { stats: Partial<RawComicIssueStats> };
type WithStatelessCovers = { statelessCovers: StatelessCover[] };
type WithCollaborators = { collaborators?: ComicIssueCollaborator[] };
type WithStatefulCovers = { statefulCovers?: StatefulCover[] };
type WithRoyaltyWallets = { royaltyWallets?: RoyaltyWallet[] };
type WithCollection = { collection?: CollectibleComicCollection };

export type RawComicIssueInput = With<
  [
    ComicIssue,
    WithComic,
    WithGenres,
    WithStats,
    WithStatelessCovers,
    WithCollaborators,
    WithStatefulCovers,
    WithRoyaltyWallets,
    WithCollection,
  ]
>;

export function toRawComicIssueDto(issue: RawComicIssueInput) {
  const genres = issue.genres || issue.comic?.genres;
  const collaborators = issue.collaborators;

  const plainRawComicIssueDto: RawComicIssueDto = {
    id: issue.id,
    comicSlug: issue.comicSlug,
    number: issue.number,
    isCollectible: !!issue.collection,
    title: issue.title,
    slug: issue.slug,
    description: issue.description,
    flavorText: issue.flavorText,
    cover: getPublicUrl(findDefaultCover(issue.statelessCovers)?.image) || '',
    pdf: getPublicUrl(issue.pdf) ?? '',
    releaseDate: issue.releaseDate.toISOString(),
    isFreeToRead: issue.isFreeToRead,
    isFullyUploaded: issue.isFullyUploaded,
    publishedAt: issue.publishedAt,
    popularizedAt: issue.popularizedAt,
    verifiedAt: issue.verifiedAt,
    creatorSlug: issue.comic?.creator?.slug,
    collaborators: ifDefined(collaborators, toComicIssueCollaboratorDtoArray),
    statefulCovers: ifDefined(issue.statefulCovers, toStatefulCoverDtoArray),
    statelessCovers: ifDefined(issue.statelessCovers, toStatelessCoverDtoArray),
    royaltyWallets: ifDefined(issue.royaltyWallets, toRoyaltyWalletDtoArray),
    genres: ifDefined(genres, toPartialGenreDtoArray),
    stats: ifDefined(issue.stats, toComicIssueStatsDto),
  };

  const issueDto = plainToInstance(RawComicIssueDto, plainRawComicIssueDto);
  return issueDto;
}

export const toRawComicIssueDtoArray = (issues: RawComicIssueInput[]) => {
  return issues.map(toRawComicIssueDto);
};
