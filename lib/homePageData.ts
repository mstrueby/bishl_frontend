import { HomePageMatchSummary, HomePagePostSummary } from "../types/HomePageValues";
import { MatchValues } from "../types/MatchValues";
import { PostValues } from "../types/PostValues";

export const toHomePageMatch = (match: MatchValues): HomePageMatchSummary => ({
  _id: match._id,
  tournament: {
    name: match.tournament.name,
    alias: match.tournament.alias,
  },
  round: {
    name: match.round.name,
  },
  home: {
    fullName: match.home.fullName,
    shortName: match.home.shortName,
    tinyName: match.home.tinyName,
    logo: match.home.logo,
    goalsFor: match.home.stats.goalsFor,
  },
  away: {
    fullName: match.away.fullName,
    shortName: match.away.shortName,
    tinyName: match.away.tinyName,
    logo: match.away.logo,
    goalsFor: match.away.stats.goalsFor,
  },
  matchStatus: {
    key: match.matchStatus.key,
    value: match.matchStatus.value,
  },
  finishType: {
    key: match.finishType.key,
    value: match.finishType.value,
  },
  venue: {
    name: match.venue.name,
  },
  startDate: new Date(match.startDate).toISOString(),
  hasReferee1: Boolean(match.referee1),
  hasReferee2: Boolean(match.referee2),
});

export const toHomePagePost = (post: PostValues): HomePagePostSummary => ({
  _id: post._id,
  title: post.title,
  alias: post.alias,
  excerpt: post.content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320),
  imageUrl: post.imageUrl,
  authorFirstName: post.author.firstName,
  authorLastName: post.author.lastName,
  updateDate: new Date(post.updateDate).toISOString(),
});