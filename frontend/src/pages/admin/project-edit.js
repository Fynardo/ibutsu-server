import React from 'react';
import PropTypes from 'prop-types';

import {
  ActionGroup,
  Alert,
  Button,
  Card,
  CardBody,
  Form,
  FormGroup,
  PageSection,
  PageSectionVariants,
  Select,
  SelectVariant,
  SelectOption,
  TextInput,
  Title
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';

import { HttpClient } from '../../services/http';
import { Settings } from '../../settings';


function userToOption(user) {
  if (!user) {
    return '';
  }
  return {
    user: user,
    toString: function () { return this.user.name; },
    compareTo: function (value) {
      if (value.user) {
        return this.user.id === value.user.id;
      }
      return this.user.name.toLowerCase().includes(value.toLowerCase()) ||
        this.user.email.includes(value.toLowerCase());
    }
  };
}

export class ProjectEdit extends React.Component {
  static propTypes = {
    match: PropTypes.object,
    history: PropTypes.object,
    location: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = {
      id: props.match.params.id,
      project: null,
      users: [],
      owner: null,
      isOwnerOpen: false,
      filter: ''
    };
  }

  onProjectNameChanged = (value) => {
    const { project } = this.state;
    project.name = value;
    this.setState({project});
  }

  onProjectTitleChanged = (value) => {
    const { project } = this.state;
    project.title = value;
    this.setState({project});
  }

  onSubmitClick = () => {
    const { project, owner } = this.state;
    project.owner_id = owner && owner.user ? owner.user.id : null;
    delete project.owner;
    this.saveProject(project.id || null, project)
      .then(() => this.props.history.goBack())
      .catch((error) => console.error(error));
  };

  onOwnerToggle = (isOpen) => {
    this.setState({isOwnerOpen: isOpen});
  };

  onOwnerSelect = (event, value, isPlaceholder) => {
    if (isPlaceholder) {
      this.onOwnerClear();
    }
    else {
      this.setState({owner: value, isOwnerOpen: false});
    }
  };

  onOwnerClear = () => {
    this.setState({
      owner: null,
      isOwnerOpen: false
    });
  }

  onOwnerChanged = (value) => {
    this.setState({filter: value}, this.getUsers);
  }

  getProject(projectId) {
    HttpClient.get([Settings.serverUrl, 'admin', 'project', projectId])
      .then(response => {
        response = HttpClient.handleResponse(response, 'response');
        return response.json();
      })
      .then(project => {
        this.setState({project: project, owner: userToOption(project.owner)})
      })
      .catch(error => console.error(error));
  }

  getUsers() {
    const params = {};
    if (this.state.filter) {
      params['filter'] = ['name%' + this.state.filter];
    }
    HttpClient.get([Settings.serverUrl, 'admin', 'user'], params)
      .then(response => {
        response = HttpClient.handleResponse(response, 'response');
        return response.json();
      })
      .then(data => this.setState({users: data.users}))
      .catch(error => console.error(error));
  }

  saveProject(projectId, project) {
    let request = null;
    if (!projectId) {
      request = HttpClient.post([Settings.serverUrl, 'admin', 'project'], project);
    }
    else {
      request = HttpClient.put([Settings.serverUrl, 'admin', 'project', projectId], {}, project);
    }
    return request.then(response => HttpClient.handleResponse(response, 'response'))
      .then(response => response.json());
  }

  componentDidMount() {
    if (this.state.id === 'new') {
      this.setState({project: {title: 'New project', name: 'new-project'}});
    }
    else {
      this.getProject(this.state.id);
    }
    this.getUsers();
  }

  render() {
    const { project, users, owner } = this.state;
    return (
      <React.Fragment>
        <PageSection variant={PageSectionVariants.light}>
          <Title headingLevel="h1" size='2xl' className="pf-c-title">
            Projects / {project && project.title}
          </Title>
        </PageSection>
        <PageSection>
          {!project && <Alert variant="info" title="Loading..." />}
          {project &&
          <Card>
            <CardBody>
              <Form>
                <FormGroup label="Title" isRequired fieldId="projectTitle" helperText="The project's friendly name">
                  <TextInput
                    isRequired
                    type="text"
                    id="projectTitle"
                    name="projectTitle"
                    aria-describedby="The project's friendly name"
                    value={project.title}
                    onChange={this.onProjectTitleChanged}
                  />
                </FormGroup>
                <FormGroup label="Name" isRequired fieldId="projectName" helperText="The project's machine name">
                  <TextInput
                    isRequired
                    type="text"
                    id="projectName"
                    name="projectName"
                    aria-describedby="The project's machine name"
                    value={project.name}
                    onChange={this.onProjectNameChanged}
                  />
                </FormGroup>
                <FormGroup fieldId="owner" label="Owner" helperText="The user who owns the project">
                   <Select
                     variant={SelectVariant.typeahead}
                     typeAheadAriaLabel="Select user"
                     onToggle={this.onOwnerToggle}
                     onSelect={this.onOwnerSelect}
                     onClear={this.onOwnerClear}
                     onTypeaheadInputChanged={this.onOwnerChanged}
                     selections={owner}
                     isOpen={this.state.isOwnerOpen}
                     aria-labelledby="owner"
                     placeholderText="Select user"
                   >
                     {users.map(user => (
                       <SelectOption key={user.id} value={userToOption(user)} description={user.email} />
                     ))}
                   </Select>
                </FormGroup>
                <ActionGroup>
                  <Button
                    variant="primary"
                    ouiaId="admin-project-edit-save"
                    onClick={this.onSubmitClick}
                  >
                    Submit
                  </Button>
                  <Button
                    variant="secondary"
                    ouiaId="admin-project-edit-cancel"
                    component={(props: any) => <Link {...props} to="/admin/projects" />}
                  >
                    Cancel
                  </Button>
                </ActionGroup>
              </Form>
            </CardBody>
          </Card>
          }
        </PageSection>
      </React.Fragment>
    );
  }
}
