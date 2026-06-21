import { describe, expect, it } from "bun:test";

import {
  getGuatemalaDateRangeUtc,
  getPreviousGuatemalaDate,
  parseFotMobDisciplineEvents,
  parseFotMobMatchesXml,
} from "./fotmobDiscipline";

describe("parseFotMobDisciplineEvents", () => {
  it("normalizes yellow, red, and second-yellow card events from match facts", () => {
    const details = {
      content: {
        matchFacts: {
          events: {
            events: [
              {
                type: "Card",
                card: "Yellow",
                eventId: 101,
                time: 27,
                overloadTime: null,
                isHome: true,
                player: { id: 9001, name: "Home Midfielder" },
              },
              {
                type: "Card",
                card: "Red",
                eventId: 102,
                time: 63,
                overloadTime: 2,
                isHome: false,
                player: { id: 9002, name: "Away Defender" },
              },
              {
                type: "Card",
                card: "YellowRed",
                timeStr: "90",
                overloadTimeStr: "+4",
                isHome: true,
                nameStr: "Home Forward",
              },
              {
                type: "Substitution",
                time: 72,
                isHome: false,
                player: { id: 9003, name: "Ignored Player" },
              },
            ],
          },
        },
      },
    };

    expect(parseFotMobDisciplineEvents(details)).toEqual([
      {
        cardType: "yellow",
        minute: 27,
        minuteAdded: null,
        playerName: "Home Midfielder",
        providerEventId: "101",
        providerPlayerId: "9001",
        teamSide: "home",
      },
      {
        cardType: "red",
        minute: 63,
        minuteAdded: 2,
        playerName: "Away Defender",
        providerEventId: "102",
        providerPlayerId: "9002",
        teamSide: "away",
      },
      {
        cardType: "secondYellow",
        minute: 90,
        minuteAdded: 4,
        playerName: "Home Forward",
        providerEventId: "home-90-4-Home Forward-secondYellow",
        providerPlayerId: null,
        teamSide: "home",
      },
    ]);
  });

  it("returns an empty list for missing or unknown provider shapes", () => {
    expect(parseFotMobDisciplineEvents({})).toEqual([]);
    expect(parseFotMobDisciplineEvents({ content: { matchFacts: { events: { events: "invalid" } } } })).toEqual([]);
  });
});

describe("getPreviousGuatemalaDate", () => {
  it("returns the previous Guatemala calendar day", () => {
    const earlyUtc = Date.UTC(2026, 5, 16, 3, 30);
    const lateUtc = Date.UTC(2026, 5, 16, 18, 0);

    expect(getPreviousGuatemalaDate(earlyUtc)).toBe("2026-06-14");
    expect(getPreviousGuatemalaDate(lateUtc)).toBe("2026-06-15");
  });
});

describe("getGuatemalaDateRangeUtc", () => {
  it("returns UTC bounds for one Guatemala calendar day", () => {
    expect(getGuatemalaDateRangeUtc("2026-06-11")).toEqual({
      endUtc: Date.UTC(2026, 5, 12, 6),
      startUtc: Date.UTC(2026, 5, 11, 6),
    });
  });
});

describe("parseFotMobMatchesXml", () => {
  it("extracts World Cup match ids and team codes from FotMob XML", () => {
    const xml = `<live><exmatches msgId="33">
      <league id="894790" name="World Cup Grp. A">
        <match id="4667751" hTeam="Mexico" aTeam="South Africa" hId="6710" aId="6316" time="11.06.2026 21:00" Status="F" hts="MEX" ats="RSA" ych="2" yca="3" rch="1" />
        <match id="4667752" hTeam="South Korea" aTeam="European Play-Off D" hId="7804" aId="1862057" time="12.06.2026 04:00" Status="N" hts="KOR" ats="TBD" rca="1" />
      </league>
    </exmatches></live>`;

    expect(parseFotMobMatchesXml(xml)).toEqual([
      {
        awayCode: "RSA",
        awayName: "South Africa",
        awayRedCards: 0,
        awayYellowCards: 3,
        homeCode: "MEX",
        homeName: "Mexico",
        homeRedCards: 1,
        homeYellowCards: 2,
        kickoffAt: Date.UTC(2026, 5, 11, 21),
        providerMatchId: "4667751",
      },
      {
        awayCode: "TBD",
        awayName: "European Play-Off D",
        awayRedCards: 1,
        awayYellowCards: null,
        homeCode: "KOR",
        homeName: "South Korea",
        homeRedCards: 0,
        homeYellowCards: null,
        kickoffAt: Date.UTC(2026, 5, 12, 4),
        providerMatchId: "4667752",
      },
    ]);
  });
});
