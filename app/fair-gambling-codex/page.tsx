import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DynamicPageHero } from '@/components/dynamic-page-hero'
import { Shield, CheckCircle, Users, Award, Scale, Eye, Heart, Globe, Target, Search, TestTube, BarChart, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"


export const metadata = {
  title: "Fair Gambling Codex | GuruSingapore",
  description: "Learn about GuruSingapore's Fair Gambling Codex - our commitment to promoting fair, transparent, and responsible online gambling practices in Singapore.",
  keywords: "fair gambling, codex, responsible gambling, casino standards, GuruSingapore, CGSG",
}

export default function FairGamblingCodexPage() {
  return (
    <>
      <Navbar />
      
      <DynamicPageHero
        pageName="fair-gambling-codex"
        sectionType="hero"
        fallbackTitle="Fair Gambling Codex"
        fallbackDescription="Our commitment to promoting fair, transparent, and responsible online gambling practices"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Introduction Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-black border border-[#00ff88]/30 rounded-xl p-8">
                <div className="flex items-center mb-6">
                  <Scale className="w-8 h-8 text-[#00ff88] mr-4" />
                  <h2 className="text-3xl font-bold text-white">What is the Fair Gambling Codex?</h2>
                </div>
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  The Fair Gambling Codex is GuruSingapore's comprehensive set of principles and standards that define what we consider to be fair and acceptable practices in the online gambling industry. As part of the Casino Guru Singapore Group (CGSG), we are committed to creating a safer and more transparent gambling environment for all players.
                </p>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Our codex serves as a benchmark against which we evaluate online casinos, ensuring that players have access to fair games, transparent terms, and reliable customer service. We believe that every player deserves to gamble in an environment free from unfair practices and deceptive terms.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Principles */}
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">Core Principles</h2>
              <p className="text-gray-400 text-xl max-w-3xl mx-auto">
                Our Fair Gambling Codex is built on fundamental principles that protect players and promote industry integrity
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Principle 1 */}
              <div className="bg-black border border-[#00ff88]/30 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Shield className="w-8 h-8 text-[#00ff88] mr-3" />
                  <h3 className="text-xl font-bold text-white">Player Protection</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Every player has the right to fair treatment, secure transactions, and protection of personal data. Casinos must implement robust security measures and responsible gambling tools.
                </p>
              </div>

              {/* Principle 2 */}
              <div className="bg-black border border-[#00ff88]/30 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Eye className="w-8 h-8 text-[#00ff88] mr-3" />
                  <h3 className="text-xl font-bold text-white">Transparency</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  All terms and conditions must be clear, easily accessible, and written in plain language. Hidden clauses and misleading information are strictly prohibited.
                </p>
              </div>

              {/* Principle 3 */}
              <div className="bg-black border border-[#00ff88]/30 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="w-8 h-8 text-[#00ff88] mr-3" />
                  <h3 className="text-xl font-bold text-white">Fair Play</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Games must use certified random number generators, and casinos must not manipulate outcomes. Players should have a genuine chance to win based on skill and luck.
                </p>
              </div>

              {/* Principle 4 */}
              <div className="bg-black border border-[#00ff88]/30 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Users className="w-8 h-8 text-[#00ff88] mr-3" />
                  <h3 className="text-xl font-bold text-white">Responsible Gambling</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Casinos must provide tools for self-exclusion, deposit limits, and reality checks. They should actively promote responsible gambling and provide support for problem gamblers.
                </p>
              </div>

              {/* Principle 5 */}
              <div className="bg-black border border-[#00ff88]/30 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Award className="w-8 h-8 text-[#00ff88] mr-3" />
                  <h3 className="text-xl font-bold text-white">Quality Service</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Customer support must be responsive, knowledgeable, and available through multiple channels. Withdrawal processes should be efficient and transparent.
                </p>
              </div>

              {/* Principle 6 */}
              <div className="bg-black border border-[#00ff88]/30 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Globe className="w-8 h-8 text-[#00ff88] mr-3" />
                  <h3 className="text-xl font-bold text-white">Regulatory Compliance</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Casinos must hold valid licenses from reputable jurisdictions and comply with all applicable laws and regulations in their operating territories.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Commitment */}
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-black border border-[#00ff88]/30 rounded-xl p-8">
                <div className="flex items-center mb-6">
                  <Target className="w-8 h-8 text-[#00ff88] mr-4" />
                  <h2 className="text-3xl font-bold text-white">Our Commitment</h2>
                </div>
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  As part of the Casino Guru Singapore Group, we are committed to maintaining the highest standards of integrity in our casino reviews and recommendations. Our team of experts evaluates each casino against our Fair Gambling Codex to ensure that we only recommend operators that meet our strict criteria.
                </p>
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  We believe that transparency is key to building trust with our users. That's why we publish detailed reviews that explain exactly how each casino measures up against our standards, including any areas where they may fall short.
                </p>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Our goal is to create a gambling environment where players can enjoy their favorite games with confidence, knowing that they are playing at casinos that operate fairly and transparently.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Process */}
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">Our Evaluation Process</h2>
              <p className="text-gray-400 text-xl max-w-3xl mx-auto">
                We follow a rigorous process to ensure every casino meets our Fair Gambling Codex standards
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Evaluation Process */}
              <div className="bg-black border border-[#00ff88]/30 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Search className="w-8 h-8 text-[#00ff88] mr-3" />
                  <h3 className="text-xl font-bold text-white">Comprehensive Research</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  We conduct thorough research on each casino's background, licensing, and operational history to ensure they meet our standards.
                </p>
              </div>

              {/* Testing Process */}
              <div className="bg-black border border-[#00ff88]/30 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <TestTube className="w-8 h-8 text-[#00ff88] mr-3" />
                  <h3 className="text-xl font-bold text-white">Hands-On Testing</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Our experts test games, payment methods, and customer support to verify that casinos deliver on their promises.
                </p>
              </div>

              {/* Analysis Process */}
              <div className="bg-black border border-[#00ff88]/30 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <BarChart className="w-8 h-8 text-[#00ff88] mr-3" />
                  <h3 className="text-xl font-bold text-white">Data Analysis</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  We analyze player feedback, complaint resolution rates, and financial stability to provide comprehensive evaluations.
                </p>
              </div>

              {/* Monitoring Process */}
              <div className="bg-black border border-[#00ff88]/30 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Monitor className="w-8 h-8 text-[#00ff88] mr-3" />
                  <h3 className="text-xl font-bold text-white">Ongoing Monitoring</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  We continuously monitor casinos to ensure they maintain our standards and update our reviews when necessary.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* GuruSingapore's Commitment */}
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-black border border-[#00ff88]/30 rounded-xl p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-4">GuruSingapore's Commitment</h2>
                    <p className="text-gray-400 text-lg">
                      As part of the Casino Guru Singapore Group (CGSG), we are dedicated to upholding the highest standards in the industry
                    </p>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-bold text-[#00ff88] mb-4">What We Do</h3>
                    <ul className="space-y-3 text-gray-300">
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-[#00ff88] mr-3 mt-0.5 flex-shrink-0" />
                        <span>Thoroughly review casino terms and conditions</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-[#00ff88] mr-3 mt-0.5 flex-shrink-0" />
                        <span>Test games for fairness and randomness</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-[#00ff88] mr-3 mt-0.5 flex-shrink-0" />
                        <span>Evaluate customer support quality</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-[#00ff88] mr-3 mt-0.5 flex-shrink-0" />
                        <span>Monitor withdrawal processes and timeframes</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-[#00ff88] mr-3 mt-0.5 flex-shrink-0" />
                        <span>Advocate for player rights and fair treatment</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-[#00ff88] mb-4">Our Impact</h3>
                    <div className="space-y-4">
                      <div className="bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg p-4">
                        <div className="text-3xl font-bold text-[#00ff88] mb-2">722+</div>
                        <div className="text-gray-300">Casinos improved their terms and conditions based on our recommendations</div>
                      </div>
                      <div className="bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg p-4">
                        <div className="text-3xl font-bold text-[#00ff88] mb-2">50,000+</div>
                        <div className="text-gray-300">Players protected from unfair practices</div>
                      </div>
                      <div className="bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg p-4">
                        <div className="text-3xl font-bold text-[#00ff88] mb-2">95%</div>
                        <div className="text-gray-300">Success rate in resolving player complaints</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How We Evaluate Casinos */}
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">How We Evaluate Casinos</h2>
              <p className="text-gray-400 text-xl max-w-3xl mx-auto">
                Our comprehensive evaluation process ensures that only casinos meeting our Fair Gambling Codex standards receive positive ratings
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-black border border-[#00ff88]/30 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-white mb-6">Evaluation Criteria</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-[#00ff88] rounded-full flex items-center justify-center mr-4">
                      <span className="text-black font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="text-[#00ff88] font-semibold">License & Regulation</h4>
                      <p className="text-gray-300 text-sm">Valid licenses from reputable jurisdictions</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-[#00ff88] rounded-full flex items-center justify-center mr-4">
                      <span className="text-black font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="text-[#00ff88] font-semibold">Game Fairness</h4>
                      <p className="text-gray-300 text-sm">RNG certification and game testing</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-[#00ff88] rounded-full flex items-center justify-center mr-4">
                      <span className="text-black font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="text-[#00ff88] font-semibold">Terms & Conditions</h4>
                      <p className="text-gray-300 text-sm">Clear, fair, and transparent policies</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-[#00ff88] rounded-full flex items-center justify-center mr-4">
                      <span className="text-black font-bold">4</span>
                    </div>
                    <div>
                      <h4 className="text-[#00ff88] font-semibold">Customer Support</h4>
                      <p className="text-gray-300 text-sm">Responsive and helpful assistance</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-[#00ff88] rounded-full flex items-center justify-center mr-4">
                      <span className="text-black font-bold">5</span>
                    </div>
                    <div>
                      <h4 className="text-[#00ff88] font-semibold">Payment Processing</h4>
                      <p className="text-gray-300 text-sm">Fast and secure transactions</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black border border-[#00ff88]/30 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-white mb-6">Rating System</h3>
                <div className="space-y-6">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="text-green-400 font-bold text-lg">Excellent (9.0-10.0)</h4>
                    <p className="text-gray-300 text-sm">Exceeds all Fair Gambling Codex standards with exceptional practices</p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="text-blue-400 font-bold text-lg">Very Good (7.5-8.9)</h4>
                    <p className="text-gray-300 text-sm">Meets all standards with some areas of excellence</p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="text-yellow-400 font-bold text-lg">Good (6.0-7.4)</h4>
                    <p className="text-gray-300 text-sm">Meets most standards with minor areas for improvement</p>
                  </div>
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="text-orange-400 font-bold text-lg">Fair (4.0-5.9)</h4>
                    <p className="text-gray-300 text-sm">Meets basic standards but has notable issues</p>
                  </div>
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="text-red-400 font-bold text-lg">Poor (0.0-3.9)</h4>
                    <p className="text-gray-300 text-sm">Fails to meet Fair Gambling Codex standards</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Join Our Mission */}
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-black border border-[#00ff88]/30 rounded-2xl p-8 text-center">
                <div className="flex items-center justify-center mb-6">
                  <Heart className="w-8 h-8 text-[#00ff88] mr-3" />
                  <h2 className="text-3xl font-bold text-white">Join Our Mission</h2>
                </div>
                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  Help us create a safer gambling environment for everyone. Whether you're a player, operator, or industry professional, you can contribute to promoting fair gambling practices.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link href="/casinos">
                    <Button className="w-full bg-[#00ff88] hover:bg-[#00ff88]/80 text-black font-semibold py-3 px-6 rounded-lg transition-colors">
                      Explore Recommended Casinos
                    </Button>
                  </Link>
                  <Link href="/responsible-gambling">
                    <Button variant="outline" className="w-full border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black font-semibold py-3 px-6 rounded-lg transition-colors">
                      Learn About Responsible Gambling
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  )
}