import { buildDaoProposalOverview } from './daoProposal.js'
import { buildOrderBookClearingOverview } from './orderBookClearing.js'
import { buildLimitOrderOverview } from './limitOrder.js'
import { buildCancelStrategyOverview } from './cancelStrategy.js'
import { buildFinMarketSwapOverview } from './finMarketSwap.js'
import { buildLiquidBondOverview } from './liquidBond.js'
import { buildStakingRewardsClaimOverview } from './stakingRewardsClaim.js'
import { buildYieldingStakingBondOverview } from './yieldingStakingBond.js'
import { buildGhostCreditLiquidationOverview } from './ghostCreditLiquidation.js'
import { buildGhostCreditBorrowOverview } from './ghostCreditBorrow.js'
import { buildAutoRujiraResetInstanceOverview } from './autoRujiraResetInstance.js'
import { buildCclRangeCreateOverview } from './cclRangeCreate.js'
import { buildCclRangeClaimOverview } from './cclRangeClaim.js'
import { buildCclRangeTransferOverview } from './cclRangeTransfer.js'
import { buildGhostVaultOverview } from './ghostVault.js'
import { buildCalcSchedulerBatchExecuteOverview } from './calcSchedulerBatchExecute.js'
import { buildCalcAggregateOverview } from './calcAggregateFallback.js'

// Registry for contractOverview (pages/tx/_txhash.vue), replacing what was
// previously a single ~3200-line computed with 15 sequential if/else-if
// branches. Each module exports one build<Product>Overview(ctx) function:
// returns null when it doesn't match, or the full overview object when it
// does — a direct translation of each branch's original
// `if (matchCondition) { ...; return {...} }` shape.
//
// Order matters and is preserved exactly from the source: DAO proposal and
// Order Book Clearing operate on the whole contractActions array and run
// before the mixed-action guard; everything else operates on a single
// contract action (ctx.singleAction) and runs after it; the CALC aggregate
// fallback always runs last and reads ctx.rawActions directly. Two known
// key collisions in the source (DAO proposal vs. CALC batch execute both
// keying off msg.execute; Yielding bond/unbond vs. Ghost Credit borrow
// both keying off msg.account) are disambiguated by each module's own
// sub-condition, not by registry order — but the order is kept identical
// to the source regardless, since this is a mechanical move, not a
// redesign.

export const PRE_GUARD_BUILDERS = [
  buildDaoProposalOverview,
  buildOrderBookClearingOverview,
]

export const SINGLE_ACTION_BUILDERS = [
  buildLimitOrderOverview,
  buildCancelStrategyOverview,
  buildFinMarketSwapOverview,
  buildLiquidBondOverview,
  buildStakingRewardsClaimOverview,
  buildYieldingStakingBondOverview,
  buildGhostCreditLiquidationOverview,
  buildGhostCreditBorrowOverview,
  buildAutoRujiraResetInstanceOverview,
  buildCclRangeCreateOverview,
  buildCclRangeClaimOverview,
  buildCclRangeTransferOverview,
  buildGhostVaultOverview,
  buildCalcSchedulerBatchExecuteOverview,
]

export { buildCalcAggregateOverview }
