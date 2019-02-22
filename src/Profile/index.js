import React from 'react';
import gql from 'graphql-tag';


import RepositoryList, { REPOSITORY_FRAGMENT } from '../Repository';
import Loading from '../Loading';
import ErrorMessage from '../Error';
import {compose, graphql} from 'react-apollo';

const GET_REPOSITORIES_OF_CURRENT_USER = gql`
  {
    viewer {
      repositories(
        first: 5
        orderBy: { direction: DESC, field: STARGAZERS }
      ) {
        edges {
          node {
            ...repository
          }
        }
      }
    }
  }

  ${REPOSITORY_FRAGMENT}
`;

const ADD_STAR_MUTATION = gql`
  mutation($id: ID!) {
    addStar(input: { starrableId: $id }) {
      starrable {
        id
        viewerHasStarred
      }
    }
  }
`;

const REMOVE_STAR_MUTATION = gql`
  mutation($id: ID!) {
    removeStar(input: { starrableId: $id }) {
      starrable {
        id
        viewerHasStarred
      }
    }
  }
`;

const WATCH_REPOSITORY = gql`
  mutation ($id: ID!, $viewerSubscription: SubscriptionState!) {
    updateSubscription(
      input: { state: $viewerSubscription, subscribableId: $id }
    ) {
      subscribable {
        id
        viewerSubscription
      }
    }
  }
`;

const Profile = ({ data, loading, error, addStar, removeStar, watchRepository }) => {
    if (error) {
        return <ErrorMessage error={error} />;
    }

    const { viewer } = data;

    if (loading || !viewer) {
        return <Loading />;
    }

    return <RepositoryList addStar={id => addStar(id)} removeStar={id => removeStar(id)} onWatch={(id, viewerSubscription) => watchRepository(id, viewerSubscription)} repositories={viewer.repositories} />;
};

const VIEWER_SUBSCRIPTIONS = {
    SUBSCRIBED: 'SUBSCRIBED',
    UNSUBSCRIBED: 'UNSUBSCRIBED',
};

const isWatch = viewerSubscription =>
    viewerSubscription === VIEWER_SUBSCRIPTIONS.SUBSCRIBED;

const updateAddStar = (
    client,
    {
        data: {
            addStar: {
                starrable: { id, viewerHasStarred },
            },
        },
    },
) =>
    client.writeFragment({
        id: `Repository:${id}`,
        fragment: REPOSITORY_FRAGMENT,
        data: getUpdatedStarData(client, id, viewerHasStarred),
    });

const updateRemoveStar = (
    client,
    {
        data: {
            removeStar: {
                starrable: { id, viewerHasStarred },
            },
        },
    },
) => {
    client.writeFragment({
        id: `Repository:${id}`,
        fragment: REPOSITORY_FRAGMENT,
        data: getUpdatedStarData(client, id, viewerHasStarred),
    });
};

const getUpdatedStarData = (client, id, viewerHasStarred) => {
    const repository = client.readFragment({
        id: `Repository:${id}`,
        fragment: REPOSITORY_FRAGMENT,
    });

    let { totalCount } = repository.stargazers;
    totalCount = viewerHasStarred ? totalCount + 1 : totalCount - 1;

    return {
        ...repository,
        stargazers: {
            ...repository.stargazers,
            totalCount,
        },
    };
};

const updateWatch = (
    client,
    {
        data: {
            updateSubscription: {
                subscribable: { id, viewerSubscription },
            },
        },
    },
) => {
    const repository = client.readFragment({
        id: `Repository:${id}`,
        fragment: REPOSITORY_FRAGMENT,
    });

    let { totalCount } = repository.watchers;
    totalCount =
        viewerSubscription === VIEWER_SUBSCRIPTIONS.SUBSCRIBED
            ? totalCount + 1
            : totalCount - 1;

    client.writeFragment({
        id: `Repository:${id}`,
        fragment: REPOSITORY_FRAGMENT,
        data: {
            ...repository,
            watchers: {
                ...repository.watchers,
                totalCount,
            },
        },
    });
};

const query = graphql(GET_REPOSITORIES_OF_CURRENT_USER);
const addStarMutation = graphql(ADD_STAR_MUTATION, {props: ({ mutate }) => ({
        addStar: id => mutate({
            variables: { id },
            update: updateAddStar
        }),
    })});
const removeStarMutation = graphql(REMOVE_STAR_MUTATION, {props: ({ mutate }) => ({
        removeStar: id => mutate({
            variables: { id },
            update: updateRemoveStar
        }),
    })});

const watchMutation = graphql(WATCH_REPOSITORY, {props: ({ mutate }) => ({
        watchRepository: (id, viewerSubscription) => mutate({
            variables: {
                id,
                viewerSubscription: isWatch(viewerSubscription)
                    ? VIEWER_SUBSCRIPTIONS.UNSUBSCRIBED
                    : VIEWER_SUBSCRIPTIONS.SUBSCRIBED,
            },
            optimisticResponse: {
                updateSubscription: {
                    __typename: 'Mutation',
                    subscribable: {
                        __typename: 'Repository',
                        id,
                        viewerSubscription: isWatch(viewerSubscription)
                            ? VIEWER_SUBSCRIPTIONS.UNSUBSCRIBED
                            : VIEWER_SUBSCRIPTIONS.SUBSCRIBED,
                    },
                },
            },
            update: updateWatch
        }),
    })});


export default compose(query, addStarMutation, removeStarMutation, watchMutation)(Profile);
