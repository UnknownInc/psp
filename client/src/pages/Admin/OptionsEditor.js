import React, {Component} from 'react';

import 'react-tageditor/dist/style/default.css';
import { Form, Segment, Table, Icon, Input, Button, Message, Modal, List } from 'semantic-ui-react';

import { getHeaders } from '../../config'
//import Options from '../../domain/Options';

export default class OptionsEditor extends Component {
  constructor(props) {
    super(props);
    this.state={
      loading: true,
      options:[]
    }
    this.loadAllOptions = this.loadAllOptions.bind(this);
  }

  async componentDidMount() {
    try {
      await this.loadAllOptions();
    } catch (err) {
      console.error(err);
    }
  }

  async loadAllOptions(e) {
    if (e) { e.preventDefault()}
    this.setState({loading: true, errorHdr: null, errors:[]})
    const errorHdr = 'Unable to load the options.';
    const errors=[];
    try {
      const response = await fetch('/api/options/',{
        headers: getHeaders()
      });

      if (response.ok) {
        const options = await response.json();
        this.setState({options, loading: false, errorHdr: null, errors:[]});
        return;
      }

      this.setState({loading: false, errorHdr, errors});
    } catch(err) {
      console.error(err);
      this.setState({loading: false, errorHdr, errors})
    }
  }

  addNewOption = async (e) => {
    //if (e) { e.preventDefault()}
    this.setState({loading: true, errorHdr: null, errors:[]})
    const errorHdr = 'Unable to create new option.';
    const errors=[];
    try {
      const body={};
      body.name=this.state.newoptionname;
      body.options=[];
      const headers=getHeaders();
      headers['content-type']='application/json';
      const response = await fetch('/api/options/',{
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) { throw response }

      const option = await response.json();
      const options=[...this.state.options,   option];
      this.setState({options, loading: false, errorHdr: null, errors:[]});
    } catch (err) {
      if (err.status===400) {
        err.json().then(data=>{
          errors.push(data.error)
          this.setState({loading: false, errorHdr, errors})
        })
        return;
      }
      console.dir(err);
      this.setState({loading: false, errorHdr, errors})
    }
  }

  updateOption = async (op) => {
    const errorHdr = 'Unable to add new value to the option.';
    const errors=[];
    try {
      const body={...op};

      const headers=getHeaders();
      headers['content-type']='application/json'; 
      const response = await fetch('/api/options/'+op._id,{
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      })

      if (response.ok) {
          const op=await response.json();
          const options=[...this.state.options];
          for(let i=0;i<options.list;i++) {
            if (options[i]._id===op._id) {
              options[i].name=op.name;
              options.options=op.options;
              return this.setState({options});
            }
          }
      }
      this.setState({errorHdr, errors})
    } catch (err) {
      console.error(err);
      this.setState({errorHdr, errors})
    }
  }

  updateNewValue(id, newvalue) {
    const options = [...this.state.options];
    for(let i=0;i<options.length;i++) {
      if (options[i]._id===id) {
        options[i].newvalue = newvalue;
        return this.setState({options});
      }
    }

  }

  renderAddOption(){
    const {newoptionname, nerror} = this.state;
    return <Modal trigger={<Button icon={<Icon.Group>
        <Icon name='list' />
        <Icon corner name='add' />
      </Icon.Group>} content='New Option'/>} >
        <Modal.Header>New Option</Modal.Header>
        <Modal.Content>
          <Modal.Description>
            <Form>
              <Form.Field>
                <label>Option Name</label>
                <Input value={newoptionname} placeholder={'option name'} 
                  onChange={(e)=>{
                    //const i=e.target.value.indexOf('@');
                    let nerror='invalid option name'
                    if (e.target.value!=='') {
                      nerror=null;
                    }
                    this.setState({newoptionname: e.target.value, nerror});
                  }}
                  />
              </Form.Field>
            </Form>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button color='green' icon='check' onClick={this.addNewOption} content={'Add'} disabled={nerror!==null} type='submit'/>
        </Modal.Actions>
      </Modal>
  }
  renderError() {
    const {errorHdr, errors=[]} = this.state;
    if (!errorHdr) return null
    return <Message error header={errorHdr} list={errors} />
  }

  render(){
    return <Segment loading={this.state.loading}>
      {this.renderError()}
      {this.renderAddOption()}
      <Table compact celled selectable sortable striped>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Option</Table.HeaderCell>
            <Table.HeaderCell>Values</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
        {this.state.options.map((op)=>{
          return <Table.Row key={op._id}>
            <Table.Cell >{op.name}</Table.Cell>
            <Table.Cell>
              <Input placeholder={'new value'} 
                action={<Button content='Add Value' icon='plus' onClick={async e=>{
                  e.preventDefault();
                  op.options.push(op.newvalue);
                  op.newvalue=undefined;
                  await this.updateOption(op);
                }}/>}
                value={op.newvalue} onChange={e=>{
                  this.updateNewValue(op._id, e.target.value)
                }}
              />
              <List as='ul'>
                {op.options.map((v,i)=>{
                  return <List.Item key={i} as='li'>{v}</List.Item>
                })}
              </List>
            </Table.Cell>
          </Table.Row>
        })}
      </Table.Body>
    </Table>
  </Segment>
  }
}