import React, {Component} from 'react';

import VError from 'verror';

// import { useDrag, useDrop } from 'react-dnd'
import 'react-tageditor/dist/style/default.css';
import { Form, Dropdown, Header, Segment, Table, Icon, Checkbox, Button, Divider, Message, Popup, Responsive,Modal, FormButton, Accordion, Input, Menu, TableBody } from 'semantic-ui-react';

import SemanticDatepicker from 'react-semantic-ui-datepickers';
import 'react-semantic-ui-datepickers/dist/react-semantic-ui-datepickers.css';

import { notify } from 'react-notify-toast'

import QuestionSet from '../../domain/QuestionSet';
// import PagedGrid from './PagedGrid';
import moment from 'moment';
import QuestionForm from './QuestionForm';
import ResponsiveButton from '../../components/ResponsiveButton';

export default class QuestionSetForm extends Component {
  constructor(props){
    super(props);
    this.state={
      loading:true,
      questionSetList:[{key:'default', text:'default', value:'default'}],
      questionSet:{key:'default', text:'default', value:'default'},
      offset:0,
      limit:25,
      items:[],
      totalCount: 0,
      sortColumn:'date',
      sortDirection:'ascending',
      selectedDates:[],
      editingItem: {questions:[]},
    }
  }

  async componentDidMount(){
    await this.loadQuestionSets();
    await this.loadQuestionSet();
  }

  handleSort = clickedColumn => () => {
    const { sortDirection, sortColumn } = this.state

    if (sortColumn !== clickedColumn) {
      this.setState({
        sortColumn: clickedColumn,
        sortDirection: 'ascending',
      },async ()=> await this.loadQuestionSet());
      return
    }
    this.setState({
      sortDirection: sortDirection === 'ascending' ? 'descending' : 'ascending',
    }, async () => await this.loadQuestionSet());
  }

  _setLoadingState=(msg)=>{
    this.setState({loading: true, loadingMessage: msg});
  }

  loadQuestionSet=async (offset, limit) => {
    const {questionSet} = this.state;
    if (!questionSet) return;

    let error=null;
    this.setState({loading: true, error})
    try{
      const {offset, limit} = this.state;
      const sort=(this.state.sortDirection[0]==='d'?'-':'') + this.state.sortColumn;
      const {items, totalCount} = await QuestionSet.getSet(questionSet,{offset, limit, sort});
      this.setState({items, totalCount});
    } catch (err) {
      console.error('Failed loaded data for the question set', err);
      error={
        header: err.Message||'Unable to fetch question set',
        messages: [VError.cause(err)]
      };
    } finally {
      this.setState({error, loading: false})
    }
  }

  loadQuestionSets=async ()=>{
    this._setLoadingState('loading available questionsets...');
    let error=null;
    try {
      const qsnames = await QuestionSet.getAvailableSets();

      const questionSetList=qsnames.map(qs=>{ return {key: qs, text: qs, value: qs}})

      if (questionSetList.length===0) {
        questionSetList.push({key:'default', text:'default', value:'default'});
      }

      this.setState({questionSetList, questionSet: questionSetList[0].value, loading: false, error:null});
      return questionSetList;
    } catch (err) {
      console.error(err);
      error={
        header:err.message,
        messages: [VError.cause(err)]
      };
    } finally {
      this.setState({loading: false, error})
    }
  }
  handleSaveChanges=async ()=>{
    this._setLoadingState('saving the updated questionsets...');
    let error=null;
    try { 
      const {items} = this.state;
      const modified = items.filter(q=>q.isModified).map(q=>{
        const qs = q.toObject()
        qs.questions = qs.questions.map((q)=>{return Object.assign(q,{_id: null})});
        return qs;
      });
      await QuestionSet.update(modified);
    } catch (err) {
      console.error(err);
      error={
        header:err.message,
        messages: [VError.cause(err)]
      };
    } finally {
      this.setState({loading: false, error})
    } 
  }

  renderError(){
    const {error=null} = this.state;
    if (error==null) return null
    return <Message error header={error.header} list={error.messages} />
  }

  handleDateChange = (dates)=>{
    this.setState({selectedDates: dates})
  }

  loadPage = (pageNumber) => {
    this.setState({offset: (pageNumber-1)*this.state.limit, loading: true},()=>this.loadQuestionSet());
  }

  renderFilterBar(){
    const {filterbar=false} = this.props;

    if (!filterbar) {
      return null;
    }

    return <Segment basic>
      <Accordion panels={[
        { 
          key: 'filterpane',
          title: {
            content:<span><Icon name='filter'/> Filter Options</span>
          },
          content:{
            content:
            <Form onSubmit={this.loadQuestionSet}>
              <Form.Group widths='equal'>
                <Form.Field>
                  <label>Question Set</label>
                  <Dropdown 
                    placeholder='Select QuestionSet'
                    fluid
                    selection
                    options={this.state.questionSetList}
                    value={this.state.questionSet}
                    onChange={(e,{value})=> {
                      this.setState({questionSet: value})
                    }}
                  />
                </Form.Field>
                <Form.Field>
                  <label>Date Range</label>
                  <SemanticDatepicker className='fluid'
                    onDateChange={this.handleDateChange}
                    selected={this.state.selectedDates}
                    type="range"/>
                </Form.Field>
              </Form.Group>
              <Form.Field control={Button}>Refresh</Form.Field>
            </Form>
          }
        }
      ]}/>
    </Segment>
  }

