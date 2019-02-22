import React from 'react';
import Link from '../../Link';
import Button from '../../Button';
import {isWatch} from "../../Utils";

const RepositoryItem = ({
    id,
    name,
    url,
    descriptionHTML,
    primaryLanguage,
    owner,
    stargazers,
    watchers,
    viewerSubscription,
    viewerHasStarred,
    addStar,
    removeStar,
    onWatch
}) => (
    <div>
        <div className="RepositoryItem-title">
            <h2>
                <Link href={url}>{name}</Link>
            </h2>
        </div>
        <Button
            className="RepositoryItem-title-action"
            onClick={(id, viewerSubscription) => onWatch(id, viewerSubscription)}
        >
            {watchers.totalCount}{' '}
            {isWatch(viewerSubscription) ? 'Unwatch' : 'Watch'}
        </Button>
        {!viewerHasStarred ? (
            <Button
                className={'RepositoryItem-title-action'}
                onClick={() => addStar(id)}
            >
                {stargazers.totalCount} Star
            </Button>
        ) : (
            <Button
                className={'RepositoryItem-title-action'}
                onClick={() => removeStar(id)}
            >
                {stargazers.totalCount} Remove Star
            </Button>
        )}

        {/* Here comes your updateSubscription mutation */}
        <div className="RepositoryItem-description">
            <div
                className="RepositoryItem-description-info"
                dangerouslySetInnerHTML={{ __html: descriptionHTML }}
            />
            <div className="RepositoryItem-description-details">
                <div>
                    {primaryLanguage && (
                        <span>Language: {primaryLanguage.name}</span>
                    )}
                </div>
                <div>
                    {owner && (
                        <span>
              Owner: <a href={owner.url}>{owner.login}</a>
            </span>
                    )}
                </div>
            </div>
        </div>
    </div>
);

export default RepositoryItem;