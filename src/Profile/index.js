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

const Profile = ({ data, loading, error, addStar, removeStar }) => {
    if (error) {
        return <ErrorMessage error={error} />;
    }

    const { viewer } = data;

    if (loading || !viewer) {
        return <Loading />;
    }

    return <RepositoryList addStar={id => addStar(id)} removeStar={id => removeStar(id)} repositories={viewer.repositories} />;
};

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


export default compose(query, addStarMutation, removeStarMutation)(Profile);