  render() {
    return <Segment style={{minHeight: 800}}>
      <Header as={'h2'}>Question Sets</Header>
      {this.renderFilterBar()}
      <Divider/>
      {this.renderError()}
      <Segment attached='top'>
        <Button.Group color='blue'>
          <ResponsiveButton onClick={this.handleSaveChanges} icon='save' text='Save Changes'  minWidth={768}/>
        </Button.Group>
        <Button.Group floated='right' color='green'>
        </Button.Group>
      </Segment>
      <Segment attached>
        {this.renderGrid()}
      </Segment>
      {this.renderEditModal()}
    </Segment>
  }

  renderGrid() {
    const {items=[], sortDirection, sortColumn}=this.state;
    const pages=[];
    let i=0;
    do{
      i++
      pages.push(i);
    }
    while(i<(this.state.totalCount/this.state.limit));

    const currentPage = Math.trunc((this.state.offset+1)/this.state.limit)+1;
    return <Table compact celled selectable sortable striped>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>
              <Checkbox checked={this.state.allSelected} onChange={(e)=>{
                let allSelected=!this.state.allSelected;
                const items=this.state.items;
                for(let i=0;i<items.length;++i) { items[i].isSelected=allSelected}
                this.setState({allSelected, items:[...items]})
              }}/>
          </Table.HeaderCell>
          <Table.HeaderCell/>
          <Table.HeaderCell
            sorted={sortColumn === 'date' ? sortDirection : null}
            onClick={this.handleSort('date')}>Date
          </Table.HeaderCell>
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
          {items.map((qs,i)=>{
            const isOld=moment(qs.date).isBefore(new Date());
            const q=qs.questions[0];
            const isNew=(q._id||'').substr(0,3)==='new';
            const index=i;
            const style= isOld?{ color: 'gray', fontStyle: 'italic'}:{};
            return <Table.Row key={q._id} positive={isNew} warning={qs.isModified} style={style}>
              <Table.Cell collapsing>
                <Checkbox checked={q.isSelected} onChange={e=>{
                    const {items} = this.state;
                    let allSelected=true;
                    items[index].isSelected = !(items[index].isSelected);
                    for(let idx=0;idx<items.length; idx++) { allSelected=allSelected && items[idx].isSelected}
                    this.setState({items:[...items], allSelected});
                }}/>
              </Table.Cell>
              <Table.Cell>
                {isOld?null:(
                  <Popup trigger={<Button circular icon='edit' onClick={e=>{this.setState({ openEditModal: true, editingItem: qs });}}/>}>
                    click here to edit the question
                  </Popup>
                )}
              </Table.Cell>
              <Table.Cell collapsing>
                {moment(qs.date).format("Do (dd) MMM'YY")}
              </Table.Cell>
              <Table.Cell>{q.question}</Table.Cell>
              <Table.Cell >{q.category}</Table.Cell>
              <Table.Cell collapsing>
              {isOld?null:(
              < Popup trigger={<Button circular icon='delete' onClick={e=>{
                  let items=this.state.items.slice(0,i).concat(this.state.items.slice(i+1));
                  let deletedItems=[].push(q);
                  this.setState({items, deletedItems})
                }}/>}>click here to delete the question</Popup>)}
              </Table.Cell>
            </Table.Row>
          })}
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.HeaderCell colSpan='6'>
            <Menu floated='right' pagination>
              <Menu.Item as='a' icon disabled={currentPage===1}>
                <Icon name='chevron left' />
              </Menu.Item>
              {pages.map(i=><Menu.Item key={i} as='a' 
                active={currentPage===i}
                onClick={e=>{
                  const pageNumber=i;
                  this.loadPage(pageNumber);
                }} >{i}</Menu.Item>)}
              <Menu.Item as='a' icon disabled={currentPage===pages.length}>
                <Icon name='chevron right' />
              </Menu.Item>
            </Menu>
          </Table.HeaderCell>
        </Table.Row>
      </Table.Footer>
    </Table>
  }

  onOpenEditModal = (item) => this.setState({ openEditModal: true, editingItem: item });
  onCloseEditModal = (e) =>{
    e.preventDefault()
    this.setState({ openEditModal: false, editingItem: {questions:[]} });
  }

  handleEditingItemChange = (item) => {
    const items= [...this.state.items];
    for( var i = 0; i < items.length; i++){ 
      if (items[i].questions[0]._id === item._id){
        items[i].questions[0]=item;
        items[i].isModified=true;
        break;
      }
    }
    this.setState({items,openEditModal: false, editingItem: {questions:[]}})
  }

  handleQsDateChange = (date) =>{
    console.log(date);
    const {editingItem} = this.state;
    editingItem.date = moment.utc(date);
    editingItem.isModified=true;
    //this.setState({editingItem});
  }

  renderEditModal(){
    return <Modal open={this.state.openEditModal} onClose={this.onCloseEditModal}>
      <Segment raised>
        <Header as={'h2'}><Icon name='edit'/> Edit Question</Header>
        <Form.Field>
          <label>Date</label>
          <SemanticDatepicker className='fluid'
            minDate={new Date()}
            onDateChange={this.handleQsDateChange}
            selected={moment(this.state.editingItem.date).toDate()}
            type="basic"/>
        </Form.Field>
        <QuestionForm question={this.state.editingItem.questions[0]} onChange={this.handleEditingItemChange} onClose={this.onCloseEditModal}/>
      </Segment>
    </Modal>
  }
}
