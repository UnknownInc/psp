import React, {Component} from 'react';
import TagsEditor from 'react-tageditor';

import 'react-tageditor/dist/style/default.css';
import { Form, Dropdown, Header, Segment, Table, Icon, Checkbox, Button, Divider, Message, Popup, Responsive,Modal, FormButton } from 'semantic-ui-react';

import { notify } from 'react-notify-toast'

import Spinner from '../../components/Spinner'
import { QUESTIONS_API, getHeaders } from '../../config'


export default class QuestionSet extends Component {
  constructor(props){
    super(props);
    this.state={
      loading:true
    }
  }

  componentDidMount(){
    this.loadQuestionSets();
  }

  loadQuestionSets=async ()=>{
    this.setState({loading: true, error:null})
    try {
      
    } catch (err) {

    }
  }

  renderError(){
    const {error=null} = this.state;
    if (error==null) return null
    return <Message error header={error.header} list={error.messages} />
  }

  renderFilterBar(){
    const {filterbar=false} = this.props;

    if (!filterbar) {
      return null;
    }

    return <Segment basic>

    </Segment>
  }

  render() {
    return <Segment>
      <Header as={'h2'}>Question Sets</Header>
      {this.renderFilterBar()}
      <Divider/>
      {this.renderError()}
    </Segment>
  }
}
