import type { RawGlossaryTerm } from '@/lib/api/contract'
import { mockId } from './ids'

// P-032 (proposal, specs/glossary): glossary terms as the backend would send them, in the Home's
// feeds. The PO's 15 examples (2026-10-25), in their two groups.

const term = (
  n: number,
  category: string,
  name: string,
  definition: string,
  example: string,
): RawGlossaryTerm => ({ id: mockId(32, n), term: name, category, definition, example })

const TRADING = 'Trading'
const MACRO = 'Macro and bonds'

export const GLOSSARY: RawGlossaryTerm[] = [
  term(
    1,
    TRADING,
    'Short selling',
    "Selling an asset you don't own, borrowed from a broker, expecting to buy it back cheaper and return it. You profit if the price falls. The risk is asymmetric: the most you can make is 100% if the asset goes to zero, but the potential loss has no ceiling.",
    'A trader borrows 100 shares and sells them at $50. If the price drops to $35, they buy them back, return them and keep $1,500. If it rises to $80, they lose $3,000.',
  ),
  term(
    2,
    TRADING,
    'Short squeeze',
    'A sharp price spike that happens when many short sellers are forced to buy back the asset to close their positions. Those buybacks push the price even higher and drag in more shorts, in a snowball effect.',
    'In January 2021, GameStop had more shares sold short than shares available to trade (short interest above 100% of the float). A wave of retail buying sent the stock from ~$20 to over $300 in two weeks and forced short funds to cover at huge losses.',
  ),
  term(
    3,
    TRADING,
    'Leverage',
    'Using borrowed money to take a position larger than your own capital. It multiplies gains and losses alike: at 10x leverage, a 1% move in the asset equals 10% on your capital. Expressed as a ratio (2x, 5x, 100x).',
    'With $1,000 of your own money and 5x leverage you open a $5,000 position in EUR/USD. If the pair rises 2%, the gain is $100 (10% of your capital). If it falls 2%, the loss is the same $100.',
  ),
  term(
    4,
    TRADING,
    'Margin call',
    "A broker's notice that the equity in your account has fallen below the minimum required to keep a leveraged position open. You must add funds or close positions; if you don't, the broker liquidates the position automatically, often at the worst moment.",
    'A $10,000 position opened with $1,000 of collateral (10x) and a 5% maintenance margin. If the asset drops 5%, equity falls to $500, exactly the minimum: the margin call arrives. If it keeps falling, the broker closes the position.',
  ),
  term(
    5,
    TRADING,
    'Stop loss',
    'An order that closes a position automatically when the price reaches a predefined level, to cap the loss. It takes the exit decision out of the emotional realm. Its limit: in very volatile or gapping markets, the fill can come at a worse price than the one set.',
    'You buy a stock at $100 with a stop loss at $92. If the price falls to that level, the order executes and the loss is capped at 8%, even if the stock keeps sliding to $70.',
  ),
  term(
    6,
    TRADING,
    'Implied volatility (IV)',
    "The future volatility the market expects for an asset, derived from its option prices. It doesn't say where the price is going, only how much movement is priced in. It rises ahead of uncertain events (earnings, elections, central bank meetings) and usually collapses afterwards.",
    "Before an earnings report, a stock's options price in a ±8% move for the week. If the stock moves only 3%, implied volatility drops and whoever bought options loses value even after getting the direction right.",
  ),
  term(
    7,
    TRADING,
    'Drawdown',
    "The decline from a peak to the following trough, measured in percent. It shows how much someone who entered at the worst moment would have lost. A strategy's maximum drawdown says more about its real risk than its average return, because it measures the pain you have to sit through to get the result.",
    'A portfolio goes from $100,000 to $65,000 and then recovers to $110,000. The maximum drawdown was 35%. Getting back to the starting point from the trough took a 54% rise, not 35%.',
  ),
  term(
    8,
    MACRO,
    'Inverted yield curve',
    'A situation where short-term bonds yield more than long-term ones, the opposite of normal. It signals that the market expects rate cuts and weaker growth. Historically it has preceded most US recessions, though with a lag of months or years.',
    'The 2-year US Treasury yields 4.8% and the 10-year 4.2%: the curve is inverted by 60 basis points. In 2022–2023 the inversion was the deepest in four decades.',
  ),
  term(
    9,
    MACRO,
    'Duration',
    "A bond's price sensitivity to changes in interest rates, expressed in years. The higher the duration, the bigger the price swing for every point of rates. Long-dated, low-coupon bonds have more duration; short-dated, high-coupon bonds have less.",
    'A bond with a duration of 7 loses roughly 7% of its price if rates rise 1 percentage point, and gains 7% if they fall 1 point. That is why 30-year bonds move far more than 3-month bills.',
  ),
  term(
    10,
    MACRO,
    'Country risk (EMBI spread)',
    "The premium an emerging-market country pays over US Treasuries, measured in basis points; the most-used gauge is JP Morgan's EMBI. It sums up the probability of default the market assigns. The higher the spread, the more expensive it is for the government and its companies to borrow.",
    'If the 10-year US Treasury pays 4% and a comparable Argentine bond yields 12%, the country risk is 800 basis points. Above ~1,000 points, a country can barely issue debt in international markets.',
  ),
  term(
    11,
    MACRO,
    'Real interest rate',
    'The interest rate after subtracting inflation: what money actually gains or loses in purchasing power. A high nominal rate can be negative in real terms if inflation is higher. It is the variable markets watch to judge whether monetary policy is tight or loose.',
    'A term deposit pays 40% a year in a country with 50% inflation: the real rate is negative (about −6.7%) and the savings lose purchasing power. A 5% bond with 2% inflation yields ~2.9% in real terms.',
  ),
  term(
    12,
    MACRO,
    'Core inflation',
    'Inflation excluding food and energy, the most volatile components of the price index. Central banks watch it closely because it better reflects the underlying trend and the price pressures monetary policy can actually control.',
    'Headline CPI rises 3.0% year on year, but core inflation prints 4.1%. The headline looks good, but the number the Fed cares about is the second one, so the market pushes back its rate-cut expectations.',
  ),
  term(
    13,
    MACRO,
    'Quantitative easing (QE)',
    "Large-scale bond buying by a central bank to inject liquidity and lower long-term rates once the policy rate is already near zero. It inflates the central bank's balance sheet and tends to push up stocks, bonds and other assets. Its reverse is quantitative tightening (QT).",
    'Between 2020 and 2022 the Federal Reserve bought bonds at a pace of up to $120 billion a month and its balance sheet went from ~$4 trillion to almost $9 trillion. Over that period the S&P 500 more than doubled from its pandemic lows.',
  ),
  term(
    14,
    MACRO,
    'Hawkish / Dovish',
    "Jargon for a central bank's tone. Hawkish: prioritizes fighting inflation, with high rates or hikes. Dovish: prioritizes growth and employment, with low rates or cuts. A single changed word in a statement can move bonds, currencies and stocks.",
    'The Fed holds rates but swaps “gradual cuts” for “data dependent”. The market reads it as hawkish: the dollar rises, the 2-year yield jumps 10 basis points and tech stocks fall.',
  ),
  term(
    15,
    MACRO,
    'Soft landing',
    "The scenario in which a central bank brings inflation down by raising rates without triggering a recession: the economy cools but unemployment doesn't spike. It is the hardest outcome to achieve, which is why it is the most debated in every tightening cycle. Its opposite is a hard landing.",
    'The Fed raises rates from 0% to above 5% in 18 months; inflation falls from 9% to 3% and unemployment only drifts from 3.5% to 4%. If no recession follows, that is a soft landing.',
  ),
]

/** One glossary term after every this many posts of the Home (PO, 2026-10-25); ads do not count. */
export const GLOSSARY_EVERY = 8

/**
 * Terms for a page, one per place, at random on every request, as the ads (specs/glossary GL-03):
 * never the same one twice in a row. `random` is for tests.
 */
export function randomGlossary(
  count: number,
  random: () => number = Math.random,
): RawGlossaryTerm[] {
  const picked: RawGlossaryTerm[] = []
  for (let place = 0; place < count; place++) {
    const options = GLOSSARY.filter((each) => each.id !== picked.at(-1)?.id)
    picked.push(options[Math.floor(random() * options.length)]!)
  }
  return picked
}
