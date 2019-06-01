import React, {Component} from 'react';
import uuidv1 from 'uuid/v1';
import csv from "fast-csv";

import { notify } from 'react-notify-toast'

import { QUESTIONS_API, getHeaders } from '../../config'
import QuestionForm from './QuestionForm';
import { Form, Header, Segment, Table, Icon, Checkbox, Button, Divider, Message, Popup, Responsive,Modal, FormButton, Tab } from 'semantic-ui-react';
import Page from '../../components/Page';
import ResponsiveButton from '../../components/ResponsiveButton';
import QuestionSet from './QuestionSet';
/*
const get = (obj, path, defaultValue) => path.split(".")
.reduce((a, c) => (a && a[c] ? a[c] : (defaultValue || null)), obj)

const set = (obj, path, value) => {
  if (Object(obj) !== obj) return obj; // When obj is not an object
  const p = path.split("."); // Get the keys from the path
  p.slice(0,-1).reduce((a, c, i) => // Iterate all of them except the last one
       Object(a[c]) === a[c] // Does the key exist and is its value an object?
           // Yes: then follow that path
           ? a[c] 
           // No: create the key. Is the next key a potential array-index?
           : a[c] = Math.abs(p[i+1])>>0 === +p[i+1] 
                 ? [] // Yes: assign a new array object
                 : {}, // No: assign a new plain object
       obj)[p.pop()] = value; // Finally assign the value to the last key
  return obj; // Return the top-level object to allow chaining
};
*/

class AdminQuestionsPage extends Component {
  constructor(props) {
    super(props);

    this.fileInput = React.createRef();

    this.state={
      openEditModal: false,
      openUploadModal: false,
      openNewSetModal:false,
      loading: true,
      questionSetList:[{key:'default', text:'default', value:'default'}],
      questionSet:'default',
      items:[],
      deletedItems:[],
      filePreview:"",
      fileData:"",
      isNotAuthorized: true,
      sortColumn:null,
      sortDirection: null,
      allSelected: false
    }
  }

  componentDidMount() {
    this.setState({loading: true})

    const headers= getHeaders();
    
    fetch(`${QUESTIONS_API}/api/question?set=${this.state.questionSet}`, { headers})
      .then(res => res.json())
      .then(questions => {
        this.setState({loading: false, items: questions, isNotAuthorized:false})
      })
      .catch(err=>{
        let isNotAuthorized=false;
        if (err.response && (err.response.status>400 && err.response.status<404)){
          isNotAuthorized=true;
        }
        this.setState({loading: false,isNotAuthorized, items: []})
      })
  }

  onOpenEditModal = (item) => this.setState({ openEditModal: true, editingItem: item });
  onCloseEditModal = (e) =>{
    e.preventDefault()
    this.setState({ openEditModal: false, editingItem: null });
  }
  onCloseUploadModal = (e) =>{
    e.preventDefault()
    this.setState({openUploadModal: false})
  }

  handleSort = clickedColumn => () => {
    const { items, sortDirection, sortColumn } = this.state

    if (sortColumn !== clickedColumn) {
      this.setState({
        sortColumn: clickedColumn,
        items: items.sort((a,b)=>a[clickedColumn]>b[clickedColumn]?1:-1),
        sortDirection: 'ascending',
      })
      return
    }
    this.setState({
      items: items.reverse(),
      sortDirection: sortDirection === 'ascending' ? 'descending' : 'ascending',
    })
  }

  handleNewQuestion = ()=>{
    const items= [].concat(this.state.items||[]);
    const newItem={_id:"new"+uuidv1(), question:"", category:"Not Categorized"}
    items.push(newItem);
    this.setState({
      items,
      editingItem: newItem,
      openEditModal: true
    })
  }

  handleUploadQuestions = ()=>{
    this.setState({
      openUploadModal: true,
      filePreview:"",
      fileData:""
    })
  }

