import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import {
  Checkbox,
  Form,
  FormGroup,
  FormHelperText,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  Modal,
  ModalVariant,
  Radio,
  Stack,
  StackItem,
  Text,
  TextArea,
  TextContent,
  TextInput,
  Title,
  Wizard,
  WizardHeader,
  WizardStep,
} from '@patternfly/react-core';

import {
  Tbody,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from '@patternfly/react-table';
import Linkify from 'react-linkify';
import { linkifyDecorator } from './decorators';

import { HttpClient } from '../services/http';
import { Settings } from '../settings';


const NewWidgetWizard = (props) =>{
  const {
    dashboard,
    saveCallback,
    closeCallback,
    isOpen
  } = props;

  const [widgetTypes, setWidgetTypes] = useState([]);
  const [title, setTitle] = useState('');
  const [params, setParams] = useState({});
  const [weight, setWeight] = useState(0);
  const [titleValid, setTitleValid] = useState(false);
  const [paramsFilled, setParamsFilled] = useState(false);
  const [selectedType, setSelectedType] = useState({});
  const [selectedTypeId, setSelectedTypeId] = useState();
  const [stepIdReached, setStepIdReached] = useState(1);

  const clearState = () => {
    setTitle('');
    setParams({});
    setWeight(0);
    setTitleValid(false);
    setParamsFilled(false);
    setSelectedType();
    setSelectedTypeId();
    setStepIdReached(1);
  };

  const onSave = () => {
    let newParams = {};
    Object.entries(params).forEach(paramPair => {
      const param = selectedType.params?.find(el => el.name === paramPair[0]);
      if (param) {
        // Some values need to be typecast/parsed
        let newValue = paramPair[1];
        if (param.type === 'float') {
          newValue = parseFloat(newValue);
        }
        else if (param.type === 'integer') {
          newValue = parseInt(newValue);
        }
        else if (param.type === 'list') {
          newValue = newValue.split('\n').map(val => val.trim());
        }
        newParams[paramPair[0]] = newValue;
      }
    });
    const newWidget = {
      title: title,
      params: newParams,
      weight: parseInt(weight),
      type: 'widget',
      widget: selectedTypeId
    };
    if (dashboard) {
      newWidget.dashboard_id = dashboard.id;
      newWidget.project_id = dashboard.project_id;
    }
    saveCallback(newWidget);
    clearState();
  };

  const onClose = () => {
    clearState();
    closeCallback();
  };

  const onSelectType = (_, event) => {
    setSelectedTypeId(event.currentTarget.value);
    let target_type = null;
    let target_params = {};
    widgetTypes.forEach(widgetType => {
      if (widgetType.id === event.currentTarget.value) {
        target_type = widgetType;
        widgetType.params.forEach(param => {
          let paramDefault = '';
          if (param.default) {
            // if the widget has a default defined, use that
            paramDefault = param.default;
          }
          else if (param.type === 'integer' || param.type === 'float') {
            // NOTE: This is a somewhat arbitrary value, numeric parameters should have sensible
            //       defaults provided in constants.py
            paramDefault = 3;
          }
          else if (param.type === 'boolean') {
            paramDefault = false;
          }
          target_params[param.name] = paramDefault;
        });
      }
    });
    setSelectedType(target_type);
    setParams(target_params);
  };

  const onTitleChange = (value) => {
    setTitle(value);
    setTitleValid((value !== ''));
  };

  const onParamChange = (value, event) => {
    let areParamsFilled = true;
    if (event) {
      setParams({
        ...params,
        [event.target.name]: value
      });
    }
    selectedType?.params?.forEach(widgetParam => {
      if ((widgetParam.required) && (!params[widgetParam.name])) {
        areParamsFilled = false;
      }
    });
    setParamsFilled(areParamsFilled);
  };

  const handleRequiredParam = (param) => {
    if (param.required) {
      if (params[param.name] === '') {
        return 'error';
      }
    }
    // TODO: Handle parameter types
    return 'default';
  };

  const onNext = (_event, currentStep) => {
    if (currentStep.id === 3) {
      onParamChange('', null);
    }
    setStepIdReached(Math.max(stepIdReached, currentStep.id));
  };

  useEffect(() => {
    HttpClient.get([Settings.serverUrl, 'widget', 'types'], {'type': 'widget'})
      .then(response => HttpClient.handleResponse(response))
      .then(data => {setWidgetTypes(data.types);})
      .catch((error) => console.error(error));
  }, []);

  const steps = [
    {
      id: 1,
      name: 'Select type',
      enableNext: selectedTypeId,
      component: (
        <Form>
          <Title headingLevel="h1" size="xl">Select a widget type</Title>
          {widgetTypes.map(widgetType => (
            <div key={widgetType.id}>
              <Radio id={widgetType.id} value={widgetType.id} label={widgetType.title} description={widgetType.description} isChecked={selectedTypeId === widgetType.id} onChange={(event, _) => onSelectType(_, event)}/>
            </div>
          ))}
        </Form>
      )
    },
    {
      id: 2,
      name: 'Set info',
      canJumpTo: stepIdReached >= 2,
      enableNext: titleValid,
      component: (
        <Form isHorizontal>
          <Title headingLevel="h1" size="xl">Set widget information</Title>
          <FormGroup label="Title" fieldId="widget-title" isRequired>
            <TextInput type="text" id="widget-title" name="widget-title" value={title} onChange={(_event, value) => onTitleChange(value)} validated={titleValid.toString()} isRequired />
            {titleValid !== true && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">
                  Please enter a title for this widget
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
          <FormGroup label="Weight" fieldId="widget-weight">
            <TextInput type="number" id="widget-weight" name="widget-weight" value={weight} onChange={(_event, value) => setWeight(value)} />
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant="default">
                  How widgets are ordered on the dashboard
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
        </Form>
      )
    },
    {
      id: 3,
      name: 'Set parameters',
      canJumpTo: stepIdReached >= 3,
      enableNext: paramsFilled,
      component: (
        <Form isHorizontal>
          <Title headingLevel="h1" size="xl">Set widget parameters</Title>
          {!!selectedType && selectedType.params?.map(param => (
            <React.Fragment key={param.name}>
              {(param.type === 'string' || param.type === 'integer' || param.type === 'float') &&
                <FormGroup
                  label={param.name}
                  fieldId={param.name}
                  isRequired={param.required}>
                  <TextInput
                    value={params[param.name]}
                    type={(param.type === 'integer' || param.type === 'float') ? 'number' : 'text'}
                    id={param.name}
                    aria-describedby={`${param.name}-helper`}
                    name={param.name}
                    onChange={(event, value) => onParamChange(value, event)}
                    isRequired={param.required}
                    validated={handleRequiredParam(param)}
                  />
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem variant="default">
                        <Linkify componentDecorator={linkifyDecorator}>
                          {param.description}
                        </Linkify>
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                </FormGroup>
              }
              {param.type === 'boolean' &&
                <FormGroup
                  label={param.name}
                  fieldId={param.name}
                  isRequired={param.required}
                  hasNoPaddingTop>
                  <Checkbox
                    isChecked={params[param.name]}
                    onChange={(event, value) => onParamChange(value, event)}
                    id={param.name}
                    name={param.name}
                    label={param.description} />
                </FormGroup>
              }
              {param.type === 'list' &&
                <FormGroup
                  label={param.name}
                  fieldId={param.name}
                  helperText={`${param.description}. Place items on separate lines.`}>
                  isRequired={param.required}
                  <TextArea
                    id={param.name}
                    name={param.name}
                    isRequired={param.required}
                    value={params[param.name]}
                    onChange={(event, value) => onParamChange(value, event)}
                    resizeOrientation='vertical' />
                </FormGroup>
              }
            </React.Fragment>
          ))}
        </Form>
      )
    },
    {
      id: 4,
      name: 'Review details',
      canJumpTo: stepIdReached >= 4,
      enableNext: true,
      nextButtonText: 'Finish',
      component: (
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h1" size="xl">Review details</Title>
          </StackItem>
          <StackItem>
            <Grid hasGutter>
              <GridItem span="2">
                <Title headingLevel="h4">Title</Title>
              </GridItem>
              <GridItem span="10">
                <TextContent><Text>{title}</Text></TextContent>
              </GridItem>
              <GridItem span="2">
                <Title headingLevel="h4">Weight</Title>
              </GridItem>
              <GridItem span="10">
                <TextContent><Text>{weight}</Text></TextContent>
              </GridItem>
              <GridItem span="2">
                <Title headingLevel="h4">Parameters</Title>
              </GridItem>
              <GridItem span="10">
                <Table
                  variant="compact"
                  borders={true}
                  aria-label="Parameters">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Value</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {Object.entries(params).map(param => (
                      <Tr key={param[0]}>
                        <Td>{param[0]}</Td>
                        <Td>{param[1].toString()}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </GridItem>
            </Grid>
          </StackItem>
        </Stack>
      )
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      variant={ModalVariant.large}
      showClose={false}
      onClose={onClose}
      hasNoBodyWrapper
      aria-label='Add widget modal'
    >
      <Wizard
        height={400}
        header={
          <WizardHeader
            onClose={onClose}
            title="Add Widget"
            description="Add a widget to the current dashboard"
          />
        }
        onStepChange={onNext}
        onSave={onSave}
        onClose={onClose}
      >
        {steps.map(step => (
          <WizardStep
            key={step.id}
            name={step.name}
            id={step.id}
            footer={{ isNextDisabled: !step.enableNext, nextButtonText: step.nextButtonText? step.nextButtonText : 'Next' }}
          >
            {step.component}
          </WizardStep>
        ))}
      </Wizard>
    </Modal>
  );
};

NewWidgetWizard.propTypes = {
  dashboard: PropTypes.object,
  saveCallback: PropTypes.func,
  closeCallback: PropTypes.func,
  isOpen: PropTypes.bool
};

export default NewWidgetWizard;
