import { GlassCard } from "@/components/glass-card"
import { createClient } from "@/lib/supabase/server"
import { Trophy, Medal, Award, Star } from "lucide-react"
import Link from "next/link"
import type { LeaderboardEntry } from "@/lib/types"

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: leaderboard } = await supabase
    .from("leaderboard")
    .select(`
      *,
      casinos (
        id,
        name,
        rating
      )
    `)
    .order("rank", { ascending: true })

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-orange-500" />
      default:
        return <span className="text-[#00ff88] font-bold text-lg">#{rank}</span>
    }
  }

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30"
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30"
      case 3:
        return "bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-500/30"
      default:
        return "bg-white/5 border-white/10"
    }
  }

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Player Leaderboard</h1>
          <p className="text-gray-400 text-lg">Top players and their achievements across all casinos</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Top 3 Podium */}
          {leaderboard && leaderboard.length >= 3 && (
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {/* 2nd Place */}
              <div className="md:order-1 flex flex-col items-center">
                <GlassCard className={`p-6 w-full text-center ${getRankBg(2)}`}>
                  <div className="w-16 h-16 bg-gray-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Medal className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{leaderboard[1]?.player_name}</h3>
                  <p className="text-gray-400 text-sm mb-2">{leaderboard[1]?.casinos?.name}</p>
                  <p className="text-2xl font-bold text-gray-400">{leaderboard[1]?.points} pts</p>
                </GlassCard>
              </div>

              {/* 1st Place */}
              <div className="md:order-2 flex flex-col items-center">
                <GlassCard className={`p-8 w-full text-center ${getRankBg(1)} transform md:scale-110`}>
                  <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-10 h-10 text-yellow-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{leaderboard[0]?.player_name}</h3>
                  <p className="text-gray-400 text-sm mb-2">{leaderboard[0]?.casinos?.name}</p>
                  <p className="text-3xl font-bold text-yellow-500">{leaderboard[0]?.points} pts</p>
                  <div className="mt-2 text-yellow-500 text-sm font-semibold">👑 CHAMPION</div>
                </GlassCard>
              </div>

              {/* 3rd Place */}
              <div className="md:order-3 flex flex-col items-center">
                <GlassCard className={`p-6 w-full text-center ${getRankBg(3)}`}>
                  <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{leaderboard[2]?.player_name}</h3>
                  <p className="text-gray-400 text-sm mb-2">{leaderboard[2]?.casinos?.name}</p>
                  <p className="text-2xl font-bold text-orange-500">{leaderboard[2]?.points} pts</p>
                </GlassCard>
              </div>
            </div>
          )}

          {/* Full Leaderboard */}
          <GlassCard className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Complete Rankings</h2>
            <div className="space-y-3">
              {leaderboard?.map((entry: LeaderboardEntry & { casinos?: any }, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 hover:bg-white/10 ${getRankBg(entry.rank || index + 1)}`}
                >
                  <div className="flex items-center flex-1">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-white/10">
                      {getRankIcon(entry.rank || index + 1)}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">{entry.player_name}</h3>
                      <div className="flex items-center text-gray-400 text-sm">
                        {entry.casinos ? (
                          <Link href={`/casinos/${entry.casinos.id}`} className="text-[#00ff88] hover:underline mr-2">
                            {entry.casinos.name}
                          </Link>
                        ) : (
                          <span className="mr-2">No casino</span>
                        )}
                        {entry.casinos?.rating && (
                          <div className="flex items-center">
                            <Star className="w-3 h-3 text-[#00ff88] fill-current mr-1" />
                            <span>{entry.casinos.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[#00ff88] font-bold text-xl">{entry.points}</div>
                    <div className="text-gray-400 text-sm">points</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {!leaderboard?.length && (
            <div className="text-center py-16">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No leaderboard data available yet. Check back later!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
