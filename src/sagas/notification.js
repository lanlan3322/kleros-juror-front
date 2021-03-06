import { eventChannel } from 'redux-saga'

import {
  fork,
  take,
  race,
  takeLatest,
  select,
  call,
  put
} from 'redux-saga/effects'

import * as notificationActions from '../actions/notification'
import * as walletSelectors from '../reducers/wallet'
import * as walletActions from '../actions/wallet'
import { kleros } from '../bootstrap/dapp-api'
import { action } from '../utils/action'
import { lessduxSaga } from '../utils/saga'

/**
 * Listens for push notifications.
 */
function* pushNotificationsListener() {
  // Start after receiving accounts
  yield take(walletActions.accounts.RECEIVE)
  while (true) {
    const account = yield select(walletSelectors.getAccount) // Cache current account

    // Fetch full list
    yield put(action(notificationActions.notifications.FETCH))
    yield put(action(notificationActions.pendingActions.FETCH))
    yield take(notificationActions.notifications.RECEIVE)
    yield take(notificationActions.pendingActions.RECEIVE)

    // Set up event channel with subscriber
    const channel = eventChannel(emitter => {
      kleros.watchForEvents(account, notification => emitter(notification))

      return kleros.stopWatchingForEvents // Unsubscribe function
    })

    // Keep listening while on the same account
    while (account === (yield select(walletSelectors.getAccount))) {
      const [notification, accounts] = yield race([
        take(channel), // New notifications
        take(walletActions.accounts.RECEIVE) // Accounts refetch
      ])
      if (accounts) continue // Possible account change

      // Put new notification
      yield put(
        action(notificationActions.notification.RECEIVE, {
          collectionMod: {
            collection: notificationActions.notifications.self,
            resource: notification
          }
        })
      )
    }

    // We changed accounts, so close the channel. This calls unsubscribe under the hood which clears handlers for the old account
    channel.close()
  }
}

/**
 * Fetches the current account's notifications.
 * @returns {object[]} - The notifications.
 */
function* fetchNotifications() {
  return yield call(
    kleros.notifications.getUnreadStoredNotifications,
    yield select(walletSelectors.getAccount)
  )
}

/**
 * Dismisses a notification.
 * @returns {object[]} - The updated notifications list.
 */
function* dismissNotification({ payload: { txHash, logIndex } }) {
  yield call(
    kleros.notifications.markStoredNotificationAsRead,
    yield select(walletSelectors.getAccount),
    txHash,
    logIndex
  )
  return {
    collection: notificationActions.notifications.self,
    find: n => n.txHash === txHash && n.logIndex === logIndex
  }
}

/**
 * Fetches the current account's pending actions.
 * @returns {object[]} - The pending actions.
 */
function* fetchPendingActions() {
  return yield call(
    kleros.notifications.getStatefulNotifications,
    yield select(walletSelectors.getAccount),
    true
  )
}

/**
 * The root of the notification saga.
 */
export default function* notificationSaga() {
  // Listeners
  yield fork(pushNotificationsListener)

  // Notifications
  yield takeLatest(
    notificationActions.notifications.FETCH,
    lessduxSaga,
    'fetch',
    notificationActions.notifications,
    fetchNotifications
  )

  // Notification
  yield takeLatest(
    notificationActions.notification.DISMISS,
    lessduxSaga,
    'update',
    notificationActions.notification,
    dismissNotification
  )

  // Pending Actions
  yield takeLatest(
    notificationActions.pendingActions.FETCH,
    lessduxSaga,
    'fetch',
    notificationActions.pendingActions,
    fetchPendingActions
  )
}
