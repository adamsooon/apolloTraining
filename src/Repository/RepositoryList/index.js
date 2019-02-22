import React from 'react';

import RepositoryItem from '../RepositoryItem';

import '../style.css';

const RepositoryList = ({ repositories, addStar, removeStar, onWatch }) =>
    repositories.edges.map(({ node }) => (
        <div key={node.id} className="RepositoryItem">
            <RepositoryItem {...node} addStar={addStar} removeStar={removeStar} onWatch={onWatch}/>
        </div>
    ));

export default RepositoryList;