  handleSaveChanges = async ()=> {
    this.setState({loading: true});
    const headers=getHeaders();
    headers["Content-Type"]="application/json";
    const errors=[];
    const newQuestions=[]
    const modifiedQuestions=[]
    let items=[];
    this.state.items.forEach(v=>{
      if (v._id && v._id.substr(0,3)==='new') {
        newQuestions.push(v);
      } else if (v.isModified===true) {
        modifiedQuestions.push(v)
      } else {
        items.push(v);
      }
    })
    if (newQuestions.length>0) {
      const body = JSON.stringify({
        questions:newQuestions
      })
      try {
        const res = await fetch(`${QUESTIONS_API}/api/question?set=${this.state.questionSet}`, { headers, method: 'POST',  body})

        if (res.ok) {
          const questions = await res.json();
          notify.show(`Added ${questions.length} new questions.`)
          items = items.concat(questions);
        } else {
          console.log(res)
          errors.push(res.statusText)
          items = items.concat(newQuestions);
        }
      } catch(err) {
        console.error(err)
        errors.push(JSON.stringify(err));
        items = items.concat(newQuestions);
      }
    }
    if (modifiedQuestions.length>0) {
      try {
        const body = JSON.stringify({
          questions: modifiedQuestions
        })
        const res = await fetch(`${QUESTIONS_API}/api/question?set=${this.state.questionSet}`, { headers, method: 'PUT',  body})
        if (res.ok) {
          modifiedQuestions.forEach(q=>{q.isModified=undefined})
          notify.show(`Updated ${modifiedQuestions.length} questions.`)
        } else {
          errors.push(res.statusText)
        }
      } catch (err) {
        console.error(err)
        errors.push("Unknown server error.");
      }
      items = items.concat(modifiedQuestions);
    }

    if (errors.length>0) {
      this.setState({
        loading: false,
        errorHdr:`There have been some errors trying to save changes.`,
        errors
      })
    }
    this.setState({items, loading: false})
  }

  handlePreview = () => {
    const currentFile = this.fileInput.current.files[0];
    if (!currentFile) {
      this.setState({ filePreview: "", fileData:""})
      return;
    }
    if (currentFile.type!=='text/csv'){
      this.setState({ filePreview: "Unsupported type. Please specify a csv file", fileData:""})
    } else {
      const fr = new FileReader();
      fr.onload = ()=>{
        this.setState({ filePreview: fr.result, fileData: fr.result})
      };
      fr.readAsText(currentFile);
    }
  }

  handleUpload = event => {
    event.preventDefault();
    const fileData = this.state.filePreview || "";
    const newItems = [];
    csv.fromString(fileData,{headers: false, delimiter:'\t'})
      .on('data', (data)=>{
        const _id="new"+uuidv1();
        const question=data[0]||''
        let category=data[1];
        let options=[];
        let tags=[];
        if (category==='') {
          category="Not Categorized"
        }
        if (data.length>2) {
          const opts=data[2].split('|').filter(v=>v!=='');
          options=opts.map((v,i)=>{ return {option: String.fromCharCode(65+i)+"", value: v} })
        }
        if (data.length>3 && data[3]!=='0') {
          tags=data[3].split(' ');
        }
        newItems.push({
          _id, 
          question,
          category,
          options,
          tags
        })
      })
      .on('end', () => {
        this.setState({
          openUploadModal: false,
          items:[...newItems,this.state.items],
        })
      })
  }

  handleEditingItemChange = (item) => {
    const items= [].concat(this.state.items||[]);
    for( var i = 0; i < items.length; i++){ 
      if ( items[i]._id === item._id) {
        items[i]=item;
        items[i].isModified=true;
        break;
      }
    }
    this.setState({items,openEditModal: false, editingItem: null})
  }
  
