export const VIEWER_SUBSCRIPTIONS = {
    SUBSCRIBED: 'SUBSCRIBED',
    UNSUBSCRIBED: 'UNSUBSCRIBED',
};

export const isWatch = viewerSubscription =>
    viewerSubscription === VIEWER_SUBSCRIPTIONS.SUBSCRIBED;