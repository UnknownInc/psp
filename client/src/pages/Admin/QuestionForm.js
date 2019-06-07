import React, {Component} from 'react';
import TagsEditor from 'react-tageditor';

import 'react-tageditor/dist/style/default.css';
import { Form, Dropdown, Header, Segment, Table, Icon, Checkbox, Button, Divider, Message, Popup, Responsive,Modal, FormButton } from 'semantic-ui-react';

const categories = [
  {key:"culture", text:"Culture", value:"Culture"},
  {key:"engagement", text:"Engagement", value:"Engagement"},
  {key:"leaders", text:"Leaders", value:"Leaders"},
  {key:"Manager", text:"Manager", value:"Manager"},
  {key:"not_categorized", text:"Not Categorized", value:"Not Categorized"},
  {key:"team", text:"Team", value:"Team"},
  {key:"work_environment", text:"Work Environment", value:"Work Environment"}
];

export default class QuestionForm extends Component {
  constructor(props) {
    super(props)
    const query=Object.assign({
      question:"",
      category:"",
      options:[], 
      tags:[],
    }, props.question);
    this.state={query};
  }

  handleQuestionChange=event=>{
    const query = {...this.state.query}
    query.question=event.target.value;
    this.setState({query})
  }

  handleSubmit =event=>{
    event.preventDefault()
    if (this.props.onChange) {
      this.props.onChange(this.state.query);
    }
  }

  handleCategoryChange = (event,{value}) => {
    const query = {...this.state.query};
    query.category=value;
    this.setState({query})
  }

  handleTagsChange = (tagsChanged, allTags, action) =>{
    const query = {...this.state.query};
    query.tags=allTags;
    this.setState({query})
  }

  handleAddOption = event => {
    event.preventDefault()
    const query = {...this.state.query};
    let op="a";
    if (query.options.length>0) {
      op=String.fromCharCode(query.options[query.options.length-1].option.charCodeAt(0)+1)+"";
    }
    query.options.push({option:op, value:""});
    this.setState({query})
  }

  handleOptionChange = (option, value) => {
    const query = {...this.state.query};
    let options=[];
    query.options.forEach(op => {
      if (op.option===option) {
        options.push({option:option,value: value});
      } else {
        options.push({...op});
      }
    });
    query.options = options;
    this.setState({query})
  }

  handleDeleteOption = (option) => {
    const query = {...this.state.query};
    let nextOption="a";
    let options=[];
    query.options.forEach(op => {
      if (op.option===option) {
        nextOption=option;
      } else {
        options.push({option:nextOption,value: op.value});
        nextOption=String.fromCharCode(nextOption.charCodeAt(0)+1)+"";
      }
    });
    query.options = options;
    this.setState({query})
  }

  handleMoveDown=option=>{
    const query = {...this.state.query};
    let options=[];
    for(var i=0;i<query.options.length;++i){
      if (query.options[i].option===option) {
        let option1={...query.options[i+1]};
        let option2={...query.options[i]}
        option2.option = option1.option;
        option1.option = option;
        options.push({...option1}); 
        options.push({...option2}); 
        ++i;
      } else {
        options.push({...query.options[i]});
      }
    };
    query.options = options;
    this.setState({query})
  }

  handleMoveUp = option =>{
    const query = {...this.state.query};
    let options=[];
    for(var i=0;i<query.options.length;++i){
      if (query.options[i+1] && query.options[i+1].option===option) {
        let option1={...query.options[i+1]};
        let option2={...query.options[i]}
        option1.option = option2.option;
        option2.option = option;
        options.push({...option1}); 
        options.push({...option2}); 
        ++i;
      } else {
        options.push({...query.options[i]});
      }
    };
    query.options = options;
    this.setState({query})
  }

  render(){
    const {query} = this.state;
    return <Segment>
      <Form onSubmit={this.handleSubmit}>
        <Form.Field>
          <label>Question:</label>
          <textarea value={query.question} onChange={this.handleQuestionChange} rows={2}/>
        </Form.Field>
        <Form.Field>
          <label>Category:</label>
          <Dropdown options={categories} fluid selection value={query.category} onChange={this.handleCategoryChange}/>
        </Form.Field>
        {query.options.map((o,i)=>{
          return <Form.Field key={""+i} inline>
            <div style={{display: "flex", flexDirection:"row", alignItems:'center'}}>
              <label>{o.option.toUpperCase()}:</label>
              {i<query.options.length-1?<Icon name="arrow down" onClick={()=>{
                this.handleMoveDown(o.option);
              }}/>:<Icon name=''/>}
              {i>0?<Icon name='arrow up' onClick={()=>{
                this.handleMoveUp(o.option);
              }}/>:<Icon name=''/>}
              <input value={o.value} onChange={event=>{
                this.handleOptionChange(o.option, event.target.value)
              }}/>
              <Button circular onClick={()=>{
                this.handleDeleteOption(o.option);
              }} icon="delete"/>
            </div>
          </Form.Field>
        })}
        <Form.Button onClick={this.handleAddOption}>Add Option</Form.Button>
      </Form>
      <br/><br/>
      <label>
      Tags:
      <TagsEditor tags={query.tags} delimiters={[","]} placeholder="tags" onChange={this.handleTagsChange}/>
      </label>
      <br/><br/>
      <div>
        <Button onClick={this.handleSubmit}>Update</Button>
        <Button onClick={this.props.onClose} floated="right">Cancel</Button>
      </div>
    </Segment>
  }
}
