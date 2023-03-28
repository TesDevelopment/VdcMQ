const { PrismaClient } = require("@prisma/client")
const Prisma = PrismaClient()

const Mins = {
  "Duelist": 0.2,
  "Chamber": 0.2,
  "Overall": 0.075
}

const Maxs = {
  "Controller": 0.225,
  "Initiator": 0.35,
  "Sentinel": 0.35,
}

//Condsider hooking this up to the API, might cause some issues and roles arent provided
const Agents = {
  "E370FA57-4757-3604-3648-499E1F642D3F": {
    name: "Gekko",
    role: "Initiator"
  },
  "DADE69B4-4F5A-8528-247B-219E5A1FACD6": {
    name: "Fade",
    role: "Initiator"
  },
  "5F8D3A7F-467B-97F3-062C-13ACF203C006": {
    name: "Breach",
    role: "Initiator"
  },
  "F94C3B30-42BE-E959-889C-5AA313DBA261": {
    name: "Raze",
    role: "Duelist"
  },
  "22697A3D-45BF-8DD7-4FEC-84A9E28C69D7": {
    name: "Chamber",
    role: "Chamber" // For algo stuff, obv he's a sentinel
  },
  "601DBBE7-43CE-BE57-2A40-4ABD24953621": {
    name:"KAY/O",
    role: "Initiator"
  },
  "6F2A04CA-43E0-BE17-7F36-B3908627744D": {
    name: "Skye",
    role: "Initiator"
  },
  "117ED9E3-49F3-6512-3CCF-0CADA7E3823B": {
    name: "Cypher",
    role: "Sentinel"
  },
  "DED3520F-4264-BFED-162D-B080E2ABCCF9": {
    name: "Sova",
    role: "Initiator"
  },
  "320B2A48-4D9B-A075-30F1-1F93A9B638FA": {
    name: "Sova",
    role: "Initiator"
  }, //This is NOT a mistake, riot has two sovas in their system for some reason
  "1E58DE9C-4950-5125-93E9-A0AEE9F98746": {
    name: "KillJoy",
    role: "Sentinel"
  },
  "95B78ED7-4637-86D9-7E41-71BA8C293152": {
    name: "Harbor",
    role: "Controller"
  },
  "707EAB51-4836-F488-046A-CDA6BF494859": {
    name: "Viper",
    role: "Controller"
  },
  "EB93336A-449B-9C1B-0A54-A891F7921D69": {
    name: "Pheonix",
    role: "Duelist"
  },
  "41FB69C1-4189-7B37-F117-BCAF1E96F1BF": {
    name: "Astra",
    role: "Controller",
  },
  "9F0D8BA9-4140-B941-57D3-A7AD57C6B417": {
    name: "Brimstone",
    role: "Controller"
  },
  "BB2A4828-46EB-8CD1-E765-15848195D751": {
    name: "Neon",
    role: "Duelist"
  },
  "7F94D92C-4234-0A36-9646-3A87EB8B5C89": {
    name: "Yoru",
    role: "Duelist"
  },
  "569FDD95-4D10-43AB-CA70-79BECC718B46": {
    name: "Sage",
    role: "Sentinel",
  },
  "A3BFB853-43B2-7238-A4F1-AD90E9E46BCC": {
    name: "Reyna",
    role: "Duelist"
  },
  "8E253930-4C05-31DD-1B6C-968525494517": {
    name: "Omen",
    role: "Controller"
  },
  "ADD6443A-41BD-E414-F6AD-E58D267F4E95": {
    name: "Jett",
    role: "Duelist"
  }
}

async function RetreiveMatch(match_id) {
    const response = await fetch(
      `https://na.api.riotgames.com/val/match/v1/matches/${match_id}`,
      {
        headers: {
          'X-Riot-Token': process.env.RIOT_AUTH,
        },
      }
    )
    const json = response.json()
    if (json.status) throw new Error(json.status)
  
    return json
}

