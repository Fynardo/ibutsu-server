import PropTypes from 'prop-types';
import React from 'react';

import {
  Button,
  EmptyState,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateBody,
  Text
} from '@patternfly/react-core';
import {
  SearchIcon
} from '@patternfly/react-icons';

import { NavLink } from 'react-router-dom';

export class EmptyObject extends React.Component {
  static propTypes = {
    headingText: PropTypes.string,
    bodyText: PropTypes.string,
    returnLink: PropTypes.string,
    returnLinkText: PropTypes.string
  };
  render() {
    return (
      <React.Fragment>
        <EmptyState>
          <EmptyStateHeader icon={<EmptyStateIcon icon={SearchIcon} />} />
            <Text component="h1" size="lg">
              {this.props.headingText ? this.props.headingText : 'This object couldn\'t be found.'}
            </Text>
          <EmptyStateBody>
            {this.props.bodyText ? this.props.bodyText : 'Either the object doesn\'t exist or the ID is invalid.'}
          </EmptyStateBody>
          <EmptyStateFooter>
            <NavLink style={{ color: 'white' }} to={!this.props.returnLink ?  '' : this.props.returnLink}>
              <Button variant="primary" style = {{ margin: '25px' }}>
                {this.props.returnLinkText ? this.props.returnLinkText : 'Return to dashboard'}
              </Button>
            </NavLink>
          </EmptyStateFooter>
        </EmptyState>
      </React.Fragment>
    );
  }
}
