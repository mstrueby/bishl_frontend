import { toHomePageMatch, toHomePagePost } from "@/lib/homePageData";
import { MatchValues } from "@/types/MatchValues";
import { PostValues } from "@/types/PostValues";

describe("homepage data summaries", () => {
  it("keeps only fields required by the homepage", () => {
    const match = {
      _id: "match-1",
      tournament: { name: "Liga", alias: "liga" },
      round: { name: "Hauptrunde" },
      home: {
        fullName: "Home Full",
        shortName: "Home",
        tinyName: "H",
        logo: "/home.png",
        stats: { goalsFor: 4, goalsAgainst: 2 },
        roster: { players: [{ private: "not-for-homepage" }] },
        scores: [{ matchTime: "01:00" }],
      },
      away: {
        fullName: "Away Full",
        shortName: "Away",
        tinyName: "A",
        logo: "/away.png",
        stats: { goalsFor: 2, goalsAgainst: 4 },
        penalties: [{ matchTimeStart: "02:00" }],
      },
      matchStatus: { key: "FINISHED", value: "Beendet" },
      finishType: { key: "REGULAR", value: "Regulär" },
      venue: { name: "Arena" },
      startDate: "2026-09-16T18:00:00.000Z",
      referee1: { _id: "ref-1" },
    } as unknown as MatchValues;

    const summary = toHomePageMatch(match);

    expect(summary).toEqual({
      _id: "match-1",
      tournament: { name: "Liga", alias: "liga" },
      round: { name: "Hauptrunde" },
      home: {
        fullName: "Home Full",
        shortName: "Home",
        tinyName: "H",
        logo: "/home.png",
        goalsFor: 4,
      },
      away: {
        fullName: "Away Full",
        shortName: "Away",
        tinyName: "A",
        logo: "/away.png",
        goalsFor: 2,
      },
      matchStatus: { key: "FINISHED", value: "Beendet" },
      finishType: { key: "REGULAR", value: "Regulär" },
      venue: { name: "Arena" },
      startDate: "2026-09-16T18:00:00.000Z",
      hasReferee1: true,
      hasReferee2: false,
    });
    expect(JSON.stringify(summary)).not.toContain("roster");
    expect(JSON.stringify(summary)).not.toContain("scores");
    expect(JSON.stringify(summary)).not.toContain("penalties");
  });

  it("turns article HTML into a bounded plain-text excerpt", () => {
    const post = {
      _id: "post-1",
      title: "News",
      alias: "news",
      content: `<p>${"Article ".repeat(80)}</p><script>ignored markup</script>`,
      imageUrl: "/news.jpg",
      author: { firstName: "Ada", lastName: "Lovelace" },
      updateDate: "2026-09-16T12:00:00.000Z",
    } as unknown as PostValues;

    const summary = toHomePagePost(post);

    expect(summary.excerpt).not.toContain("<");
    expect(summary.excerpt.length).toBeLessThanOrEqual(320);
    expect(summary.authorFirstName).toBe("Ada");
    expect(summary.authorLastName).toBe("Lovelace");
  });
});