const WeightedAverage = (nums, weights) => {
    const [sum, weightSum] = weights.reduce(
      (acc, w, i) => {
        acc[0] = acc[0] + nums[i] * w
        acc[1] = acc[1] + w
        return acc
      },
      [0, 0]
    )
    return sum / weightSum
}

function UpdateAverage(currentAvg, currentMapsPlayed, newStat) {
    return (currentAvg * currentMapsPlayed + newStat) / (currentMapsPlayed + 1)
}

module.exports = async function(msg){
    const id = msg.content.toString()
    console.log(`[x] Received match id ${id}`)

    const DatabaseObject = await Prisma.PastGames.fineOne({
        where: {
            id: id
        }
    })

    if(!DatabaseObject){
        return;
    }

    const MatchData = await RetreiveMatch(id)
    
    const Players = MatchData.players

    const PlayerTable = []

    for (const Player of Players) {
      const PlayerData = await Prisma.Player.findOne({
        where: {
            primaryRiotID: Player.puuid
        },
        include: {
          Games: true,
        }
      })

      if (!PlayerData) {
        return console.log(`Invalid player found in match: ${id}`)
      }

      PlayerTable[Player.puuid] = PlayerData
    }

    for(const Player of Players){
        const DatabasePlayer = PlayerTable[Player.puuid]

        const Stats = Player.stats
        const KillDeathDifferance = playerStats.Kills - playerStats.deaths
        const KillsDeathRatio = playerStats.Kills / playerStats.deaths
        const ADR = totalDamage / MatchData.roundResults.length

        const MatchesPlayed = 0; //TODO: This lmao

        let FirstKills = 0;
        let FirstDeaths = 0;

        let KastRounds = 0;

        for (const Rnd of MatchData.RoundResults) {
            let EarliestKill = 0
            let EarliestKiller = ""
            let EarliestVictim = ""

            let MetKast = false;
            let Died = false;
      
            for (const Round of Rnd.playerStats) {
              for (const Kill of Round.Kills) {
                if (Kill.timeSinceRoundStartMillis < EarliestKill) {
                  EarliestKill = Kill.timeSinceRoundStartMillis
                  EarliestKiller = Kill.Killer
                  EarliestVictim = Kill.victim
                }

                if(Kill.victim == playerData.puuid){
                  Died = true;

                  const Killer = Kill.Killer
                  for (const SecondaryKill of Round.Kills) {
                    if(SecondaryKill.victim == Killer && SecondaryKill.timeSinceRoundStartMillis - Kill.timeSinceRoundStartMillis <= 2000){
                      MetKast = true;
                    }
                  }
                }
              }
              
              if (Round.puuid === playerData.puuid) {
                if (Round.Kills > 1) multiKills++

                spent += Round.economy.spent
                scorePerRnd.push(Round.score)

                for (const dmg of Round.damage) {
                  totalDamage += dmg.damage
                  totalShots += dmg.legshots
                  totalShots += dmg.bodyshots
      
                  totalShots += dmg.headshots
                  headshots += dmg.headshots
                }

                if(Round.Kills > 0 || !Died) MetKast = true;
              }
            }
      
            if (EarliestKiller === playerData.puuid) FirstKills++
            
            if (EarliestVictim === playerData.puuid) FirstDeaths++

            if(MetKast){
              KastRounds++
            }
        }
        const OpeningEngage = (FirstKills + FirstDeaths) / MatchData.RoundResults.length
        
        const Agent = Agents[Player.characterId]

        const EnagementImpact = (() => {
          switch(Agent.role){
            case "Duelist":
              if(OpeningEngage < Mins.Duelist) return (100*(Mins.Duelist-OpeningEngage)/35)^2;
            return 0;

            case "Controller":
              if(OpeningEngage > Maxs.Controller) return (100*(OpeningEngage-Maxs.Controller)/50)^2;
            break;

            case "Initiator":
              if(OpeningEngage > Maxs.Initiator) return (100*(OpeningEngage-Maxs.Initiator)/50)^2;
            break;

            case "Sentinel":
              if(OpeningEngage > Maxs.Sentinel) return (100*(OpeningEngage-Maxs.Sentinel)/50)^2;
            break;

            case "Chamber":
              if(OpeningEngage < Mins.Chamber) return (100*(Mins.Chamber-OpeningEngage)/35)^2;
            return 0;
          }

          if(OpeningEngage < Mins.Overall) return (100*(Mins.Overall-OpeningEngage)/20)^1.75 
          return 0
        })()

        const KPR = Player.stats.kills / MatchData.RoundResults.length
        const APR = Player.stats.assists / MatchData.RoundResults.length
        const Kast = (KastRounds / MatchData.RoundResults.length) * 100

        const AgentStats = await Prisma.AgentStats.findOne({
          where: {
            agent: Agent.name
          }
        })

        const TierStats = await Prisma.TierStats.findOne({
          where: {
            name: DatabasePlayer.tier
          }
        })

        const KprModifier = (() => {
          if(AgentStats.kpr > TierStats.kpr){
            if(AgentStats.kpr > (TierStats.kpr + 0.15)) return (((0.15)*100)^0.75)/100
            return (((AgentStats.kpr-TierStats.kpr)*100)^0.75)/100
          }
          return 0
        })()

        const AprModifier = (() => {
          if(AgentStats.apr > TierStats.apr){
            if(AgentStats.apr > (TierStats.apr + 0.15)) return (((0.15)*100)^0.75)/100

            return (((AgentStats.apr-TierStats.apr)*100)^0.75)/100
          }

          return 0
        })()

        const ModKpr = KPR^(1/(1+KprModifier))
        const ModApr = APR^(1/(1+AprModifier))

        const FkBonus = (()=> {
          if(Kast < TierStats.kast) return 1/30*(FirstKills-2)^1.5

          return ((40-4*(TierStats.kast - KAST)^0.63)/40)*(1/30*(Player.FK-Avg.FK)^1.5)
        })()

        const FdPenalty = (() => {
          if (Kast > TierStats.kast) return ((30-4*(Kast-TierStats.kast)^0.6)/30)*(1/100*(FirstDeaths-2)^2)
          return 1/100*(FirstDeaths-2)^2
        })()

        const GameRating = ((ModKpr/TierStats.kpr)*0.2 + (ModApr/TierStats.apr)*0.2 + (KAST/TierStats.kast)*0.4 + (ADR/TierStats.adr)*0.2) + FkBonus - FdPenalty - EnagementImpact
        const GamesPlayed = DatabasePlayer.Games.length

        const Rating = UpdateAverage(DatabasePlayer.Rating, GamesPlayed, GameRating)

        await Prisma.Player.update({
          where: {
            primaryRiotID: Player.puuid
          },
          data: {
            Rating: Rating,
          }
        })

        await Prisma.PlayerStats.create({
          Player: {connect: {userID: Player.userID}},
          PastGames: {connect: {id: DatabaseObject.id}},
          AgentStats: {connect: {agent: AgentStats.agent}},
          userID: Player.userID,
          agent: AgentStats.agent,
          gameID: DatabaseObject.id,
          kills: Player.kills,
          deaths: Player.deaths,
          assists: Player.assists,
          adr: ADR,
          first_kills: FirstKills,
          first_death: FirstDeaths,
          kast: KAST,
          rounds_played: MatchData.roundResults.length
        })

        await Prisma.TierStats.update({
          where:{
            name: TierStats.name
          },
          data:{
            increments: {increment: 1},
            kpr: UpdateAverage(TierStats.kpr, TierStats.increments, KPR),
            apr: UpdateAverage(TierStats.apr, TierStats.increments, APR),
            kast: UpdateAverage(TierStats.kast, TierStats.increments, KAST),
            adr: UpdateAverage(TierStats.adr, TierStats.increments, ADR)
          }
        })
    }

    await Prisma.PastGames.update({
        where: {
            id: DatabaseObject.id
        },
        data: {
            processed: true,
            riotResponse: MatchData
        }
    })
}