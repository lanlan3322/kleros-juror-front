import { createActions } from 'lessdux'

/* Actions */

// PNK Balance
export const PNKBalance = {
  ...createActions('$PNK$_BALANCE', { withUpdate: true }),
  BUY: 'BUY_PNK',
  ACTIVATE: 'ACTIVATE_PNK'
}

// Arbitrator Data
export const arbitratorData = {
  ...createActions('ARBITRATOR_DATA', { withUpdate: true }),
  PASS_PERIOD: 'PASS_PERIOD'
}

/* Action Creators */

// PNK Balance
export const fetchPNKBalance = () => ({ type: PNKBalance.FETCH })
export const buyPNK = formData => ({
  type: PNKBalance.BUY,
  payload: { amount: formData.amount }
})
export const activatePNK = formData => ({
  type: PNKBalance.ACTIVATE,
  payload: { amount: formData.amount }
})

// Arbitrator Data
export const fetchArbitratorData = () => ({ type: arbitratorData.FETCH })
export const passPeriod = () => ({ type: arbitratorData.PASS_PERIOD })