  renderGrid(){
    const {items=[], sortDirection, sortColumn}=this.state;
    return (<div>
    <Segment attached='top'>
      <Button.Group color='blue'>
        <ResponsiveButton onClick={this.handleNewQuestion} icon='question'text='New Question' minWidth={768}/>
        <ResponsiveButton onClick={this.handleUploadQuestions} icon='cloud upload' text='Upload Questions' minWidth={768}/>
        <ResponsiveButton onClick={this.handleSaveChanges} icon='save' text='Save Changes'  minWidth={768}/>
      </Button.Group>
      <Button.Group floated='right' color='green'>
          <ResponsiveButton onClick={this.handleNewQuestionMap} icon='map' text='New Question Set' minWidth={768}/>
      </Button.Group>
    </Segment>
    <Segment attached>
      <Table compact celled selectable sortable striped>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>
                <Checkbox checked={this.state.allSelected} onChange={(e)=>{
                  const {items} = this.state;
                  items.forEach(i=>{i.isSelected=e.target.checked});
                  let allSelected=e.target.checked;
                  this.setState({items, allSelected})
                }}/>
            </Table.HeaderCell>
            <Table.HeaderCell />
            <Table.HeaderCell 
              sorted={sortColumn === 'question' ? sortDirection : null}
              onClick={this.handleSort('question')}>Question</Table.HeaderCell>
            <Table.HeaderCell 
              sorted={sortColumn === 'category' ? sortDirection : null}
              onClick={this.handleSort('category')}>Category</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items.map((q,i)=>{
            let isNew=(q._id||'').substr(0,3)==='new';
            let index=i;
            return <Table.Row key={q._id} positive={isNew} warning={q.isModified}>
              <Table.Cell collapsing>
                <Checkbox checked={q.isSelected} onChange={e=>{
                    const {items} = this.state;
                    items[index].isSelected = e.target.checked;
                    this.setState({items});
                }}/>
              </Table.Cell>
              <Table.Cell collapsing>
                <Popup trigger={<Button circular icon='edit' onClick={e=>{this.setState({ openEditModal: true, editingItem: q });}}/>}>
                  click here to edit the question
                </Popup>
              </Table.Cell>
              <Table.Cell>{q.question}</Table.Cell>
              <Table.Cell >{q.category}</Table.Cell>
              <Table.Cell collapsing>
              < Popup trigger={<Button circular icon='delete' onClick={e=>{
                  let items=this.state.items.slice(0,i).concat(this.state.items.slice(i+1));
                  let deletedItems=[].push(q);
                  this.setState({items, deletedItems})
                }}/>}>click here to delete the question</Popup>
              </Table.Cell>
            </Table.Row>
          })}
        </Table.Body>
        <Table.Footer>
          <Table.Row>
              <Table.HeaderCell colSpan="5">
              </Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      </Table>
    </Segment>
    </div>)
  }

  renderFilterPanel(){
    return <Segment basic>
    </Segment>
  }

  renderError(){
    const {errorHdr='', errors=[]} = this.state;
    if (errorHdr==='') return null
    return <Message error header={errorHdr} list={errors} />
  }

  renderQuestionBank(){
    return <Segment basic>
      <Header as='h2'>Question Bank</Header>
      {this.renderFilterPanel()}
      <Divider/>
      {this.renderGrid()}
      {this.renderEditModal()}
      {this.renderUploadModal()}
    </Segment>
  }
  render() {
    if (!this.state.loading && this.state.isNotAuthorized) {
      return <div style={{display:'flex', justifyContent:'center'}}>
        <h4>Not Authorized.</h4>
      </div> 
    }
    return <Page loading={this.state.loading}>
      {this.renderError()}
      <Segment basic>
        <Tab panes={[
          { menuItem: 'Question Bank', render: () => <Tab.Pane>{this.renderQuestionBank()}</Tab.Pane> },
          { menuItem: 'Question Sets', render: () => <Tab.Pane>{<QuestionSet/>}</Tab.Pane> },
        ]}/>
      </Segment>
    </Page>
  }
  renderEditModal(){
    return <Modal open={this.state.openEditModal} onClose={this.onCloseEditModal}>
      <Segment raised>
        <Header as={'h2'}><Icon name='edit'/> Edit Question</Header>
        <QuestionForm question={this.state.editingItem} onChange={this.handleEditingItemChange} onClose={this.onCloseEditModal}/>
      </Segment>
    </Modal>
  }

  renderUploadModal(){
    return <Modal open={this.state.openUploadModal} onClose={this.onCloseUploadModal}>
      <Segment>
        <Header as={'h2'}><Icon name='file excel'/> Upload Questions</Header>
        <Form onSubmit={this.handleUpload}>
            <Form.Field>
              <label>CSV File</label>
              <input type="file" ref={this.fileInput} onChange={this.handlePreview}/>
            </Form.Field>
            <Form.Field>
              <label>Preview</label>
              <Form.TextArea value={this.state.filePreview} readOnly rows={5}/>
            </Form.Field>
            <Form.Group widths='equal'>
              <Form.Button type="submit" color='green'>Upload</Form.Button>
              <FormButton onClick={this.onCloseUploadModal} floated="right">Cancel</FormButton>
            </Form.Group>
        </Form>
      </Segment>
    </Modal>
  }
}

export default AdminQuestionsPage;
